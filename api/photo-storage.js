import { put } from '@vercel/blob';
import crypto from 'node:crypto';

export function decodePhoto(dataUrl) {
  const match = /^data:image\/(jpeg|png|webp|gif|avif);base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl || '');
  if (!match) throw Object.assign(new Error('Please upload a JPEG, PNG, WebP, GIF or AVIF image.'), { status: 400 });
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 3 * 1024 * 1024) throw Object.assign(new Error('Photo must be smaller than 3 MB after compression.'), { status: 413 });
  return { buffer, contentType: `image/${match[1]}`, ext: match[1] === 'jpeg' ? 'jpg' : match[1] };
}

export async function savePhoto(dataUrl, { env = process.env, upload = put } = {}) {
  const { buffer, contentType, ext } = decodePhoto(dataUrl);
  const id = crypto.randomUUID();
  if (env.BLOB_READ_WRITE_TOKEN || env.BLOB_STORE_ID) {
    try {
      const blob = await upload(`photos/${id}.${ext}`, buffer, {
        access: 'public', contentType, addRandomSuffix: false,
        ...(env.BLOB_READ_WRITE_TOKEN ? { token: env.BLOB_READ_WRITE_TOKEN } : { storeId: env.BLOB_STORE_ID }),
      });
      return { id, dataUrl: blob.url };
    } catch (error) {
      if (!/No blob credentials found|No read-write token found/i.test(error.message)) throw error;
    }
  }
  // Keep the original bytes in Neon so exports and snapshots remain portable.
  return { id, dataUrl };
}

export function publicPhotos(photos) {
  return photos.map(photo => ({ ...photo, dataUrl: photo.dataUrl?.startsWith('data:image/') ? `/api/photos/${photo.id}/image` : photo.dataUrl }));
}

export function publicState(state) {
  return { ...state, photos: publicPhotos(state.photos || []) };
}
