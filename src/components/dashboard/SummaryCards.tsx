import { TrendingUp, TrendingDown } from 'lucide-react';
import type { SummaryMetric } from '../../types';
import { SUMMARY_METRICS } from '../../data/summary';

function AvatarStack({ avatars }: { avatars: string[] }) {
  return (
    <div className='flex items-center'>
      {avatars.map((src, index) => (
        <img
          key={src}
          src={src}
          alt=''
          className='h-7 w-7 rounded-full border-2 border-white object-cover'
          style={{
            marginLeft: index === 0 ? 0 : -10,
            zIndex: avatars.length - index,
          }}
        />
      ))}
      <span className='ml-2 grid h-7 w-7 place-items-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-600'>
        +9
      </span>
    </div>
  );
}

function MetricCell({ metric }: { metric: SummaryMetric }) {
  const Icon = metric.icon;
  return (
    <div className='flex items-center gap-4 px-6 py-2'>
      <span
        className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${metric.iconBg} ${metric.iconColor}`}
      >
        <Icon className='h-6 w-6' />
      </span>

      <div className='min-w-0'>
        <p className='text-sm text-slate-400'>{metric.label}</p>
        <p className='mt-0.5 text-2xl font-bold text-slate-900'>
          {metric.value}
        </p>

        {metric.trend && (
          <p
            className={`mt-1 flex items-center gap-1 text-xs font-medium ${
              metric.trend.direction === 'up'
                ? 'text-emerald-500'
                : 'text-rose-500'
            }`}
          >
            {metric.trend.direction === 'up' ? (
              <TrendingUp className='h-3.5 w-3.5' />
            ) : (
              <TrendingDown className='h-3.5 w-3.5' />
            )}
            {metric.trend.value}
            <span className='text-slate-400'>{metric.trend.caption}</span>
          </p>
        )}

        {metric.avatars && (
          <div className='mt-2'>
            <AvatarStack avatars={metric.avatars} />
          </div>
        )}
      </div>
    </div>
  );
}

/** Unified white card split into three metric sections separated by dividers. */
export function SummaryCards() {
  return (
    <section className='grid grid-cols-1 divide-y divide-slate-100 rounded-3xl bg-white p-4 shadow-card md:grid-cols-3 md:divide-x md:divide-y-0'>
      {SUMMARY_METRICS.map((metric) => (
        <MetricCell key={metric.id} metric={metric} />
      ))}
    </section>
  );
}
