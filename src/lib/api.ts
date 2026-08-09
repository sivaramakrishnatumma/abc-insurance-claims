import type { Claim } from '../data/mockClaims';

export type SortDir = 'asc' | 'desc';

export interface ClaimsPage {
  data: Claim[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ClaimsQuery {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: SortDir;
}

export async function fetchClaims(
  q: ClaimsQuery,
  signal?: AbortSignal,
): Promise<ClaimsPage> {
  const params = new URLSearchParams({
    page: String(q.page),
    limit: String(q.limit),
  });
  if (q.search) params.set('search', q.search);
  if (q.sortBy) params.set('sortBy', q.sortBy);
  if (q.sortOrder) params.set('sortOrder', q.sortOrder);

  const res = await fetch(`/api/claims?${params.toString()}`, { signal });
  if (!res.ok) throw new Error(`Failed to load claims (${res.status})`);
  return res.json();
}

export interface JobStatus {
  jobId: string;
  documentId: string;
  progress: number;
  status: 'PROCESSING' | 'COMPLETED';
  resultFiles?: number;
}

export async function startSplitJob(
  documentId: string,
): Promise<{ jobId: string; status: string }> {
  const res = await fetch(`/api/documents/${documentId}/split`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to start split job (${res.status})`);
  return res.json();
}

export async function getJob(jobId: string): Promise<JobStatus> {
  const res = await fetch(`/api/jobs/${jobId}`);
  if (!res.ok) throw new Error(`Failed to fetch job (${res.status})`);
  return res.json();
}

export interface DocumentChunk {
  start: number;
  end: number;
  chunkSize: number;
  totalSize: number;
  contentRange: string | null;
}

/** Fetches a byte slice of the document via an HTTP Range request (206). */
export async function fetchDocumentChunk(
  documentId: string,
  start: number,
  end: number,
  signal?: AbortSignal,
): Promise<{ meta: DocumentChunk; bytes: ArrayBuffer }> {
  const res = await fetch(`/api/documents/${documentId}/stream`, {
    headers: { Range: `bytes=${start}-${end}` },
    signal,
  });
  if (res.status !== 206) {
    throw new Error(`Expected 206 Partial Content, got ${res.status}`);
  }
  const bytes = await res.arrayBuffer();
  const contentRange = res.headers.get('Content-Range');
  const totalSize = contentRange ? Number(contentRange.split('/')[1]) : 0;
  const meta: DocumentChunk = {
    start,
    end,
    chunkSize: bytes.byteLength,
    totalSize,
    contentRange,
  };
  return { meta, bytes };
}
