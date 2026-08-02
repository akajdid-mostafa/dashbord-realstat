import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseJsonBody, parseNumericId } from "@/lib/validation";

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

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const id = parseNumericId(params.id);
  if (id === null) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const dateReserve = await prisma.dateReserve.findUnique({
      where: { id },
      include: {
        post: true,
      },
    });

    if (!dateReserve) {
      return NextResponse.json(
        { error: "DateReserve not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(dateReserve, { status: 200 });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching DateReserve by ID:", errorMessage);
    return NextResponse.json(
      { error: "Error fetching DateReserve" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  const id = parseNumericId(params.id);
  if (id === null) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const body = (await parseJsonBody(req)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { dateDebut, dateFine, fullName, price, CIN } = body;

  if (!isValidReserveDate(dateDebut) || !isValidReserveDate(dateFine)) {
    return NextResponse.json({ error: "Invalid date value" }, { status: 400 });
  }

  if (
    price !== undefined &&
    price !== null &&
    price !== "" &&
    parseFinitePrice(price) === null
  ) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  const parsedDateDebut = toValidatedDate(dateDebut);
  const parsedDateFine = toValidatedDate(dateFine);

  if (parsedDateDebut && parsedDateFine && parsedDateDebut >= parsedDateFine) {
    return NextResponse.json(
      { error: "dateDebut must be less than dateFine" },
      { status: 400 },
    );
  }

  try {
    const existing = await prisma.dateReserve.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "DateReserve not found" },
        { status: 404 },
      );
    }

    const updatedDateReserve = await prisma.dateReserve.update({
      where: { id },
      data: {
        dateDebut: parsedDateDebut,
        dateFine: parsedDateFine,
        fullName: fullName !== undefined ? (fullName as string) : undefined,
        price:
          price !== undefined && price !== null && price !== ""
            ? (parseFinitePrice(price) as number)
            : undefined,
        CIN: CIN !== undefined ? (CIN as string) : undefined,
      },
    });

    return NextResponse.json(updatedDateReserve, { status: 200 });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error updating DateReserve by ID:", errorMessage);
    return NextResponse.json(
      { error: "Error updating DateReserve" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const id = parseNumericId(params.id);
  if (id === null) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const existing = await prisma.dateReserve.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "DateReserve not found" },
        { status: 404 },
      );
    }

    const deletedDateReserve = await prisma.dateReserve.delete({
      where: { id },
    });

    return NextResponse.json(deletedDateReserve, { status: 200 });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error deleting DateReserve by ID:", errorMessage);
    return NextResponse.json(
      { error: "Error deleting DateReserve" },
      { status: 500 },
    );
  }
}
