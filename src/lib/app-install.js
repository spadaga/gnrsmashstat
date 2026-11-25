let promptEvent = null;
const listeners = new Set();
const standalone = () => typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true);
let installed = standalone();
const notify = () => listeners.forEach((listener) => listener());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    promptEvent = event;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    promptEvent = null;
    notify();
  });
}

export const subscribeToInstall = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const isAppInstalled = () => installed;

export async function requestAppInstall() {
  if (!promptEvent) return "instructions";
  const event = promptEvent;
  promptEvent = null;
  try {
    await event.prompt();
    const choice = await event.userChoice;
    return choice.outcome;
  } catch {
    return "instructions";
  }
}
