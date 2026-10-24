// Jerarquia numerica de roles — fuente unica de verdad.
// Niveles: superadmin=100, admin=90, owner=85, ceo/gestor=80,
//          supervisor=60, agent=30, user=10.
// Regla general: hasMinLevel(role, N) para permisos graduados.

export const ROLE_LEVELS = {
  superadmin: 100,
  admin: 90,
  owner: 85,
  ceo: 80,
  gestor: 80,
  supervisor: 60,
  agent: 30,
  user: 10,
} as const;

export type Role = keyof typeof ROLE_LEVELS;

export function getRoleLevel(role?: string | null): number {
  const r = String(role || '').toLowerCase().trim() as Role;
  return ROLE_LEVELS[r] ?? 0;
}

export function hasMinLevel(role: string | null | undefined, min: number): boolean {
  return getRoleLevel(role) >= min;
}

// Alias retrocompatible con el codigo existente.
// Equivale a "puede ver todos los caller IDs del tenant" (nivel >= 80).
export const PRIVILEGED_ROLES = ['superadmin', 'admin', 'owner', 'ceo', 'gestor'] as const;

export function isPrivilegedRole(role?: string | null): boolean {
  return hasMinLevel(role, 80);
}

// Helpers de permisos especificos (uso futuro):
export const canManageUsers = (r?: string | null) => hasMinLevel(r, 90);
export const canManageBilling = (r?: string | null) => hasMinLevel(r, 85);
export const canSeeAllCallerIds = (r?: string | null) => hasMinLevel(r, 80);
export const canSuperviseAgents = (r?: string | null) => hasMinLevel(r, 60);
