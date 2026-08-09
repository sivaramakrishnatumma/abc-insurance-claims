import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Search,
  ChevronDown,
  Pencil,
  UserPlus,
  Trash2,
  Loader2,
} from 'lucide-react';
import { type Claim, type ClaimStatus } from '../../data/mockClaims';
import { AuthorizedView, usePermissions } from '../../store/RBACContext';
import { useClaims } from '../../hooks/useClaims';
import type { SortDir } from '../../lib/api';
import { RoleSelector } from './RoleSelector';

const ROW_HEIGHT = 60;

/** Shared column template so the header and virtualized rows stay aligned. */
const GRID_COLS =
  'grid grid-cols-[minmax(0,1.5fr)_minmax(0,0.9fr)_minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1.1fr)] items-center gap-4 px-6';

type SortKey = 'newest' | 'name' | 'amount' | 'status';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'amount', label: 'Amount (High–Low)' },
  { value: 'status', label: 'Status' },
];

// Maps the UI sort choice to the server's sortBy/sortOrder params.
const SORT_FIELDS: Record<SortKey, { sortBy: string; sortOrder: SortDir }> = {
  newest: { sortBy: 'id', sortOrder: 'desc' },
  name: { sortBy: 'customerName', sortOrder: 'asc' },
  amount: { sortBy: 'amount', sortOrder: 'desc' },
  status: { sortBy: 'status', sortOrder: 'asc' },
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const STATUS_STYLES: Record<ClaimStatus, string> = {
  Active: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
  Closed: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
  Pending: 'bg-amber-50 text-amber-600 ring-amber-200',
};

function StatusBadge({ status }: { status: ClaimStatus }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg px-3 py-1 text-xs font-semibold ring-1 ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

interface ActionButtonProps {
  label: string;
  icon: typeof Pencil;
  onClick: () => void;
  tone: 'brand' | 'blue' | 'rose';
}

const TONE_STYLES: Record<ActionButtonProps['tone'], string> = {
  brand: 'text-brand-600 hover:bg-brand-50',
  blue: 'text-sky-600 hover:bg-sky-50',
  rose: 'text-rose-600 hover:bg-rose-50',
};

function ActionButton({ label, icon: Icon, onClick, tone }: ActionButtonProps) {
  return (
    <button
      type='button'
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={label}
      aria-label={label}
      className={`grid h-8 w-8 place-items-center rounded-lg transition ${TONE_STYLES[tone]}`}
    >
      <Icon className='h-4 w-4' />
    </button>
  );
}

function RowActions({ claim }: { claim: Claim }) {
  const { currentRole } = usePermissions();

  return (
    <div className='flex items-center gap-1'>
      <AuthorizedView action='edit'>
        <ActionButton
          label='Edit'
          icon={Pencil}
          tone='brand'
          onClick={() => console.info('Edit', claim.id)}
        />
      </AuthorizedView>
      <AuthorizedView action='assign'>
        <ActionButton
          label='Assign'
          icon={UserPlus}
          tone='blue'
          onClick={() => console.info('Assign', claim.id)}
        />
      </AuthorizedView>
      <AuthorizedView action='delete'>
        <ActionButton
          label='Delete'
          icon={Trash2}
          tone='rose'
          onClick={() => console.info('Delete', claim.id)}
        />
      </AuthorizedView>
      {currentRole === 'Viewer' && (
        <span className='text-xs font-medium text-slate-300'>Read-only</span>
      )}
    </div>
  );
}

const HEADERS = [
  'Customer Name',
  'Company',
  'Email',
  'Claim Amount',
  'Status',
  'Actions',
];

export function ClaimsDataGrid() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const parentRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Debounce search so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { sortBy, sortOrder } = SORT_FIELDS[sortKey];
  const {
    data,
    isLoading,
    isError,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useClaims(debouncedSearch, sortBy, sortOrder);

  const rows = useMemo(
    () => (data ? data.pages.flatMap((page) => page.data) : []),
    [data],
  );
  const total = data?.pages[0]?.total ?? 0;

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // Infinite scroll: fetch the next page as the last row scrolls into view.
  useEffect(() => {
    const last = virtualItems[virtualItems.length - 1];
    if (
      last &&
      last.index >= rows.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    virtualItems,
    rows.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  // Reset scroll to the top whenever the query changes.
  useEffect(() => {
    parentRef.current?.scrollTo({ top: 0 });
  }, [debouncedSearch, sortKey]);

  return (
    <section className='rounded-3xl bg-white p-6 shadow-card'>
      {/* Card header */}
      <div className='flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between'>
        <div>
          <h2 className='text-lg font-bold text-slate-900'>All Claims</h2>
          <p className='mt-0.5 text-sm font-medium text-emerald-500'>
            {total.toLocaleString()} claims found
          </p>
          {isFetching && !isLoading && (
            <p className='mt-1 flex items-center gap-1 text-xs text-slate-400'>
              <Loader2 className='h-3 w-3 animate-spin' />
              Syncing with server…
            </p>
          )}
        </div>

        <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
          <RoleSelector />

          <div className='relative'>
            <Search className='pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
            <input
              type='search'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search claims'
              aria-label='Search claims'
              className='w-56 rounded-xl border border-slate-100 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100'
            />
          </div>

          <div className='relative'>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              aria-label='Sort claims'
              className='appearance-none rounded-xl border border-slate-100 bg-slate-50 py-2.5 pl-4 pr-9 text-sm font-medium text-slate-600 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100'
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Sort by: {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className='pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
          </div>
        </div>
      </div>

      {/* Column header */}
      <div
        className={`${GRID_COLS} mt-6 border-b border-slate-100 pb-3 text-xs font-semibold uppercase tracking-wide text-slate-400`}
      >
        {HEADERS.map((h) => (
          <span
            key={h}
            className={h === 'Claim Amount' ? 'text-right' : undefined}
          >
            {h}
          </span>
        ))}
      </div>

      {/* Virtualized rows */}
      <div ref={parentRef} className='scrollbar-thin h-[600px] overflow-y-auto'>
        {isLoading ? (
          <div>
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`${GRID_COLS} border-b border-slate-50`}
                style={{ height: ROW_HEIGHT }}
              >
                <span className='h-3 w-3/4 animate-pulse rounded bg-slate-200' />
                <span className='h-3 w-1/2 animate-pulse rounded bg-slate-200' />
                <span className='h-3 w-5/6 animate-pulse rounded bg-slate-200' />
                <span className='ml-auto h-3 w-1/2 animate-pulse rounded bg-slate-200' />
                <span className='h-5 w-16 animate-pulse rounded-lg bg-slate-200' />
                <span className='h-6 w-20 animate-pulse rounded-lg bg-slate-200' />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className='grid h-full place-items-center text-sm text-rose-500'>
            Failed to load claims. Is the API running on :3001?
          </div>
        ) : rows.length === 0 ? (
          <div className='grid h-full place-items-center text-sm text-slate-400'>
            No claims match “{debouncedSearch}”.
          </div>
        ) : (
          <div
            style={{
              height: rowVirtualizer.getTotalSize(),
              position: 'relative',
            }}
          >
            {virtualItems.map((virtualRow) => {
              const claim = rows[virtualRow.index];
              return (
                <div
                  key={claim.id}
                  role='button'
                  tabIndex={0}
                  onClick={() =>
                    navigate(`/claims/${claim.id}/workspace`, {
                      state: { claim },
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/claims/${claim.id}/workspace`, {
                        state: { claim },
                      });
                    }
                  }}
                  className={`${GRID_COLS} absolute left-0 top-0 w-full cursor-pointer border-b border-slate-50 text-sm text-slate-600 outline-none hover:bg-slate-50/70 focus-visible:bg-brand-50`}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <span className='truncate font-semibold text-slate-800'>
                    {claim.customerName}
                  </span>
                  <span className='truncate'>{claim.company}</span>
                  <span className='truncate text-slate-500'>{claim.email}</span>
                  <span className='text-right font-medium text-slate-700'>
                    {currencyFormatter.format(claim.amount)}
                  </span>
                  <span>
                    <StatusBadge status={claim.status} />
                  </span>
                  <RowActions claim={claim} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer counter */}
      <p className='mt-4 flex items-center gap-2 text-xs text-slate-400'>
        Showing {rows.length.toLocaleString()} of {total.toLocaleString()}{' '}
        claims
        {isFetchingNextPage && <Loader2 className='h-3 w-3 animate-spin' />}
      </p>
    </section>
  );
}
