import { useState } from 'react';
import { ChevronLeft, ChevronRight, Hexagon, Sparkles } from 'lucide-react';
import { NAV_ITEMS } from '../../data/navigation';

const EXPANDED_WIDTH = 'w-[250px]';
const COLLAPSED_WIDTH = 'w-[72px]';

interface SideNavProps {
  activeItemId?: string;
}

/**
 * Single collapsible left navigation. Toggling `isCollapsed` animates the width
 * between the expanded (~250px) and collapsed (~72px) states, hiding labels,
 * the wordmark, promo card and profile text when collapsed.
 */
export function SideNav({ activeItemId = 'claims' }: SideNavProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`relative flex h-screen shrink-0 flex-col border-r border-slate-100 bg-white px-3 py-6 transition-[width] duration-300 ease-in-out ${
        isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH
      }`}
    >
      {/* Brand */}
      <div className='mb-8 flex items-center gap-2 px-2'>
        <span className='grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-500 text-white'>
          <Hexagon className='h-5 w-5' strokeWidth={2.5} />
        </span>
        {!isCollapsed && (
          <span className='text-lg font-bold tracking-tight text-slate-900'>
            Dashboard
            <span className='ml-1 align-super text-[10px] font-medium text-slate-400'>
              v.01
            </span>
          </span>
        )}
      </div>

      {/* Toggle */}
      <button
        type='button'
        onClick={() => setIsCollapsed((prev) => !prev)}
        aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        aria-expanded={!isCollapsed}
        className='absolute -right-3 top-8 grid h-6 w-6 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-brand-500'
      >
        {isCollapsed ? (
          <ChevronRight className='h-4 w-4' />
        ) : (
          <ChevronLeft className='h-4 w-4' />
        )}
      </button>

      {/* Navigation */}
      <nav className='flex flex-1 flex-col gap-1'>
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === activeItemId;
          const Icon = item.icon;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={isActive ? 'page' : undefined}
              title={isCollapsed ? item.label : undefined}
              className={`group relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isCollapsed ? 'justify-center' : 'gap-3'
              } ${
                isActive
                  ? 'bg-brand-500 text-white shadow-card shadow-brand-500/30'
                  : 'text-slate-500 hover:bg-brand-50 hover:text-brand-600'
              }`}
            >
              <Icon className='h-5 w-5 shrink-0' />
              {!isCollapsed && <span className='truncate'>{item.label}</span>}

              {/* Hover tooltip when collapsed */}
              {isCollapsed && (
                <span className='pointer-events-none absolute left-full z-20 ml-3 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100'>
                  {item.label}
                </span>
              )}
            </a>
          );
        })}
      </nav>

      {/* Upgrade promo (expanded only) */}
      {!isCollapsed && (
        <div className='relative mb-4 mt-2 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 p-4 text-center text-white'>
          <div className='absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10' />
          <span className='mx-auto mb-2 grid h-9 w-9 place-items-center rounded-full bg-white/20'>
            <Sparkles className='h-4 w-4' />
          </span>
          <p className='text-sm font-semibold leading-snug'>
            Upgrade to PRO to get access to all Features!
          </p>
          <button
            type='button'
            className='mt-3 w-full rounded-full bg-white py-2 text-xs font-semibold text-brand-600 transition hover:bg-brand-50'
          >
            Get Pro Now!
          </button>
        </div>
      )}

      {/* User profile */}
      <div
        className={`flex items-center border-t border-slate-100 pt-4 ${
          isCollapsed ? 'justify-center' : 'gap-3 px-1'
        }`}
      >
        <img
          src='https://i.pravatar.cc/80?img=13'
          alt='Evano'
          className='h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white'
        />
        {!isCollapsed && (
          <div className='min-w-0 flex-1'>
            <p className='truncate text-sm font-semibold text-slate-800'>
              Evano Rodriguez
            </p>
            <p className='truncate text-xs text-slate-400'>Claims Manager</p>
          </div>
        )}
      </div>
    </aside>
  );
}
