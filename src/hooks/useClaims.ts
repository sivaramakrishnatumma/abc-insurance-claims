import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchClaims, type SortDir } from '../lib/api';

const PAGE_SIZE = 50;

/**
 * Cursor-style infinite query over the BFF's paginated claims endpoint.
 * Server performs search/sort; the client only holds the pages it has scrolled.
 */
export function useClaims(search: string, sortBy: string, sortOrder: SortDir) {
  return useInfiniteQuery({
    queryKey: ['claims', { search, sortBy, sortOrder }],
    queryFn: ({ pageParam, signal }) =>
      fetchClaims(
        { page: pageParam, limit: PAGE_SIZE, search, sortBy, sortOrder },
        signal,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });
}
