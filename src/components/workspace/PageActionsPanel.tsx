import { useEffect, useRef, useState } from 'react';
import {
  Scissors,
  Combine,
  RotateCw,
  Trash2,
  CheckCircle2,
  Lock,
  type LucideIcon,
} from 'lucide-react';
import {
  usePermissions,
  type PermissionAction,
} from '../../context/RBACContext';
import type {
  DocumentActionType,
  DocumentWorkerRequest,
  DocumentWorkerResponse,
} from '../../workers/documentProcessor.types';

interface PageActionsPanelProps {
  currentPage: number;
}

interface PageOperation {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  permission: PermissionAction;
  danger?: boolean;
}

const OPERATIONS: PageOperation[] = [
  {
    id: 'split',
    label: 'Split PDF',
    description: 'Divide this document into separate files',
    icon: Scissors,
    permission: 'edit',
  },
  {
    id: 'merge',
    label: 'Merge Pages',
    description: 'Combine selected pages into one',
    icon: Combine,
    permission: 'edit',
  },
  {
    id: 'rotate',
    label: 'Rotate Page',
    description: 'Rotate the current page 90°',
    icon: RotateCw,
    permission: 'edit',
  },
  {
    id: 'delete',
    label: 'Delete Page',
    description: 'Permanently remove the current page',
    icon: Trash2,
    permission: 'delete',
    danger: true,
  },
];

const ONE_GB = 1_073_741_824;

function formatBytes(bytes: number): string {
  const gb = bytes / ONE_GB;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

function actionFor(opId: string): DocumentActionType {
  if (opId === 'split') return 'SPLIT_DOCUMENT';
  if (opId === 'merge') return 'MERGE_PAGES';
  return 'PROCESS_CHUNK';
}

export function PageActionsPanel({ currentPage }: PageActionsPanelProps) {
  const { hasPermission } = usePermissions();
  const [activeOp, setActiveOp] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  // Holds the op currently running so the worker's onmessage can resolve it.
  const activeOpRef = useRef<PageOperation | null>(null);

  useEffect(() => {
    // Vite resolves this URL form to a bundled module worker.
    const worker = new Worker(
      new URL('../../workers/documentProcessor.worker.ts', import.meta.url),
      { type: 'module' },
    );
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<DocumentWorkerResponse>) => {
      const msg = event.data;
      if (msg.status === 'PROGRESS') {
        setProgress(msg.progress);
        return;
      }
      // COMPLETE: surface the simulated payload from the worker.
      const op = activeOpRef.current;
      const detail =
        msg.action === 'SPLIT_DOCUMENT'
          ? `${msg.payload.resultFiles} files`
          : formatBytes(msg.payload.processedBytes);
      setProgress(100);
      setActiveOp(null);
      setCompleted(
        `${op?.label ?? 'Operation'} completed — processed ${detail} in ${msg.payload.durationMs}ms`,
      );
      activeOpRef.current = null;
    };

    // Terminate on unmount to avoid leaking the worker thread.
    return () => worker.terminate();
  }, []);

  const runOperation = (op: PageOperation) => {
    if (activeOpRef.current) return;
    setCompleted(null);
    setActiveOp(op.id);
    setProgress(0);
    activeOpRef.current = op;

    // Offload the heavy job to the worker; the main thread stays at 60 FPS.
    const request: DocumentWorkerRequest = {
      action: actionFor(op.id),
      fileName: `page-${currentPage}.pdf`,
      sizeBytes: ONE_GB,
    };
    workerRef.current?.postMessage(request);
  };

  return (
    <div className='scrollbar-thin flex h-full flex-col gap-3 overflow-y-auto p-4'>
      <p className='text-xs text-slate-400'>
        Heavy operations run against page {currentPage}. Actions are blocked
        while a job is processing.
      </p>

      {OPERATIONS.map((op) => {
        const Icon = op.icon;
        const allowed = hasPermission(op.permission);
        const isRunning = activeOp === op.id;
        const disabled = !allowed || (activeOp !== null && !isRunning);

        return (
          <div
            key={op.id}
            className={`rounded-2xl border p-4 transition ${
              op.danger
                ? 'border-rose-100 bg-rose-50/40'
                : 'border-slate-100 bg-white'
            }`}
          >
            <div className='flex items-start gap-3'>
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                  op.danger
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-brand-50 text-brand-600'
                }`}
              >
                <Icon className='h-5 w-5' />
              </span>
              <div className='min-w-0 flex-1'>
                <p className='text-sm font-semibold text-slate-800'>
                  {op.label}
                </p>
                <p className='mt-0.5 text-xs text-slate-400'>
                  {op.description}
                </p>
              </div>
              <button
                type='button'
                onClick={() => runOperation(op)}
                disabled={disabled}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  op.danger
                    ? 'bg-rose-500 text-white hover:bg-rose-600'
                    : 'bg-brand-500 text-white hover:bg-brand-600'
                }`}
              >
                {isRunning ? 'Running…' : !allowed ? 'Locked' : 'Run'}
              </button>
            </div>

            {isRunning && (
              <div className='mt-3'>
                <div className='h-1.5 w-full overflow-hidden rounded-full bg-slate-100'>
                  <div
                    className='h-full rounded-full bg-brand-500 transition-[width] duration-100'
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className='mt-1 text-right text-[11px] text-slate-400'>
                  {Math.round(progress)}%
                </p>
              </div>
            )}

            {!allowed && (
              <p className='mt-2 flex items-center gap-1 text-[11px] text-slate-400'>
                <Lock className='h-3 w-3' />
                Requires {op.permission} permission
              </p>
            )}
          </div>
        );
      })}

      {completed && (
        <div className='flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-600'>
          <CheckCircle2 className='h-4 w-4' />
          {completed}
        </div>
      )}
    </div>
  );
}
