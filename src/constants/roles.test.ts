import { describe, expect, it } from 'vitest';
import { canSeeAllCallerIds, getRoleLevel, isPrivilegedRole, normalizeRole } from './roles';

describe('role compatibility', () => {
  it.each(['agent', 'agente', 'tlmk', 'telemarketing', 'setter', 'closer', 'operador'])(
    'normalizes legacy agent role %s',
    (role) => {
      expect(normalizeRole(role)).toBe('agent');
      expect(getRoleLevel(role)).toBe(30);
      expect(canSeeAllCallerIds(role)).toBe(false);
    }
  );

  it('keeps privileged roles privileged', () => {
    expect(isPrivilegedRole('superadmin')).toBe(true);
    expect(isPrivilegedRole('admin')).toBe(true);
    expect(isPrivilegedRole('gestor')).toBe(true);
    expect(isPrivilegedRole('supervisor')).toBe(false);
  });

  it('does not grant permissions to unknown roles', () => {
    expect(normalizeRole('unexpected-role')).toBeNull();
    expect(getRoleLevel('unexpected-role')).toBe(0);
  });
});
