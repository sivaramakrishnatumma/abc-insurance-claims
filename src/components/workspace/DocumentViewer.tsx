import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  MessageSquarePlus,
  Highlighter,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Database,
} from 'lucide-react';
import type { ClaimDocument } from '../../data/mockDocument';
import { useDocumentStream } from '../../hooks/useDocumentStream';

interface DocumentViewerProps {
  document: ClaimDocument;
  claimId: string;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const MIN_ZOOM = 50;
const MAX_ZOOM = 200;
const ZOOM_STEP = 10;

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export function DocumentViewer({
  document,
  claimId,
  currentPage,
  onPageChange,
}: DocumentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [showAnnotations, setShowAnnotations] = useState(true);

  const totalPages = document.pages.length;
  const page = document.pages[currentPage - 1];

  // Actually stream this page's bytes from the BFF (HTTP Range request).
  const { loading, error, chunk, source } = useDocumentStream(
    claimId,
    currentPage,
    totalPages,
  );

  const goPrev = () => onPageChange(Math.max(1, currentPage - 1));
  const goNext = () => onPageChange(Math.min(totalPages, currentPage + 1));
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP));
  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP));

  return (
    <div className='flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-100'>
      {/* Toolbar */}
      <div className='flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3'>
        <div className='flex items-center gap-1'>
          <button
            type='button'
            onClick={goPrev}
            disabled={currentPage === 1}
            aria-label='Previous page'
            className='grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-40'
          >
            <ChevronLeft className='h-4 w-4' />
          </button>
          <span className='min-w-[92px] text-center text-sm font-medium text-slate-600'>
            Page {currentPage} of {totalPages}
          </span>
          <button
            type='button'
            onClick={goNext}
            disabled={currentPage === totalPages}
            aria-label='Next page'
            className='grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-40'
          >
            <ChevronRight className='h-4 w-4' />
          </button>
        </div>

        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => setShowAnnotations((v) => !v)}
            aria-pressed={showAnnotations}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
              showAnnotations
                ? 'bg-brand-50 text-brand-600'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Highlighter className='h-3.5 w-3.5' />
            Annotations
          </button>

          <div className='flex items-center gap-1 rounded-lg bg-slate-100 p-1'>
            <button
              type='button'
              onClick={zoomOut}
              disabled={zoom === MIN_ZOOM}
              aria-label='Zoom out'
              className='grid h-7 w-7 place-items-center rounded-md text-slate-500 transition hover:bg-white disabled:opacity-40'
            >
              <ZoomOut className='h-4 w-4' />
            </button>
            <span className='w-10 text-center text-xs font-medium text-slate-600'>
              {zoom}%
            </span>
            <button
              type='button'
              onClick={zoomIn}
              disabled={zoom === MAX_ZOOM}
              aria-label='Zoom in'
              className='grid h-7 w-7 place-items-center rounded-md text-slate-500 transition hover:bg-white disabled:opacity-40'
            >
              <ZoomIn className='h-4 w-4' />
            </button>
          </div>
        </div>
      </div>

      {/* Streaming status — proves the page bytes come from the server */}
      <div className='flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-1.5 text-[11px]'>
        {loading ? (
          <span className='flex items-center gap-1.5 text-slate-400'>
            <Loader2 className='h-3 w-3 animate-spin' />
            Streaming page {currentPage} from server…
          </span>
        ) : error ? (
          <span className='flex items-center gap-1.5 text-rose-500'>
            <AlertTriangle className='h-3 w-3' />
            Stream failed: {error}
          </span>
        ) : chunk ? (
          source === 'cache' ? (
            <span className='flex items-center gap-1.5 text-brand-600'>
              <Database className='h-3 w-3' />
              Loaded {formatBytes(chunk.chunkSize)} from IndexedDB cache ·{' '}
              {chunk.contentRange}
            </span>
          ) : (
            <span className='flex items-center gap-1.5 text-emerald-600'>
              <CheckCircle2 className='h-3 w-3' />
              Streamed {formatBytes(chunk.chunkSize)} from server ·{' '}
              {chunk.contentRange}
            </span>
          )
        ) : null}
      </div>

      {/* Page canvas */}
      <div className='scrollbar-thin flex-1 overflow-auto p-8'>
        <div
          className='relative mx-auto bg-white shadow-lg transition-transform duration-200'
          style={{
            width: 620,
            minHeight: 820,
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
          }}
        >
          <div className='p-12'>
            <p className='text-[10px] font-semibold uppercase tracking-widest text-brand-500'>
              {document.fileName}
            </p>
            <h3 className='mt-2 text-xl font-bold text-slate-800'>
              {page.heading}
            </h3>
            <p className='mt-1 text-xs text-slate-400'>
              Page {page.number} — Confidential claim document
            </p>

            <div className='mt-8 space-y-3'>
              {page.lines.map((line, idx) => (
                <p
                  key={idx}
                  className='truncate font-mono text-[11px] leading-relaxed text-slate-300'
                >
                  {line}
                </p>
              ))}
            </div>
          </div>

          {/* Annotation overlay */}
          {showAnnotations && (
            <>
              <div className='pointer-events-none absolute left-12 top-40 h-6 w-48 rounded bg-amber-200/50 ring-1 ring-amber-300' />
              <div className='absolute right-10 top-12 flex items-center gap-1 rounded-full bg-brand-500 px-2.5 py-1 text-[10px] font-semibold text-white shadow-md'>
                <MessageSquarePlus className='h-3 w-3' />2 notes
              </div>
              <div className='absolute left-6 top-[16.5rem] h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white bg-rose-500 shadow' />
            </>
          )}

          {/* Loading overlay while the page streams from the server */}
          {loading && (
            <div className='absolute inset-0 grid place-items-center bg-white/70 backdrop-blur-sm'>
              <span className='flex items-center gap-2 text-sm font-medium text-slate-500'>
                <Loader2 className='h-5 w-5 animate-spin text-brand-500' />
                Loading page from server…
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
