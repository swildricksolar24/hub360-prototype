import { toJpeg } from 'html-to-image';

/**
 * Tab previews for the All tabs overview: a small picture of a tab's page content (the shell's <main>), taken while
 * the tab is on screen, since only the current tab's page is rendered. html-to-image copies the content into an
 * image from the page's own HTML and styles, with no permission prompt.
 */

/** Width of a preview image (px): a little over the card's preview box, so it stays sharp. */
const PREVIEW_WIDTH = 640;

/** Only one capture runs at a time; a second request while one is under way waits for it. */
let running: Promise<unknown> = Promise.resolve();

/**
 * A capture that takes longer than this gives up (ms). html-to-image waits for an animation frame, which a browser
 * doesn't run for a page in a background tab; without a limit one stuck capture would hold up every later one.
 */
const CAPTURE_TIMEOUT_MS = 5000;

/**
 * Captures the visible part of `node` (its width and on-screen height) as a small JPEG data URL, or null if it can't.
 * Dialogs and toasts inside it are left out. Web fonts aren't embedded (they live on another site), so the picture
 * uses the system font; at preview size that's hard to tell apart.
 */
export function capturePreview(node: HTMLElement): Promise<string | null> {
  const task = running.then(async () => {
    const width = node.clientWidth;
    const height = Math.min(node.clientHeight, window.innerHeight);
    if (!width || !height) return null;
    const background = getComputedStyle(document.body).backgroundColor;
    let timer: number | undefined;
    try {
      return await Promise.race([
        toJpeg(node, {
          width,
          height,
          pixelRatio: Math.min(1, PREVIEW_WIDTH / width),
          quality: 0.8,
          backgroundColor: background,
          skipFonts: true,
          filter: el => !(el instanceof HTMLDialogElement) && !(el instanceof HTMLElement && el.getAttribute('role') === 'status'),
        }),
        new Promise<null>(resolve => {
          timer = window.setTimeout(() => resolve(null), CAPTURE_TIMEOUT_MS);
        }),
      ]);
    } catch {
      return null;
    } finally {
      window.clearTimeout(timer);
    }
  });
  running = task;
  return task;
}

/** Runs `fn` when the browser is idle (or after a short wait where idle callbacks aren't supported). */
export function whenIdle(fn: () => void): () => void {
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(fn, { timeout: 2000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(fn, 200);
  return () => clearTimeout(id);
}
