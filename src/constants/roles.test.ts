import { describe, expect, it } from 'vitest';
import { getRoleLevel, isPrivilegedRole, normalizeRole } from './roles';

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
