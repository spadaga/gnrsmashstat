import { useState } from "react";
import { Download, Share2, X } from "lucide-react";
import { createLeaderboardImages } from "../lib/leaderboard-image";

export default function LeaderboardShare({ rows, ranks, mode, periodLabel }) {
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function shareImages(images, title) {
    const files = images.map(image => image.file);
    setBusy(true);
    try {
      if (!navigator.share || !navigator.canShare?.({ files })) {
        setPreview({ images, title });
        return;
      }
      await navigator.share({ title, files });
    } catch (error) {
      if (error.name !== "AbortError") {
        setPreview({ images, title });
        setMessage("Download the image and attach it in WhatsApp or another app.");
      }
    } finally {
      setBusy(false);
    }
  }

  function share() {
    setMessage("");
    try {
      const title = `GNR SmashStats Leaderboard · ${periodLabel} · ${mode === "singles" ? "Singles" : "Doubles"}`;
      const images = createLeaderboardImages({ rows, ranks, mode, periodLabel });
      // Keep file sharing in the click gesture for mobile browser support.
      void shareImages(images, title);
    } catch {
      setMessage("Could not create the leaderboard image. Please try again.");
    }
  }

  return (
    <>
      <button type="button" onClick={share} disabled={busy || !rows.length}
        className="inline-flex shrink-0 items-center justify-center rounded-lg p-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 disabled:opacity-40"
        title="Share leaderboard image" aria-label="Share leaderboard image">
        <Share2 size={16} />
      </button>
      {message && !preview && <span role="status" className="text-xs text-orange-600">{message}</span>}
      {preview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={(event) => event.target === event.currentTarget && setPreview(null)}
          onKeyDown={(event) => event.key === "Escape" && setPreview(null)}>
          <section role="dialog" aria-modal="true" aria-label="Share leaderboard image"
            className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Share leaderboard image</h3>
              <button type="button" autoFocus onClick={() => setPreview(null)} aria-label="Close share options" className="p-2 text-slate-500"><X size={18} /></button>
            </div>
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">Save the image, then attach it in WhatsApp or any social app.</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {preview.images.map((image, index) => (
                <a key={image.filename} href={image.dataUrl} download={image.filename}
                  className="inline-flex items-center gap-2 rounded-lg bg-orange-600 text-white px-3 py-2 text-sm font-semibold">
                  <Download size={15} /> Download image{preview.images.length > 1 ? ` ${index + 1}` : ""}
                </a>
              ))}
              {navigator.share && navigator.canShare?.({ files: preview.images.map(image => image.file) }) && (
                <button type="button" disabled={busy} onClick={() => shareImages(preview.images, preview.title)} className="inline-flex items-center gap-2 rounded-lg bg-green-600 text-white px-3 py-2 text-sm font-semibold disabled:opacity-40"><Share2 size={15} /> Share image</button>
              )}
            </div>
            {preview.images.map(image => <img key={image.filename} src={image.dataUrl} alt={preview.title} className="w-full rounded-xl mb-3" />)}
            <p role="status" className="mt-2 text-xs text-slate-500 dark:text-slate-400">{message}</p>
          </section>
        </div>
      )}
    </>
  );
}
