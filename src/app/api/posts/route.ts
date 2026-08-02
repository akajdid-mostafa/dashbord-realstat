import { NextResponse } from 'next/server';
import { Prisma, CategoryName, Status, TypeName } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { uploadImages, destroyImagesByUrl } from '@/lib/cloudinary';
import { parseJsonBody, parseJsonField } from '@/lib/validation';

function publicReservations(reserves: { id: number }[] | undefined) {
  return (reserves ?? []).map((reserve) => ({ id: reserve.id }));
}

async function destroyUploadedOnFailure(imageUrls: string[]) {
  try {
    await destroyImagesByUrl(imageUrls);
  } catch (error) {
    console.error('Cleanup destroy failed:', error);
  }
}

export async function POST(req: Request) {
  const body = (await parseJsonBody(req)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    lat,
    lon,
    prix,
    adress,
    ville,
    status,
    categoryId,
    typeId,
    Detail,
    img,
    youtub,
    comment,
  } = body;

  let parsedDetail: Record<string, unknown> | null = null;
  if (Detail) {
    const detail = parseJsonField(Detail);
    if (detail === null || typeof detail !== 'object') {
      return NextResponse.json({ error: 'Invalid Detail format' }, { status: 400 });
    }
    parsedDetail = detail as Record<string, unknown>;
  }

  const missingFields: string[] = [];
  if (!img || !Array.isArray(img) || (img as unknown[]).length === 0) missingFields.push('img');
  if (!lat) missingFields.push('lat');
  if (!lon) missingFields.push('lon');
  if (!prix) missingFields.push('prix');
  if (!adress) missingFields.push('adress');
  if (!ville) missingFields.push('ville');
  if (!status) missingFields.push('status');
  if (!categoryId) missingFields.push('categoryId');
  if (!typeId) missingFields.push('typeId');

  if (missingFields.length > 0) {
    return NextResponse.json({ error: 'Missing required fields', fields: missingFields }, { status: 400 });
  }

  const category = await prisma.category.findUnique({
    where: { id: parseInt(categoryId as string, 10) },
    select: { name: true },
  });
  const type = await prisma.type.findUnique({
    where: { id: parseInt(typeId as string, 10) },
    select: { type: true },
  });

  if (!category || !type) {
    return NextResponse.json({ error: 'Invalid categoryId or typeId' }, { status: 400 });
  }

  const imageUrls = (img as string[]).filter((image): image is string => typeof image === 'string');

  let uploadedImages: string[] = [];
  try {
    uploadedImages = await uploadImages(imageUrls);
  } catch (error) {
    await destroyUploadedOnFailure(uploadedImages);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Cloudinary upload failed:', errorMessage);
    return NextResponse.json({ error: 'Error creating post', details: errorMessage }, { status: 500 });
  }

  try {
    const post = await prisma.post.create({
      data: {
        img: uploadedImages,
        lat: parseFloat(lat as string),
        lon: parseFloat(lon as string),
        prix: prix as string,
        adress: adress as string,
        ville: ville as string,
        status: status as Status,
        title: '',
        youtub: youtub as string | undefined,
        comment: comment as string | undefined,
        category: { connect: { id: parseInt(categoryId as string, 10) } },
        type: { connect: { id: parseInt(typeId as string, 10) } },
      },
      include: {
        category: true,
        type: true,
      },
    });

    let createdDetail = null;
    if (parsedDetail) {
      createdDetail = await prisma.detail.create({
        data: {
          ...parsedDetail,
          postId: post.id,
        },
      });
    }

    const updatedTitle = `${post.type?.type ?? ''} a ${post.category?.name ?? ''} # ${post.id} ${createdDetail?.surface ? `/ surface: ${createdDetail.surface}m ` : ''}`;

    const updatedPost = await prisma.post.update({
      where: { id: post.id },
      data: { title: updatedTitle },
      include: {
        category: true,
        type: true,
        Detail: true,
      },
    });

    return NextResponse.json({ id: updatedPost.id, post: updatedPost }, { status: 201 });
  } catch (error: unknown) {
    await destroyUploadedOnFailure(uploadedImages);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating post:', errorMessage);
    return NextResponse.json({ error: 'Error creating post', details: errorMessage }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const postId = url.searchParams.get('id');
    const status = url.searchParams.get('status');
    const categoryId = url.searchParams.get('categoryId');
    const ville = url.searchParams.get('ville');
    const type = url.searchParams.get('type');
    const search = url.searchParams.get('search');
    const bathrooms = url.searchParams.get('bathrooms');
    const rooms = url.searchParams.get('rooms');
    const parsedbathrooms = bathrooms ? parseInt(bathrooms, 10) : null;
    const parsedRooms = rooms ? parseInt(rooms, 10) : null;

    if (postId) {
      const post = await prisma.post.findUnique({
        where: { id: parseInt(postId, 10) },
        include: {
          category: true,
          type: true,
          DateReserve: true,
          Detail: true,
        },
      });

      if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }

      const formattedPost = {
        ...post,
        DateReserve: publicReservations(post.DateReserve),
        youtub: post.youtub,
      };
      return NextResponse.json(formattedPost, { status: 200 });
    }

    const filters: Prisma.PostWhereInput = {
      ...(status && { status: status as Status }),
      ...(categoryId && { categoryId: parseInt(categoryId, 10) }),
      ...(type && { type: { type: type as TypeName } }),
      ...(ville && { ville }),
      ...(parsedbathrooms !== null
        ? {
            Detail: {
              bathrooms: parsedbathrooms <= 4 ? parsedbathrooms : { gte: 5 },
            },
          }
        : {}),
      ...(parsedRooms !== null
        ? {
            Detail: {
              rooms: parsedRooms <= 4 ? parsedRooms : { gte: 5 },
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              {
                ville: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                adress: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            ],
          }
        : {}),
    };

    const posts = await prisma.post.findMany({
      where: {
        ...filters,
      },
      include: {
        category: true,
        type: true,
        DateReserve: true,
        Detail: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const currentDate = new Date();

    const formattedPosts = posts.map((post) => {
      let statusValue = post.status;
      if (
        post.category?.name === CategoryName.Location &&
        post.DateReserve?.length > 0
      ) {
        const earliestDateFine = post.DateReserve
          .map((reserve) => reserve.dateFine)
          .filter((dateFine): dateFine is Date => dateFine !== null)
          .reduce((minDate, currDate) => {
            return new Date(currDate) < new Date(minDate) ? currDate : minDate;
          });

        const earliestDateDebut = post.DateReserve
          .map((reserve) => reserve.dateDebut)
          .filter((dateDebut): dateDebut is Date => dateDebut !== null)
          .reduce((minDate, currDate) => {
            return new Date(currDate) < new Date(minDate) ? currDate : minDate;
          });

        if (earliestDateFine && new Date(earliestDateFine) < currentDate) {
          statusValue = Status.available;
        } else if (
          earliestDateDebut &&
          earliestDateFine &&
          new Date(earliestDateDebut) <= currentDate &&
          new Date(earliestDateFine) >= currentDate
        ) {
          statusValue = Status.taken;
        }
      }

      return {
        ...post,
        status: statusValue,
        DateReserve: publicReservations(post.DateReserve),
        youtub: post.youtub,
      };
    });

    return NextResponse.json(formattedPosts, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error retrieving posts:', errorMessage);
    return NextResponse.json({ error: 'Error retrieving posts', details: errorMessage }, { status: 500 });
  }
}
