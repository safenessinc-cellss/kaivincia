import { describe, expect, it } from 'vitest';
import { getRoleLevel, hasEffectivePermission, isPrivilegedRole, normalizeRole } from './roles';

describe('role normalization', () => {
  it.each(['sales', 'ventas', 'tlmk', 'telemarketing', 'setter', 'closer', 'agente', 'operador'])('maps legacy role %s to agent', (role) => {
    expect(normalizeRole(role)).toBe('agent');
    expect(getRoleLevel(role)).toBe(30);
  });

  it('normalizes case and whitespace', () => {
    expect(normalizeRole('  TLMK ')).toBe('agent');
  });

  it('does not grant administrative privilege to sales aliases', () => {
    expect(isPrivilegedRole('sales')).toBe(false);
    expect(isPrivilegedRole('agente')).toBe(false);
  });

  it('preserves executive privilege levels', () => {
    expect(isPrivilegedRole('superadmin')).toBe(true);
    expect(isPrivilegedRole('ceo')).toBe(true);
    expect(isPrivilegedRole('gestor')).toBe(true);
  });
});


describe('effective module permissions', () => {
  it('uses an explicit per-user deny before the role matrix', () => {
    expect(hasEffectivePermission({
      role: 'agent', permissionId: 'voip_calls', userPermissions: { voip_calls: false },
      matrix: { sales: { voip_calls: true } }, fallbackRoles: ['agent']
    })).toBe(false);
  });

  it('uses an explicit per-user grant before the role matrix', () => {
    expect(hasEffectivePermission({
      role: 'user', permissionId: 'voip_calls', userPermissions: { voip_calls: true },
      matrix: { user: { voip_calls: false } }, fallbackRoles: []
    })).toBe(true);
  });

  it('resolves legacy sales matrix keys for normalized agent roles', () => {
    expect(hasEffectivePermission({
      role: 'tlmk', permissionId: 'voip_calls', matrix: { sales: { voip_calls: true } },
      fallbackRoles: []
    })).toBe(true);
  });

  it('uses the persisted role matrix before fallback defaults', () => {
    expect(hasEffectivePermission({
      role: 'gestor', permissionId: 'accounting_gps', matrix: { gestor: { accounting_gps: false } },
      fallbackRoles: ['gestor']
    })).toBe(false);
  });

  it('uses normalized fallback roles when no matrix value exists', () => {
    expect(hasEffectivePermission({
      role: 'ventas', permissionId: 'voip_calls', matrix: null, fallbackRoles: ['agent']
    })).toBe(true);
  });
});
