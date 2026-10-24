export const PRIVILEGED_ROLES = [
  'superadmin',
  'admin',
  'owner',
  'supervisor',
  'ceo',
  'gestor',
] as const;

export const isPrivilegedRole = (role?: string | null): boolean =>
  PRIVILEGED_ROLES.includes(
    String(role || '').toLowerCase().trim() as (typeof PRIVILEGED_ROLES)[number]
  );
