import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type Role = 'Adjudicator' | 'Viewer';
export type PermissionAction = 'edit' | 'delete' | 'assign';

/** Maps each role to the set of actions it is allowed to perform. */
const ROLE_PERMISSIONS: Record<Role, PermissionAction[]> = {
  Adjudicator: ['edit', 'delete', 'assign'],
  Viewer: [],
};

interface RBACContextValue {
  currentRole: Role;
  setRole: (role: Role) => void;
  hasPermission: (action: PermissionAction) => boolean;
}

const RBACContext = createContext<RBACContextValue | undefined>(undefined);

interface RBACProviderProps {
  children: ReactNode;
  initialRole?: Role;
}

export function RBACProvider({
  children,
  initialRole = 'Adjudicator',
}: RBACProviderProps) {
  const [currentRole, setRole] = useState<Role>(initialRole);

  const value = useMemo<RBACContextValue>(
    () => ({
      currentRole,
      setRole,
      hasPermission: (action) => ROLE_PERMISSIONS[currentRole].includes(action),
    }),
    [currentRole],
  );

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>;
}

/** Access the current role, role setter, and a permission checker. */
export function usePermissions(): RBACContextValue {
  const ctx = useContext(RBACContext);
  if (!ctx) {
    throw new Error('usePermissions must be used within an RBACProvider');
  }
  return ctx;
}

interface AuthorizedViewProps {
  action: PermissionAction;
  children: ReactNode;
  /** Rendered instead of `children` when the current role lacks permission. */
  fallback?: ReactNode;
}

/**
 * Conditionally renders `children` only when the current role is authorized for
 * `action`; otherwise renders `fallback` (nothing by default).
 */
export function AuthorizedView({
  action,
  children,
  fallback = null,
}: AuthorizedViewProps) {
  const { hasPermission } = usePermissions();
  return <>{hasPermission(action) ? children : fallback}</>;
}
