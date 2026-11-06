import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const albumUrl = new URL(process.argv[2]);
if (albumUrl.hostname !== 'photos.google.com' || !albumUrl.pathname.includes('/share/')) {
  throw new Error('Provide a public Google Photos shared-album URL.');
}
albumUrl.pathname = albumUrl.pathname.replace(/\/u\/\d+/, '');
const response = await fetch(albumUrl, { signal: AbortSignal.timeout(30000) });
if (!response.ok) throw new Error(`Album could not be opened: ${response.status}`);
const html = await response.text();
const marker = "AF_initDataCallback({key: 'ds:1'";
const start = html.indexOf(marker);
if (start < 0) throw new Error('Album content is unavailable. Check link sharing.');
const script = html.slice(start, html.indexOf('</script>', start));
const data = JSON.parse(script.slice(script.indexOf('data:') + 5, script.lastIndexOf(', sideChannel:')));
const rows = data[1];
if (!Array.isArray(rows) || !rows.length) throw new Error('No album images were found.');
const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'public', 'google-photos');
await mkdir(output, { recursive: true });
await mkdir(join(root, 'src', 'data'), { recursive: true });
const images = new Array(rows.length);
let next = 0;
let completed = 0;
let totalBytes = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (next < rows.length) {
    const index = next++;
    const row = rows[index];
    const source = new URL(row[1][0]);
    if (source.hostname !== 'lh3.googleusercontent.com' || source.protocol !== 'https:') {
      throw new Error('Unexpected image host in shared album.');
    }
    const id = createHash('sha256').update(row[0]).digest('hex').slice(0, 20);
    let saved = false;
    for (let attempt = 0; attempt < 3 && !saved; attempt++) {
      try {
        const image = await fetch(`${source.href.split('=')[0]}=w960-h960-no`, { signal: AbortSignal.timeout(30000) });
        const type = image.headers.get('content-type')?.split(';')[0];
        const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[type];
        if (!image.ok || !extension) throw new Error(`Image ${index + 1}: ${image.status}, ${type}`);
        const bytes = Buffer.from(await image.arrayBuffer());
        if (!bytes.length) throw new Error(`Image ${index + 1} is empty`);
        await writeFile(join(output, `${id}.${extension}`), bytes);
        images[index] = { id: `google-${id}`, dataUrl: `/google-photos/${id}.${extension}` };
        totalBytes += bytes.length;
        completed++;
        if (completed % 25 === 0 || completed === rows.length) console.log(`Imported ${completed}/${rows.length} album images`);
        saved = true;
      } catch (error) {
        if (attempt === 2) throw error;
      }
    }
  }
}));
await writeFile(join(root, 'src', 'data', 'google-album.json'), JSON.stringify({
  title: '@indoor', importedAt: new Date().toISOString(), images,
}, null, 2) + '\n');
console.log(JSON.stringify({ imported: completed, megabytes: +(totalBytes / 1024 / 1024).toFixed(2) }));
