import { FIG_LIMITS } from './fig-limits';
import type { DecodedFig } from './fig-container-core';
export type { DecodedFig } from './fig-container-core';
export type { FigValue } from './fig-kiwi';

/** Decode entirely offline. No document/store mutation; caller must validate the mapped scene before committing. */
export function decodeFigFile(bytes: Uint8Array, options: { signal?: AbortSignal } = {}): Promise<DecodedFig> {
  if (!(bytes instanceof Uint8Array) || bytes.length > FIG_LIMITS.inputBytes) return Promise.reject(new Error('.fig input exceeds 50 MB limit'));
  if (options.signal?.aborted) return Promise.reject(new DOMException('.fig import cancelled', 'AbortError'));
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./fig-container.worker.ts', import.meta.url), { type: 'module' });
    const finish = () => { clearTimeout(timer); options.signal?.removeEventListener('abort', abort); worker.terminate(); };
    const abort = () => { finish(); reject(new DOMException('.fig import cancelled', 'AbortError')); };
    const timer = setTimeout(() => { finish(); reject(new Error('.fig decoding exceeded its 15-second work limit. Try a smaller file.')); }, FIG_LIMITS.workerTimeoutMs);
    options.signal?.addEventListener('abort', abort, { once: true });
    worker.onerror = () => { finish(); reject(new Error('Unable to start the offline .fig decoder')); };
    worker.onmessage = (event: MessageEvent<{ ok: boolean; decoded?: DecodedFig; error?: string }>) => {
      finish();
      if (event.data.ok && event.data.decoded) resolve(event.data.decoded);
      else reject(new Error(event.data.error || 'Unable to decode .fig file'));
    };
    // Transfer a bounded copy so cancellation never detaches the caller's original buffer.
    try {
      if (options.signal?.aborted) { abort(); return; }
      const copy = new Uint8Array(bytes);
      worker.postMessage(copy, [copy.buffer]);
    } catch (error) { finish(); reject(error); }
  });
}
