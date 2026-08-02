import { NextResponse } from 'next/server';
import { TypeName } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const typeName = url.searchParams.get('name') as TypeName | null;

  if (!typeName) {
    try {
      const types = await prisma.type.findMany();

      return NextResponse.json(types, { status: 200 });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching all types:', errorMessage);
      return NextResponse.json(
        { error: 'Error fetching all types', details: errorMessage },
        { status: 500 }
      );
    }
  }

  try {
    const type = await prisma.type.findFirst({
      where: { type: typeName },
      include: {
        posts: true,
      },
    });

    if (!type) {
      return NextResponse.json({ error: 'Type not found' }, { status: 404 });
    }

    return NextResponse.json(type.posts, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching posts by type:', errorMessage);
    return NextResponse.json(
      { error: 'Error fetching posts by type', details: errorMessage },
      { status: 500 }
    );
  }
}
