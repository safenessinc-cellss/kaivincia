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

// Normalize historical role IDs to one canonical key without changing stored
// user profiles. This keeps legacy accounts working while policies converge.
const ROLE_ALIASES: Record<string, string> = {
  sales: 'agent',
  ventas: 'agent',
  tlmk: 'agent',
  telemarketing: 'agent',
  setter: 'agent',
  closer: 'agent',
  agente: 'agent',
  operador: 'agent',
  call_agent: 'agent',
  rrhh: 'rrhh',
  collaborator: 'collaborator',
  tutor: 'tutor',
  alumno: 'alumno',
  cliente: 'cliente',
};

export function normalizeRole(role?: string | null): string {
  const key = String(role || '').toLowerCase().trim();
  return ROLE_ALIASES[key] || key || 'none';
}

export function getRoleLevel(role?: string | null): number {
  const normalized = normalizeRole(role) as Role;
  return ROLE_LEVELS[normalized] ?? 0;
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

export type PermissionMatrix = Record<string, Record<string, boolean>>;

export function hasEffectivePermission(args: {
  role?: string | null;
  permissionId: string;
  userPermissions?: Record<string, boolean> | null;
  matrix?: PermissionMatrix | null;
  fallbackRoles: string[];
}): boolean {
  const role = normalizeRole(args.role);
  const userOverride = args.userPermissions?.[args.permissionId];
  if (typeof userOverride === 'boolean') return userOverride;

  // Historical RBAC matrix stored the sales profile under the key "sales".
  const roleMatrix = args.matrix?.[role] || (role === 'agent' ? args.matrix?.sales : undefined);
  const matrixValue = roleMatrix?.[args.permissionId];
  if (typeof matrixValue === 'boolean') return matrixValue;

  return args.fallbackRoles.some((fallbackRole) => normalizeRole(fallbackRole) === role);
}
