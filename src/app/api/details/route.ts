import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseJsonBody } from '@/lib/validation';

export async function POST(req: Request) {
  const body = (await parseJsonBody(req)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    constructionyear,
    surface,
    rooms,
    Guard,
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
    Proprietary,
  } = body;

  if (!postId) {
    return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
  }

  try {
    const detail = await prisma.detail.create({
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
        Proprietary: Proprietary as string | undefined,
        Guard: Guard as string | undefined,
        post: { connect: { id: Number(postId) } },
      },
    });

    const post = await prisma.post.findUnique({
      where: { id: Number(postId) },
      select: {
        title: true,
        type: { select: { type: true } },
        category: { select: { name: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const updatedTitle = `${post.type?.type ?? ''} ${post.category?.name ?? ''} / ${String(postId)} ${surface ? `/ surface: ${surface as string}` : ''}`;

    const updatedPost = await prisma.post.update({
      where: { id: Number(postId) },
      data: { title: updatedTitle },
    });

    return NextResponse.json({ detail, updatedPost }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating detail:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Error creating detail', details: errorMessage }, { status: 400 });
  }
}

export async function GET() {
  try {
    const details = await prisma.detail.findMany({
      include: {
        post: true,
      },
    });

    return NextResponse.json(details, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching details:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Error fetching details', details: errorMessage }, { status: 500 });
  }
}
