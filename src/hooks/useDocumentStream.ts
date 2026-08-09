import { useEffect, useState } from 'react';
import { fetchDocumentChunk, type DocumentChunk } from '../lib/api';
import { chunkKey, getCachedChunk, putCachedChunk } from '../lib/idbCache';

const ONE_GB = 1_073_741_824;
const MAX_PAGE_CHUNK = 1024 * 1024; // stream up to 1 MB per page view

export type ChunkSource = 'cache' | 'network';

/**
 * Streams the current page's byte range from the BFF via a Range request,
 * backed by an IndexedDB cache so revisited pages load without a network trip
 * and large binary data never sits on the JS heap.
 */
export function useDocumentStream(
  documentId: string,
  page: number,
  totalPages: number,
) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chunk, setChunk] = useState<DocumentChunk | null>(null);
  const [source, setSource] = useState<ChunkSource | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const pageSize = Math.floor(ONE_GB / totalPages);
    const start = (page - 1) * pageSize;
    const end = start + Math.min(pageSize, MAX_PAGE_CHUNK) - 1;
    const key = chunkKey(documentId, page);

    setLoading(true);
    setError(null);

    (async () => {
      try {
        // 1) Try IndexedDB first — instant, no network, kept off the JS heap.
        const cached = await getCachedChunk(key).catch(() => undefined);
        if (controller.signal.aborted) return;
        if (cached) {
          setChunk({
            start: cached.start,
            end: cached.end,
            chunkSize: cached.chunkSize,
            totalSize: cached.totalSize,
            contentRange: cached.contentRange,
          });
          setSource('cache');
          setLoading(false);
          return;
        }

        // 2) Miss — stream from the server, then persist to IndexedDB.
        const { meta, bytes } = await fetchDocumentChunk(
          documentId,
          start,
          end,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setChunk(meta);
        setSource('network');
        setLoading(false);

        void putCachedChunk({
          key,
          claimId: documentId,
          page,
          bytes,
          start: meta.start,
          end: meta.end,
          chunkSize: meta.chunkSize,
          totalSize: meta.totalSize,
          contentRange: meta.contentRange,
          cachedAt: Date.now(),
        }).catch(() => undefined);
      } catch (e: unknown) {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : 'Failed to stream page');
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [documentId, page, totalPages]);

  return { loading, error, chunk, source };
}
