import type {
  DocumentWorkerRequest,
  DocumentWorkerResponse,
} from './documentProcessor.types';

// Simulates heavy processing of very large (up to ~1 GB) document chunks.
// All work happens here, on a background thread, so the UI never freezes.

const TICK_MS = 120; // interval between progress updates
const STEP = 4; // percent advanced per tick

/** Minimal worker-scope typing so we avoid mixing DOM and WebWorker libs. */
type WorkerScope = {
  onmessage: ((event: MessageEvent<DocumentWorkerRequest>) => void) | null;
  postMessage: (message: DocumentWorkerResponse) => void;
};

const ctx = self as unknown as WorkerScope;

ctx.onmessage = (event) => {
  const { action, fileName, sizeBytes } = event.data;
  const start = performance.now();
  let progress = 0;

  // Drive a fake progress loop; each tick reports back to the main thread.
  const timer = setInterval(() => {
    progress = Math.min(100, progress + STEP);
    ctx.postMessage({ status: 'PROGRESS', action, progress });

    if (progress >= 100) {
      clearInterval(timer);
      ctx.postMessage({
        status: 'COMPLETE',
        action,
        payload: {
          fileName,
          processedBytes: sizeBytes,
          durationMs: Math.round(performance.now() - start),
          resultFiles: action === 'SPLIT_DOCUMENT' ? 12 : 1,
        },
      });
    }
  }, TICK_MS);
};
