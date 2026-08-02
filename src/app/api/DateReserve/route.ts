import { NextResponse } from "next/server";
import { CategoryName, Status } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  parseJsonBody,
  missingRequiredFields,
  parseNumericId,
} from "@/lib/validation";

function formatDateToYYYYMMDD(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getDatesInRange(dateDebut: Date, dateFine: Date): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(dateDebut);
  while (currentDate <= dateFine) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

function isValidReserveDate(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return true;
  return !isNaN(new Date(value as string).getTime());
}

function toValidatedDate(value: unknown): Date | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return new Date(value as string);
}

function parseFinitePrice(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const price = Number(value);
  return Number.isFinite(price) ? price : null;
}

export async function GET() {
  try {
    const dateReserves = await prisma.dateReserve.findMany({
      include: {
        post: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const formattedDateReserves = dateReserves.map((dateReserve) => {
      const dateDebut = dateReserve.dateDebut
        ? new Date(dateReserve.dateDebut)
        : null;
      const dateFine = dateReserve.dateFine
        ? new Date(dateReserve.dateFine)
        : null;

      const datesInRange =
        dateDebut && dateFine ? getDatesInRange(dateDebut, dateFine) : [];

      return {
        ...dateReserve,
        dateDebut: dateDebut ? formatDateToYYYYMMDD(dateDebut) : null,
        dateFine: dateFine ? formatDateToYYYYMMDD(dateFine) : null,
        reservedDates: datesInRange.map((date) => formatDateToYYYYMMDD(date)),
      };
    });

    return NextResponse.json(formattedDateReserves, { status: 200 });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching DateReserves:", errorMessage);
    return NextResponse.json(
      { error: "Error fetching DateReserves" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const body = (await parseJsonBody(req)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { dateDebut, dateFine, fullName, price, CIN, postId } = body;

  const missing = missingRequiredFields(body, ["fullName", "CIN", "postId"]);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Missing required fields", fields: missing },
      { status: 400 },
    );
  }

  if (!isValidReserveDate(dateDebut) || !isValidReserveDate(dateFine)) {
    return NextResponse.json({ error: "Invalid date value" }, { status: 400 });
  }

  const parsedPrice = parseFinitePrice(price);
  if (parsedPrice === null) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  const parsedPostId = parseNumericId(
    postId === undefined ? undefined : String(postId),
  );
  if (parsedPostId === null) {
    return NextResponse.json({ error: "Invalid postId" }, { status: 400 });
  }

  const parsedDateDebut = toValidatedDate(dateDebut);
  const parsedDateFine = toValidatedDate(dateFine);

  if (parsedDateDebut && parsedDateFine && parsedDateDebut >= parsedDateFine) {
    return NextResponse.json(
      { error: "dateDebut must be less than dateFine" },
      { status: 400 },
    );
  }

  const post = await prisma.post.findUnique({
    where: { id: parsedPostId },
    include: { category: true },
  });

  if (!post) {
    return NextResponse.json(
      { error: "Post with the given ID does not exist" },
      { status: 400 },
    );
  }

  try {
    const dateReserve = await prisma.dateReserve.create({
      data: {
        dateDebut: parsedDateDebut ?? null,
        dateFine: parsedDateFine ?? null,
        fullName: fullName as string,
        price: parsedPrice,
        CIN: CIN as string,
        post: { connect: { id: parsedPostId } },
      },
    });

    if (post.category?.name === CategoryName.Location) {
      await prisma.post.update({
        where: { id: parsedPostId },
        data: { status: dateFine ? Status.available : Status.taken },
      });
    } else {
      await prisma.post.update({
        where: { id: parsedPostId },
        data: { status: Status.taken },
      });
    }

    const formattedDateReserve = {
      ...dateReserve,
      dateDebut: dateReserve.dateDebut
        ? formatDateToYYYYMMDD(dateReserve.dateDebut)
        : null,
      dateFine: dateReserve.dateFine
        ? formatDateToYYYYMMDD(dateReserve.dateFine)
        : null,
    };

    return NextResponse.json(formattedDateReserve, { status: 201 });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating DateReserve:", errorMessage);
    return NextResponse.json(
      { error: "Error creating DateReserve" },
      { status: 500 },
    );
  }
}
