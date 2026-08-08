import { useState } from 'react';
import { Send, Loader2, Check, AlertCircle, RotateCcw } from 'lucide-react';

type CommentStatus = 'sending' | 'sent' | 'failed';
type CommentScope = 'page' | 'document';

interface Comment {
  id: string;
  author: string;
  text: string;
  scope: CommentScope;
  page?: number;
  status: CommentStatus;
  time: string;
}

interface CommentsPanelProps {
  currentPage: number;
}

const CURRENT_USER = 'Evano Rodriguez';

function timeNow(): string {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Simulates a network round-trip; rejects ~15% of the time to show rollback. */
function persistComment(): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.15) {
        reject(new Error('Network error'));
      } else {
        resolve();
      }
    }, 900);
  });
}

export function CommentsPanel({ currentPage }: CommentsPanelProps) {
  const [text, setText] = useState('');
  const [scope, setScope] = useState<CommentScope>('page');
  const [comments, setComments] = useState<Comment[]>([]);

  const updateStatus = (id: string, status: CommentStatus) =>
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c)),
    );

  const send = async (comment: Comment) => {
    try {
      await persistComment();
      updateStatus(comment.id, 'sent');
    } catch {
      updateStatus(comment.id, 'failed');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    // Optimistic: show the comment immediately, before the server confirms.
    const optimistic: Comment = {
      id: crypto.randomUUID(),
      author: CURRENT_USER,
      text: trimmed,
      scope,
      page: scope === 'page' ? currentPage : undefined,
      status: 'sending',
      time: timeNow(),
    };
    setComments((prev) => [optimistic, ...prev]);
    setText('');
    void send(optimistic);
  };

  const retry = (comment: Comment) => {
    updateStatus(comment.id, 'sending');
    void send(comment);
  };

  return (
    <div className='flex h-full flex-col'>
      {/* Composer */}
      <form onSubmit={handleSubmit} className='border-b border-slate-100 p-4'>
        <div className='mb-2 inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold'>
          <button
            type='button'
            onClick={() => setScope('page')}
            className={`rounded-md px-2.5 py-1 transition ${
              scope === 'page'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            This page ({currentPage})
          </button>
          <button
            type='button'
            onClick={() => setScope('document')}
            className={`rounded-md px-2.5 py-1 transition ${
              scope === 'document'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            Whole document
          </button>
        </div>

        <div className='flex items-end gap-2'>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='Add a comment…'
            rows={2}
            className='flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100'
          />
          <button
            type='submit'
            disabled={!text.trim()}
            aria-label='Post comment'
            className='grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500 text-white transition hover:bg-brand-600 disabled:opacity-40'
          >
            <Send className='h-4 w-4' />
          </button>
        </div>
      </form>

      {/* Thread */}
      <div className='scrollbar-thin flex-1 space-y-3 overflow-y-auto p-4'>
        {comments.length === 0 ? (
          <p className='mt-8 text-center text-sm text-slate-400'>
            No comments yet. Start the conversation.
          </p>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className={`rounded-xl border p-3 transition ${
                c.status === 'sending'
                  ? 'border-slate-100 bg-slate-50 opacity-70'
                  : c.status === 'failed'
                    ? 'border-rose-200 bg-rose-50'
                    : 'border-slate-100 bg-white'
              }`}
            >
              <div className='flex items-center justify-between'>
                <span className='text-sm font-semibold text-slate-800'>
                  {c.author}
                </span>
                <span className='text-[11px] text-slate-400'>{c.time}</span>
              </div>
              <p className='mt-1 text-sm text-slate-600'>{c.text}</p>
              <div className='mt-2 flex items-center gap-2 text-[11px]'>
                <span className='rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-500'>
                  {c.scope === 'page' ? `Page ${c.page}` : 'Document'}
                </span>
                {c.status === 'sending' && (
                  <span className='flex items-center gap-1 text-slate-400'>
                    <Loader2 className='h-3 w-3 animate-spin' />
                    Sending…
                  </span>
                )}
                {c.status === 'sent' && (
                  <span className='flex items-center gap-1 text-emerald-500'>
                    <Check className='h-3 w-3' />
                    Posted
                  </span>
                )}
                {c.status === 'failed' && (
                  <button
                    type='button'
                    onClick={() => retry(c)}
                    className='flex items-center gap-1 font-semibold text-rose-500 hover:underline'
                  >
                    <AlertCircle className='h-3 w-3' />
                    Failed — <RotateCcw className='h-3 w-3' /> Retry
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
