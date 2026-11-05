import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, test } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false } });
after(() => server.close());
const { availableGalleryPhotos, ARCHIVED_PHOTOS } = await server.ssrLoadModule('/src/lib/photos.js');
const photos = [
  { id: 'remote-1', dataUrl: 'https://example.com/photo1.jpg' },
  { id: 'remote-2', dataUrl: 'https://example.com/photo2.jpg' },
];

test('keeps available photos and skips failed sources without mismatching IDs', () => {
  assert.deepEqual(availableGalleryPhotos(photos, new Set()), photos);
  assert.deepEqual(availableGalleryPhotos(photos, new Set([photos[0].dataUrl])), [photos[1]]);
});

test('uses distinct archived photos when all remote sources fail', () => {
  const available = availableGalleryPhotos(photos, new Set(photos.map((photo) => photo.dataUrl)));
  assert.equal(available.length, 7);
  assert.ok(available.every((photo) => photo.archived && photo.id.startsWith('archive-')));
  assert.ok(available.every((photo) => !photos.some((remote) => remote.id === photo.id)));
});

test('all bundled archive URLs resolve to actual public JPEG files', async () => {
  for (const photo of ARCHIVED_PHOTOS) {
    const bytes = await readFile(new URL(`../public${photo.dataUrl}`, import.meta.url));
    assert.equal(bytes[0], 0xff);
    assert.equal(bytes[1], 0xd8);
  }
});

test('does not resurrect photos in an intentionally empty gallery', () => {
  assert.deepEqual(availableGalleryPhotos([], new Set()), []);
});

test('missing sources trigger archives and unavailable archives are excluded', () => {
  const failed = new Set(ARCHIVED_PHOTOS.map((photo) => photo.dataUrl));
  assert.deepEqual(availableGalleryPhotos([{ id: 'missing-source' }], failed), []);
});
