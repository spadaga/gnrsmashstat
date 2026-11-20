import { localISODate } from './date';

// Draw locally so sharing never needs a third-party screenshot service.
export function createLeaderboardImages({ rows, ranks, mode, periodLabel }) {
  const width = 900;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image sharing is unavailable in this browser.');
  const font = 'Arial, sans-serif';
  ctx.font = `bold 26px ${font}`;
  const wrap = (text) => {
    const lines = [];
    let line = '';
    for (const char of text) {
      if (line && ctx.measureText(line + char).width > 690) {
        lines.push(line.trimEnd());
        line = '';
      }
      line += char;
    }
    if (line) lines.push(line.trim());
    return lines;
  };
  const pages = [[]];
  let pageHeight = 230;
  rows.forEach((row, index) => {
    const lines = wrap(mode === 'singles' ? row.name : row.players.join(' & '));
    const height = 90 + lines.length * 31;
    if (pageHeight + height > 10000 && pages.at(-1).length) {
      pages.push([]);
      pageHeight = 230;
    }
    pages.at(-1).push({ row, rank: ranks[index] ?? 'NA', lines, height });
    pageHeight += height;
  });

  return pages.map((entries, pageIndex) => {
    canvas.width = width;
    canvas.height = 230 + entries.reduce((sum, entry) => sum + entry.height, 0);
    ctx.fillStyle = '#fff7ed';
    ctx.fillRect(0, 0, width, canvas.height);
    ctx.fillStyle = '#ff4d00';
    ctx.fillRect(0, 0, width, 165);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 32px ${font}`;
    ctx.fillText('GNR SMASHSTATS', 32, 48);
    ctx.font = `bold 28px ${font}`;
    ctx.fillText('LEADERBOARD', 32, 89);
    ctx.font = `20px ${font}`;
    ctx.fillText(`${periodLabel} · ${mode === 'singles' ? 'Singles' : 'Doubles'}`, 32, 122, width - 64);
    ctx.font = `16px ${font}`;
    ctx.fillText(`As of ${localISODate()}${pages.length > 1 ? ` · Page ${pageIndex + 1}/${pages.length}` : ''}`, 32, 148);
    let y = 180;
    for (const { row, rank, lines, height } of entries) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(18, y, width - 36, height - 8);
      ctx.beginPath();
      ctx.arc(65, y + 37, 27, 0, Math.PI * 2);
      ctx.fillStyle = rank === 1 ? '#ff4d00' : '#ffedd5';
      ctx.fill();
      ctx.fillStyle = rank === 1 ? '#ffffff' : '#9a3412';
      ctx.font = `bold 21px ${font}`;
      ctx.textAlign = 'center';
      ctx.fillText(String(rank), 65, y + 44, 49);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#0f172a';
      ctx.font = `bold 26px ${font}`;
      lines.forEach((line, index) => ctx.fillText(line, 112, y + 34 + index * 31));
      ctx.font = `20px ${font}`;
      ctx.fillStyle = '#475569';
      ctx.fillText(`${row.wins}W – ${row.losses}L · ${row.played} played · ${row.winRate}% wins`, 112, y + 45 + lines.length * 31);
      ctx.font = `16px ${font}`;
      ctx.fillStyle = '#64748b';
      ctx.fillText(`Ranking score: ${(row.score || 0).toFixed(3)}`, 112, y + 68 + lines.length * 31);
      y += height;
    }
    ctx.fillStyle = '#9a3412';
    ctx.font = `17px ${font}`;
    ctx.fillText('gnrsmashstat.vercel.app', 32, canvas.height - 20);
    const dataUrl = canvas.toDataURL('image/png');
    const bytes = Uint8Array.from(atob(dataUrl.split(',')[1]), char => char.charCodeAt(0));
    const filename = `gnr-leaderboard-${mode}-${localISODate()}${pages.length > 1 ? `-${pageIndex + 1}` : ''}.png`;
    return { dataUrl, filename, file: new File([bytes], filename, { type: 'image/png' }) };
  });
}
