import { NextResponse } from 'next/server';
import { Status } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { uploadImages, destroyImagesByUrl } from '@/lib/cloudinary';
import { parseJsonBody, parseNumericId, isValidEnum } from '@/lib/validation';

function publicReservations(reserves: { id: number }[] | undefined) {
  return (reserves ?? []).map((reserve) => ({ id: reserve.id }));
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = parseNumericId(params.id);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid or missing ID' }, { status: 400 });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        category: true,
        type: true,
        Detail: true,
        DateReserve: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(
      { ...post, DateReserve: publicReservations(post.DateReserve) },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching post:', errorMessage);
    return NextResponse.json({ error: 'Error fetching post', details: errorMessage }, { status: 500 });
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
    img,
    lat,
    lon,
    prix,
    adress,
    ville,
    status,
    title,
    categoryId,
    typeId,
    youtub,
    comment,
  } = body;

  if (!isValidEnum(status, Object.values(Status))) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
  }

  try {
    if (categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: Number(categoryId) },
      });

      if (!categoryExists) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }
    }

    if (typeId) {
      const typeExists = await prisma.type.findUnique({
        where: { id: Number(typeId) },
      });

      if (!typeExists) {
        return NextResponse.json({ error: 'Type not found' }, { status: 404 });
      }
    }

    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    let uploadedImages: string[] = existingPost.img as string[];

    if (img && Array.isArray(img)) {
      const incomingUrls = img.filter(
        (image): image is string => typeof image === 'string' && !image.startsWith('data:')
      );
      const newImages = img.filter(
        (image): image is string => typeof image === 'string' && image.startsWith('data:')
      );

      const unchanged =
        newImages.length === 0 &&
        incomingUrls.length === (existingPost.img as string[]).length &&
        incomingUrls.every((url) => (existingPost.img as string[]).includes(url));

      if (!unchanged) {
        let uploadedNew: string[] = [];
        try {
          uploadedNew = await uploadImages(newImages);
        } catch (error) {
          await destroyImagesByUrl(uploadedNew);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('Error uploading post images:', errorMessage);
          return NextResponse.json({ error: 'Error updating post', details: errorMessage }, { status: 500 });
        }
        uploadedImages = [...incomingUrls, ...uploadedNew];

        const removed = (existingPost.img as string[]).filter(
          (url) => !incomingUrls.includes(url)
        );
        await destroyImagesByUrl(removed);
      }
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        img: uploadedImages,
        lat: lat !== undefined ? parseFloat(lat as string) : existingPost.lat,
        lon: lon !== undefined ? parseFloat(lon as string) : existingPost.lon,
        prix: prix as string,
        adress: adress as string,
        ville: ville as string,
        status: status as Status,
        title: title as string,
        youtub: youtub as string | undefined,
        comment: comment as string | undefined,
        category: categoryId ? { connect: { id: Number(categoryId) } } : undefined,
        type: typeId ? { connect: { id: Number(typeId) } } : undefined,
      },
      include: {
        category: true,
        type: true,
        Detail: true,
        DateReserve: true,
      },
    });

    return NextResponse.json(
      { ...updatedPost, DateReserve: publicReservations(updatedPost.DateReserve) },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating post:', errorMessage);
    return NextResponse.json({ error: 'Error updating post', details: errorMessage }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = parseNumericId(params.id);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid or missing ID' }, { status: 400 });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        Detail: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.img && Array.isArray(post.img)) {
      await destroyImagesByUrl(post.img as string[]);
    }

    if (post.Detail) {
      await prisma.detail.delete({
        where: { id: post.Detail.id },
      });
    }
    await prisma.post.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Post and associated detail deleted successfully' },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting post and detail:', errorMessage);
    return NextResponse.json({ error: 'Error deleting post and detail', details: errorMessage }, { status: 500 });
  }
}
