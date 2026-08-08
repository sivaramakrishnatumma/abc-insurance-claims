import { useEffect, useRef, useState } from 'react';
import type { Claim } from '../data/mockClaims';
import type {
  ProcessRequest,
  ProcessResponse,
  SortKey,
} from '../workers/claims.types';

export interface ClaimsProcessorState {
  claims: Claim[];
  total: number;
  activeCount: number;
  isProcessing: boolean;
}

const INITIAL_STATE: ClaimsProcessorState = {
  claims: [],
  total: 0,
  activeCount: 0,
  isProcessing: true,
};

/**
 * Offloads search/filter/sort of the 20k dataset to a Web Worker so the main
 * thread stays responsive. Stale responses are dropped via a request id.
 */
export function useClaimsProcessor(
  search: string,
  sortKey: SortKey,
): ClaimsProcessorState {
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const latestIdRef = useRef(0);
  const [state, setState] = useState<ClaimsProcessorState>(INITIAL_STATE);

  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/claimsWorker.ts', import.meta.url),
      { type: 'module' },
    );
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<ProcessResponse>) => {
      const res = event.data;
      // Ignore results from superseded requests.
      if (res.requestId !== latestIdRef.current) return;
      setState({
        claims: res.claims,
        total: res.total,
        activeCount: res.activeCount,
        isProcessing: false,
      });
    };

    return () => worker.terminate();
  }, []);

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;

    const requestId = ++requestIdRef.current;
    latestIdRef.current = requestId;
    setState((prev) => ({ ...prev, isProcessing: true }));

    const request: ProcessRequest = { requestId, search, sortKey };
    worker.postMessage(request);
  }, [search, sortKey]);

  return state;
}
