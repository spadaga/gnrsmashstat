import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { after, test } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false } });
after(() => server.close());
const { availableGalleryPhotos, ARCHIVED_PHOTOS } = await server.ssrLoadModule('/src/lib/photos.js');
const { default: PhotoGallery } = await server.ssrLoadModule('/src/components/PhotoGallery.jsx');
const album = JSON.parse(await readFile(new URL('../src/data/google-album.json', import.meta.url), 'utf8'));
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

test('imported album images exist as nonempty public files', async () => {
  assert.equal(album.images.length, 300);
  assert.equal(new Set(album.images.map((photo) => photo.id)).size, album.images.length);
  for (const photo of album.images) {
    assert.ok(photo.dataUrl.startsWith('/google-photos/'));
    assert.ok((await stat(new URL(`../public${photo.dataUrl}`, import.meta.url))).size > 0);
  }
});

test('gallery displays album images inline and mounts only nearby slides', () => {
  const html = renderToStaticMarkup(React.createElement(PhotoGallery, { photos: [] }));
  assert.ok(!html.includes('No photos yet'));
  assert.ok(!html.includes('Open Google Photos Album'));
  assert.ok(html.includes('300'));
  assert.equal((html.match(/src="\/google-photos\//g) || []).length, 3);
  assert.ok(html.includes('Next gallery photo'));
});
