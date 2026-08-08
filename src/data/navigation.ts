import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  BarChart3,
  Settings,
  HelpCircle,
} from 'lucide-react';
import type { NavItem } from '../types';

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'claims', label: 'Claims', icon: FileText },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help', icon: HelpCircle },
];
