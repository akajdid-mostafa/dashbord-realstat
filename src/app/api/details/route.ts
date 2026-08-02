import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
