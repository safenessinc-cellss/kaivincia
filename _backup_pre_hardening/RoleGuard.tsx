import React from 'react';

export const DEFAULT_ALLOWED_ROLES = ['admin', 'superadmin', 'owner', 'supervisor'] as const;

interface RoleGuardProps {
  userRole?: string | null;
  allowedRoles?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  userRole,
  allowedRoles = [...DEFAULT_ALLOWED_ROLES],
  children,
  fallback = null,
}) => {
  if (!userRole) return <>{fallback}</>;
  const normalized = String(userRole).toLowerCase().trim();
  const allowed = allowedRoles.map((r) => r.toLowerCase().trim());
  if (allowed.includes(normalized)) return <>{children}</>;
  return <>{fallback}</>;
};

export function isPrivilegedRole(role?: string | null): boolean {
  if (!role) return false;
  const normalized = String(role).toLowerCase().trim();
  return (DEFAULT_ALLOWED_ROLES as readonly string[]).includes(normalized);
}

export default RoleGuard;
