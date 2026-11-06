import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodePhoto, savePhoto, publicPhotos, publicState } from '../api/photo-storage.js';

const image = 'data:image/jpeg;base64,/9j/2Q==';
test('missing Blob configuration stores portable photo data in Neon', async () => {
  const photo = await savePhoto(image, { env: {}, upload: () => assert.fail('must not call Blob') });
  assert.equal(photo.dataUrl, image);
  assert.match(photo.id, /^[0-9a-f-]{36}$/);
  assert.equal(publicPhotos([photo])[0].dataUrl, `/api/photos/${photo.id}/image`);
  assert.equal(photo.dataUrl, image);
  assert.equal(publicState({ photos: [photo], matches: [] }).photos.length, 1);
});
test('configured Blob uploads receive server credentials', async () => {
  const photo = await savePhoto(image, { env: { BLOB_READ_WRITE_TOKEN: 'test-token' }, upload: async (_, buffer, options) => {
    assert.equal(options.token, 'test-token');
    assert.equal(options.contentType, 'image/jpeg');
    assert.equal(buffer.length, 4);
    return { url: 'https://example.com/photo.jpg' };
  } });
  assert.equal(photo.dataUrl, 'https://example.com/photo.jpg');
});
test('OIDC configuration falls back only when credentials are missing', async () => {
  const options = { env: { BLOB_STORE_ID: 'store_test' }, upload: async () => { throw new Error('Vercel Blob: No blob credentials found.'); } };
  assert.equal((await savePhoto(image, options)).dataUrl, image);
  await assert.rejects(savePhoto(image, { ...options, upload: async () => { throw new Error('Access denied'); } }), /Access denied/);
});
test('rejects unsupported formats and oversized requests before storage', () => {
  assert.throws(() => decodePhoto('data:image/svg+xml;base64,PHN2Zz4='), { status: 400 });
  assert.throws(() => decodePhoto(`data:image/png;base64,${Buffer.alloc(3 * 1024 * 1024 + 1).toString('base64')}`), { status: 413 });
});
