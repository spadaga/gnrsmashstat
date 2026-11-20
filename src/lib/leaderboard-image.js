import { toSvg } from 'html-to-image';
import { localISODate } from './date';

const MIN_WIDTH = 2160;
const MAX_WIDTH = 3840;
const MAX_PAGE_PIXELS = 12 * 1024 * 1024;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timeout = setTimeout(() => reject(new Error('Image rendering timed out.')), 20000);
    image.onload = () => { clearTimeout(timeout); resolve(image); };
    image.onerror = () => { clearTimeout(timeout); reject(new Error('Could not render image.')); };
    image.src = src;
  });
}

// Render vector snapshots directly at export resolution. Tile long reports before
// rasterizing so mobile browsers never need one enormous canvas or shrink text.
export async function createLeaderboardImages({ element, mode, filenamePrefix = `gnr-leaderboard-${mode}` }) {
  if (!element) throw new Error('The section is unavailable.');
  await Promise.all([...element.querySelectorAll('img')].map(image => image.complete ? undefined : image.decode?.().catch(() => {})));
  const svgUrl = await toSvg(element, {
    skipFonts: true,
    style: { transform: 'none', opacity: '1' },
    filter: node => !(node instanceof Element && node.hasAttribute('data-share-exclude')),
  });
  const snapshot = new DOMParser().parseFromString(decodeURIComponent(svgUrl.split(',')[1]), 'image/svg+xml').documentElement;
  const width = Number(snapshot.getAttribute('width'));
  const height = Number(snapshot.getAttribute('height'));
  if (!(width > 0 && height > 0)) throw new Error('The section has no visible size.');
  const content = [...snapshot.children].find(node => node.localName === 'foreignObject');
  if (content) {
    content.setAttribute('width', String(width));
    content.setAttribute('height', String(height));
  }
  const outputWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.ceil(width * 3)));
  const scale = outputWidth / width;
  const pageHeight = Math.min(6000, Math.floor(MAX_PAGE_PIXELS / outputWidth));
  const top = element.getBoundingClientRect().top;
  const boundaries = [...element.querySelectorAll('[data-leaderboard-row], [data-share-row]')]
    .filter(row => !row.closest('[data-share-exclude]'))
    .map(row => Math.round(row.getBoundingClientRect().bottom - top))
    .filter(y => y > 0 && y <= height).sort((a, b) => a - b);
  const images = [];
  let start = 0;
  while (start < height) {
    const limit = Math.min(height, start + Math.floor(pageHeight / scale));
    const end = limit === height ? height : boundaries.filter(y => y > start && y <= limit).at(-1) || limit;
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = Math.ceil((end - start) * scale);
    const page = snapshot.cloneNode(true);
    page.setAttribute('width', String(canvas.width));
    page.setAttribute('height', String(canvas.height));
    page.setAttribute('viewBox', `0 ${start} ${width} ${end - start}`);
    page.setAttribute('preserveAspectRatio', 'none');
    const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(page))}`;
    const image = await loadImage(src);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image sharing is unavailable in this browser.');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    const bytes = Uint8Array.from(atob(dataUrl.split(',')[1]), char => char.charCodeAt(0));
    const filename = `${filenamePrefix}-${localISODate()}-${images.length + 1}.png`;
    images.push({ dataUrl, filename, file: new File([bytes], filename, { type: 'image/png' }) });
    canvas.width = canvas.height = 0;
    start = end;
  }
  return images;
}
