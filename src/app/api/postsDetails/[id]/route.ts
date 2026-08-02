import { NextResponse } from 'next/server';
import { Status } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { uploadImages, destroyImagesByUrl } from '@/lib/cloudinary';
import { parseJsonBody, parseNumericId } from '@/lib/validation';

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
    Guard,
  } = body;

  try {
    if (lat || lon || prix || adress || ville || status || title || img) {
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
            return NextResponse.json({ error: 'Error updating post or detail' }, { status: 500 });
          }
          uploadedImages = [...incomingUrls, ...uploadedNew];

          const removed = (existingPost.img as string[]).filter(
            (url) => !incomingUrls.includes(url)
          );
          await destroyImagesByUrl(removed);
        }
      }

      await prisma.post.update({
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
    }

    if (
      constructionyear ||
      surface ||
      rooms ||
      bedromms ||
      livingrooms ||
      kitchen ||
      bathrooms ||
      furnished ||
      floor ||
      elevator ||
      parking ||
      balcony ||
      pool ||
      facade ||
      documents ||
      Guard
    ) {
      const existingDetail = await prisma.detail.findUnique({
        where: { postId: id },
      });

      if (!existingDetail) {
        return NextResponse.json({ error: 'Detail not found' }, { status: 404 });
      }

      await prisma.detail.update({
        where: { id: existingDetail.id },
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
        },
      });
    }

    return NextResponse.json({ message: 'Update successful' }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error updating post or detail:', error);
    return NextResponse.json({ error: 'Error updating post or detail' }, { status: 500 });
  }
}
