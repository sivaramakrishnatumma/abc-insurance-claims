import type { Claim } from '../data/mockClaims';

export type SortKey = 'newest' | 'name' | 'amount' | 'status';

/** Request sent from the UI thread to the claims worker. */
export interface ProcessRequest {
  requestId: number;
  search: string;
  sortKey: SortKey;
}

/** Result posted back from the worker after filtering + sorting. */
export interface ProcessResponse {
  requestId: number;
  claims: Claim[];
  total: number;
  activeCount: number;
}
