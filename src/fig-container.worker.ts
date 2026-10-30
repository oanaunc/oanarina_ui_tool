import { decodeFigContainerInWorker } from './fig-container-core';

self.onmessage = (event: MessageEvent<Uint8Array>) => {
  try {
    const decoded = decodeFigContainerInWorker(event.data);
    self.postMessage({ ok: true, decoded });
  } catch (error) {
    self.postMessage({ ok: false, error: error instanceof Error ? error.message : 'Unable to decode .fig file' });
  }
};
