import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validation";

export async function POST(req: Request) {
  const body = (await parseJsonBody(req)) as {
    email?: unknown;
    password?: unknown;
  } | null;

  if (
    !body ||
    typeof body.email !== "string" ||
    typeof body.password !== "string"
  ) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 },
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const isValid = await bcrypt.compare(body.password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const token = await signToken(user.id);

    return NextResponse.json(
      { token, user: { email: user.email } },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error(
      "Error during login:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json({ error: "Error logging in" }, { status: 500 });
  }
}
