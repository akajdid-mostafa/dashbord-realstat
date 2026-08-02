import { NextResponse } from 'next/server';
import { Prisma, CategoryName, Status, TypeName } from '@prisma/client';
import { prisma } from '@/lib/prisma';

function publicReservations(reserves: { id: number }[] | undefined) {
  return (reserves ?? []).map((reserve) => ({ id: reserve.id }));
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
