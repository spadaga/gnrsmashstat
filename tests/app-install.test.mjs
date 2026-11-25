import assert from 'node:assert/strict';
import test from 'node:test';

test('fullscreen launches are recognized as the installed app', async () => {
  const previousWindow = globalThis.window;
  globalThis.window = {
    matchMedia: (query) => ({ matches: query === '(display-mode: fullscreen)' }),
    navigator: {},
    addEventListener: () => {},
  };
  try {
    const install = await import('../src/lib/app-install.js?fullscreen-test');
    assert.equal(install.isAppInstalled(), true);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test('install uses the browser prompt once, supports fallback, and tracks installation', async () => {
  const events = new Map();
  const previousWindow = globalThis.window;
  globalThis.window = {
    matchMedia: () => ({ matches: false }),
    navigator: {},
    addEventListener: (name, callback) => events.set(name, callback),
  };
  try {
    const install = await import('../src/lib/app-install.js?install-test');
    assert.equal(install.isAppInstalled(), false);
    assert.equal(await install.requestAppInstall(), 'instructions');
    let prompted = 0;
    let prevented = false;
    events.get('beforeinstallprompt')({
      preventDefault: () => { prevented = true; },
      prompt: async () => { prompted++; },
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    });
    assert.equal(prevented, true);
    assert.equal(await install.requestAppInstall(), 'accepted');
    assert.equal(prompted, 1);
    assert.equal(await install.requestAppInstall(), 'instructions');
    let notifications = 0;
    const unsubscribe = install.subscribeToInstall(() => notifications++);
    events.get('appinstalled')();
    assert.equal(install.isAppInstalled(), true);
    assert.equal(notifications, 1);
    unsubscribe();
    events.get('appinstalled')();
    assert.equal(notifications, 1);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
