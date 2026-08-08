import { Search, Bell } from 'lucide-react';

interface HeaderProps {
  userName?: string;
}

/** Top header with a greeting on the left and a pill-style global search on the right. */
export function Header({ userName = 'Evano' }: HeaderProps) {
  return (
    <header className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
      <div>
        <h1 className='text-2xl font-bold text-slate-900'>
          Hello {userName} <span className='align-middle'>👋</span>
        </h1>
        <p className='mt-1 text-sm text-slate-400'>
          Here's what's happening with your claims today.
        </p>
      </div>

      <div className='flex items-center gap-3'>
        <div className='relative'>
          <Search className='pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
          <input
            type='search'
            placeholder='Search'
            aria-label='Global search'
            className='w-64 rounded-full border border-slate-100 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100'
          />
        </div>
        <button
          type='button'
          aria-label='Notifications'
          className='relative grid h-11 w-11 place-items-center rounded-full border border-slate-100 bg-white text-slate-500 shadow-sm transition hover:text-brand-500'
        >
          <Bell className='h-5 w-5' />
          <span className='absolute right-3 top-3 h-2 w-2 rounded-full bg-rose-500' />
        </button>
      </div>
    </header>
  );
}
