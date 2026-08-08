import { ShieldCheck, Eye } from 'lucide-react';
import { usePermissions, type Role } from '../../context/RBACContext';

const ROLES: { value: Role; label: string; icon: typeof Eye }[] = [
  { value: 'Adjudicator', label: 'Adjudicator', icon: ShieldCheck },
  { value: 'Viewer', label: 'Viewer', icon: Eye },
];

/** Segmented control to switch the active RBAC role for the demo. */
export function RoleSelector() {
  const { currentRole, setRole } = usePermissions();

  return (
    <div className='inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-1'>
      {ROLES.map(({ value, label, icon: Icon }) => {
        const isActive = currentRole === value;
        return (
          <button
            key={value}
            type='button'
            onClick={() => setRole(value)}
            aria-pressed={isActive}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              isActive
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className='h-3.5 w-3.5' />
            {label}
          </button>
        );
      })}
    </div>
  );
}
