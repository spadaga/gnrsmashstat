import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Download, Check, X } from "lucide-react";
import { isAppInstalled, requestAppInstall, subscribeToInstall } from "../lib/app-install";

export default function InstallApp() {
  const installed = useSyncExternalStore(subscribeToInstall, isAppInstalled, () => false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    const dialog = document.getElementById("install-app-dialog");
    const closeButton = dialog?.querySelector("button");
    closeButton?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab") { event.preventDefault(); closeButton?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previousFocus?.focus();
    };
  }, [open]);

  return <>
    <button
      type="button"
      disabled={installed}
      onClick={async () => { if (await requestAppInstall() === "instructions") setOpen(true); }}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-bold text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 disabled:cursor-default"
    >
      {installed ? <Check size={14} /> : <Download size={14} />}
      {installed ? "App installed" : "Install app"}
    </button>
    {open && createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
        <div id="install-app-dialog" role="dialog" aria-modal="true" aria-labelledby="install-app-title" onClick={(event) => event.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-2xl dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="install-app-title" className="font-bold text-slate-900 dark:text-white">Add GNR SmashStats shortcut</h2>
            <button type="button" aria-label="Close install instructions" onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-700"><X size={20} /></button>
          </div>
          <p className="mb-4">Open the portal directly from your home screen or desktop.</p>
          <ul className="space-y-3">
            <li><strong>iPhone / iPad:</strong> Open in Safari, tap Share, then Add to Home Screen.</li>
            <li><strong>Android:</strong> Open in Chrome, tap the ⋮ menu, then Install app or Add to Home screen.</li>
            <li><strong>Desktop:</strong> In Chrome or Edge, use the install icon in the address bar, or the browser menu → Install app. In Safari on Mac, choose File → Add to Dock.</li>
          </ul>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">If opened inside WhatsApp or another app, open this page in your browser first. An internet connection is needed for live data.</p>
        </div>
      </div>, document.body
    )}
  </>;
}
