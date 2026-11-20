import { toCanvas } from 'html-to-image';
import { localISODate } from './date';

// Capture the real card: computed styles, circular photos, tabs and rank badges.
export async function createLeaderboardImages({ element, mode, filenamePrefix = `gnr-leaderboard-${mode}` }) {
  if (!element) throw new Error('Leaderboard is unavailable.');
  await Promise.all([...element.querySelectorAll('img')].map(image => image.complete ? undefined : image.decode?.().catch(() => {})));
  const canvas = await toCanvas(element, {
    pixelRatio: 2,
    skipFonts: true,
    filter: node => !(node instanceof Element && node.hasAttribute('data-share-exclude')),
  });
  const ratio = canvas.height / element.getBoundingClientRect().height;
  const top = element.getBoundingClientRect().top;
  const boundaries = [...element.querySelectorAll('[data-leaderboard-row], [data-share-row]')]
    .map(row => Math.round((row.getBoundingClientRect().bottom - top) * ratio)).sort((a, b) => a - b);
  const images = [];
  let start = 0;
  while (start < canvas.height) {
    const limit = start + 6000;
    const end = canvas.height <= limit ? canvas.height : boundaries.filter(y => y > start && y <= limit).at(-1) || canvas.height;
    const page = document.createElement('canvas');
    page.width = canvas.width;
    page.height = end - start;
    page.getContext('2d').drawImage(canvas, 0, start, canvas.width, page.height, 0, 0, page.width, page.height);
    const dataUrl = page.toDataURL('image/png');
    const bytes = Uint8Array.from(atob(dataUrl.split(',')[1]), char => char.charCodeAt(0));
    const filename = `${filenamePrefix}-${localISODate()}-${images.length + 1}.png`;
    images.push({ dataUrl, filename, file: new File([bytes], filename, { type: 'image/png' }) });
    start = end;
  }
  return images;
}
