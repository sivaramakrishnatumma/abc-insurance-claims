import { mockClaims, type Claim } from '../data/mockClaims';
import type { ProcessRequest, ProcessResponse, SortKey } from './claims.types';

// The full dataset lives in the worker thread, keeping the main thread light.
const dataset: Claim[] = mockClaims;

function processClaims(search: string, sortKey: SortKey) {
  const term = search.trim().toLowerCase();

  const filtered = term
    ? dataset.filter(
        (c) =>
          c.customerName.toLowerCase().includes(term) ||
          c.company.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term) ||
          c.id.toLowerCase().includes(term),
      )
    : dataset;

  const sorted = [...filtered];
  switch (sortKey) {
    case 'name':
      sorted.sort((a, b) => a.customerName.localeCompare(b.customerName));
      break;
    case 'amount':
      sorted.sort((a, b) => b.amount - a.amount);
      break;
    case 'status':
      sorted.sort((a, b) => a.status.localeCompare(b.status));
      break;
    case 'newest':
    default:
      sorted.sort((a, b) => Number(b.id.slice(4)) - Number(a.id.slice(4)));
      break;
  }

  let activeCount = 0;
  for (const c of filtered) if (c.status === 'Active') activeCount++;

  return { claims: sorted, activeCount };
}

/** Minimal worker-scope typing so we avoid mixing DOM and WebWorker libs. */
type WorkerScope = {
  onmessage: ((event: MessageEvent<ProcessRequest>) => void) | null;
  postMessage: (message: ProcessResponse) => void;
};

const ctx = self as unknown as WorkerScope;

ctx.onmessage = (event) => {
  const { requestId, search, sortKey } = event.data;
  const { claims, activeCount } = processClaims(search, sortKey);

  const response: ProcessResponse = {
    requestId,
    claims,
    total: dataset.length,
    activeCount,
  };
  ctx.postMessage(response);
};
