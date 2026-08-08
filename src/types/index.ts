import type { LucideIcon } from 'lucide-react';

/** A single navigation entry rendered in the SideNav. */
export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

/** Trend direction for a summary metric. */
export type TrendDirection = 'up' | 'down';

/** A metric shown in the top summary cards. */
export interface SummaryMetric {
  id: string;
  label: string;
  value: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  trend?: {
    direction: TrendDirection;
    value: string;
    caption: string;
  };
  avatars?: string[];
}
