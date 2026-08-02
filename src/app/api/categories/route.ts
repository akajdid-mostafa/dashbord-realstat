import { NextResponse } from 'next/server';
import { CategoryName } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const categoryName = url.searchParams.get('name') as CategoryName | null;

  if (!categoryName) {
    try {
      const categories = await prisma.category.findMany();

      return NextResponse.json(categories, { status: 200 });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching all categories:', errorMessage);
      return NextResponse.json(
        { error: 'Error fetching all categories', details: errorMessage },
        { status: 500 }
      );
    }
  }

  try {
    const category = await prisma.category.findFirst({
      where: { name: categoryName },
      include: {
        posts: true,
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(category.posts, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching posts by category:', errorMessage);
    return NextResponse.json(
      { error: 'Error fetching posts by category', details: errorMessage },
      { status: 500 }
    );
  }
}
