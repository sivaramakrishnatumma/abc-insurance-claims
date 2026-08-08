import { FileStack, FolderOpen, Clock } from 'lucide-react';
import type { SummaryMetric } from '../types';

export const SUMMARY_METRICS: SummaryMetric[] = [
  {
    id: 'total-claims',
    label: 'Total Claims',
    value: '23,410',
    icon: FileStack,
    iconBg: 'bg-brand-50',
    iconColor: 'text-brand-500',
    trend: { direction: 'up', value: '16%', caption: 'this month' },
  },
  {
    id: 'open-claims',
    label: 'Open Claims',
    value: '4,182',
    icon: FolderOpen,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    trend: { direction: 'down', value: '1%', caption: 'this month' },
  },
  {
    id: 'pending-review',
    label: 'Pending Review',
    value: '892',
    icon: Clock,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    avatars: [
      'https://i.pravatar.cc/40?img=1',
      'https://i.pravatar.cc/40?img=5',
      'https://i.pravatar.cc/40?img=8',
      'https://i.pravatar.cc/40?img=12',
    ],
  },
];
