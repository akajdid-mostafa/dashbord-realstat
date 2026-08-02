import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseJsonBody, parseNumericId } from '@/lib/validation';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = parseNumericId(params.id);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid or missing ID' }, { status: 400 });
  }

  try {
    const detail = await prisma.detail.findUnique({
      where: { id },
    });

    if (!detail) {
      return NextResponse.json({ error: 'Detail not found' }, { status: 404 });
    }

    return NextResponse.json(detail, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching detail:', error);
    return NextResponse.json({ error: 'Error fetching detail' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const id = parseNumericId(params.id);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid or missing ID' }, { status: 400 });
  }

  const body = (await parseJsonBody(req)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    constructionyear,
    surface,
    rooms,
    bedromms,
    livingrooms,
    kitchen,
    bathrooms,
    furnished,
    floor,
    elevator,
    parking,
    balcony,
    pool,
    facade,
    documents,
    postId,
    Guard,
  } = body;

  try {
    const existingDetail = await prisma.detail.findUnique({
      where: { id },
    });

    if (!existingDetail) {
      return NextResponse.json({ error: 'Detail not found' }, { status: 404 });
    }

    const updatedDetail = await prisma.detail.update({
      where: { id },
      data: {
        constructionyear: constructionyear as string | undefined,
        surface: surface as string | undefined,
        rooms: rooms as number | undefined,
        bedromms: bedromms as number | undefined,
        livingrooms: livingrooms as string | undefined,
        kitchen: kitchen as string | undefined,
        bathrooms: bathrooms as number | undefined,
        furnished: furnished as string | undefined,
        floor: floor as string | undefined,
        elevator: elevator as string | undefined,
        parking: parking as string | undefined,
        balcony: balcony as string | undefined,
        pool: pool as string | undefined,
        facade: facade as string | undefined,
        documents: documents as string | undefined,
        Guard: Guard as string | undefined,
        ...(postId !== undefined && postId !== null && postId !== ''
          ? { post: { connect: { id: Number(postId) } } }
          : {}),
      },
    });

    return NextResponse.json(updatedDetail, { status: 200 });
  } catch (error: unknown) {
    console.error('Error updating detail:', error);
    return NextResponse.json({ error: 'Error updating detail' }, { status: 500 });
  }
}
