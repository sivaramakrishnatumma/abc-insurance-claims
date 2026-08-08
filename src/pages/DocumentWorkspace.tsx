import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Layers, FileText } from 'lucide-react';
import {
  findClaimById,
  type Claim,
  type ClaimStatus,
} from '../data/mockClaims';
import { buildClaimDocument } from '../data/mockDocument';
import { DocumentViewer } from '../components/workspace/DocumentViewer';
import { CommentsPanel } from '../components/workspace/CommentsPanel';
import { PageActionsPanel } from '../components/workspace/PageActionsPanel';

type WorkspaceTab = 'comments' | 'actions';

const STATUS_STYLES: Record<ClaimStatus, string> = {
  Active: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
  Closed: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
  Pending: 'bg-amber-50 text-amber-600 ring-amber-200',
};

function StatusBadge({ status }: { status: ClaimStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold ring-1 ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

export function DocumentWorkspace() {
  const { claimId = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<WorkspaceTab>('comments');
  const [currentPage, setCurrentPage] = useState(1);

  // Prefer claim passed via router state; fall back to a lookup for deep-links.
  const claim = useMemo<Claim | undefined>(() => {
    const fromState = (location.state as { claim?: Claim } | null)?.claim;
    return fromState ?? findClaimById(claimId);
  }, [location.state, claimId]);

  const document = useMemo(() => buildClaimDocument(claimId), [claimId]);

  const goBack = () => navigate('/claims');

  if (!claim) {
    return (
      <div className='grid h-screen place-items-center bg-canvas'>
        <div className='text-center'>
          <p className='text-lg font-semibold text-slate-700'>
            Claim {claimId} not found
          </p>
          <button
            type='button'
            onClick={goBack}
            className='mt-4 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600'
          >
            ← Back to Claims List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='animate-workspace-in flex h-screen w-screen flex-col overflow-hidden bg-canvas'>
      {/* Workspace header */}
      <header className='flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4'>
        <div className='flex items-center gap-4'>
          <button
            type='button'
            onClick={goBack}
            className='flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-600'
          >
            <ArrowLeft className='h-4 w-4' />
            Back to Claims List
          </button>
          <div className='h-8 w-px bg-slate-200' />
          <div className='flex items-center gap-3'>
            <span className='grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600'>
              <FileText className='h-5 w-5' />
            </span>
            <div>
              <div className='flex items-center gap-2'>
                <h1 className='text-base font-bold text-slate-900'>
                  {claim.id}
                </h1>
                <StatusBadge status={claim.status} />
              </div>
              <p className='text-sm text-slate-500'>
                {claim.customerName} · {claim.type} · {document.fileName} (
                {document.sizeLabel})
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Split view */}
      <div className='flex flex-1 gap-4 overflow-hidden p-4'>
        {/* Left — document viewer (65%) */}
        <div className='w-[65%] overflow-hidden'>
          <DocumentViewer
            document={document}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* Right — control center (35%) */}
        <div className='flex w-[35%] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white'>
          <div className='flex border-b border-slate-100'>
            <button
              type='button'
              onClick={() => setTab('comments')}
              className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold transition ${
                tab === 'comments'
                  ? 'border-b-2 border-brand-500 text-brand-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <MessageSquare className='h-4 w-4' />
              Comments
            </button>
            <button
              type='button'
              onClick={() => setTab('actions')}
              className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold transition ${
                tab === 'actions'
                  ? 'border-b-2 border-brand-500 text-brand-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Layers className='h-4 w-4' />
              Page Actions
            </button>
          </div>

          <div className='flex-1 overflow-hidden'>
            {tab === 'comments' ? (
              <CommentsPanel currentPage={currentPage} />
            ) : (
              <PageActionsPanel currentPage={currentPage} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
