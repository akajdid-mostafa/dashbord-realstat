import { v2 as cloudinary } from 'cloudinary';

const IMAGE_FOLDER = 'realstat';

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function publicIdFromUrl(imageUrl: string): string | undefined {
  const match = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : imageUrl.split('/').pop()?.split('.')[0];
}

export function uploadImage(imageUrl: string, folder: string = IMAGE_FOLDER): Promise<string> {
  return cloudinary.uploader
    .upload(imageUrl, { folder })
    .then((result) => result.secure_url);
}

export function uploadImages(imageUrls: string[], folder: string = IMAGE_FOLDER): Promise<string[]> {
  return Promise.all(imageUrls.map((url) => uploadImage(url, folder)));
}

export function destroyImage(publicId: string): Promise<unknown> {
  return cloudinary.uploader.destroy(publicId);
}
