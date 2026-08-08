import { SideNav } from './components/layout/SideNav';
import { Header } from './components/layout/Header';
import { SummaryCards } from './components/dashboard/SummaryCards';

function App() {
  return (
    <div className='flex h-screen overflow-hidden bg-canvas'>
      <SideNav activeItemId='claims' />

      <main className='scrollbar-thin flex-1 overflow-y-auto'>
        <div className='mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-8 lg:px-10'>
          <Header userName='Evano' />
          <SummaryCards />

          {/* Data grid placeholder — built in the next step */}
          <section className='grid min-h-[320px] place-items-center rounded-3xl border border-dashed border-slate-200 bg-white/60 text-sm text-slate-400 shadow-card'>
            Claims data grid coming in Step 2
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
