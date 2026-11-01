// Jerarquia numerica de roles — fuente unica de verdad.
// Los alias historicos se normalizan aqui para no romper perfiles ya existentes.
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
const ROLE_ALIASES: Record<string, Role> = {
  agente: 'agent',
  tlmk: 'agent',
  telemarketing: 'agent',
  setter: 'agent',
  closer: 'agent',
  operador: 'agent',
};

export function normalizeRole(role?: string | null): Role | null {
  const raw = String(role || '').toLowerCase().trim();
  const normalized = ROLE_ALIASES[raw] || raw;
  return Object.prototype.hasOwnProperty.call(ROLE_LEVELS, normalized)
    ? normalized as Role
    : null;
}

export function getRoleLevel(role?: string | null): number {
  const normalized = normalizeRole(role);
  return normalized ? ROLE_LEVELS[normalized] : 0;
}

export function hasMinLevel(role: string | null | undefined, min: number): boolean {
  return getRoleLevel(role) >= min;
}

export const PRIVILEGED_ROLES = ['superadmin', 'admin', 'owner', 'ceo', 'gestor'] as const;

export function isPrivilegedRole(role?: string | null): boolean {
  return hasMinLevel(role, 80);
}

export const canManageUsers = (r?: string | null) => hasMinLevel(r, 90);
export const canManageBilling = (r?: string | null) => hasMinLevel(r, 85);
export const canSeeAllCallerIds = (r?: string | null) => hasMinLevel(r, 80);
export const canSuperviseAgents = (r?: string | null) => hasMinLevel(r, 60);
