import { SideNav } from '../components/layout/SideNav';
import { Header } from '../components/layout/Header';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { ClaimsDataGrid } from '../components/dashboard/ClaimsDataGrid';

export function DashboardPage() {
  return (
    <div className='flex h-screen overflow-hidden bg-canvas'>
      <SideNav activeItemId='claims' />

      <main className='scrollbar-thin flex-1 overflow-y-auto'>
        <div className='mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-8 lg:px-10'>
          <Header userName='Evano' />
          <SummaryCards />
          <ClaimsDataGrid />
        </div>
      </main>
    </div>
  );
}
