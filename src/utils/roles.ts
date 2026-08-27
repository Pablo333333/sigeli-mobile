export type UserRole = 'COMUNERO' | 'EMPRESA' | 'ADMIN' | 'AUDITOR' | 'DIRECTIVA';

export const ROLE_LABELS: Record<UserRole, string> = {
  COMUNERO: 'Comunero',
  EMPRESA: 'Empresa',
  ADMIN: 'Administrador',
  AUDITOR: 'Auditor',
  DIRECTIVA: 'Directiva Comunal',
};

/** Capacidades de UI según rol (alineado a RolePermissions del backend). */
export function canAccess(role: string | undefined, feature: string): boolean {
  const r = (role || 'COMUNERO') as UserRole;

  const map: Record<string, UserRole[]> = {
    cv: ['COMUNERO', 'ADMIN', 'EMPRESA'],
    ofertas: ['COMUNERO', 'EMPRESA', 'DIRECTIVA', 'ADMIN', 'AUDITOR'],
    postulaciones: ['COMUNERO', 'EMPRESA', 'DIRECTIVA', 'ADMIN', 'AUDITOR'],
    postularTerceros: ['DIRECTIVA', 'EMPRESA', 'ADMIN'],
    reclamos: ['COMUNERO', 'EMPRESA', 'ADMIN'],
    evaluaciones: ['COMUNERO', 'EMPRESA', 'ADMIN'],
    contratos: ['EMPRESA', 'ADMIN'],
    dashboard: ['DIRECTIVA', 'EMPRESA', 'ADMIN', 'AUDITOR'],
    capacitaciones: ['COMUNERO', 'EMPRESA', 'DIRECTIVA', 'ADMIN'],
    chat: ['COMUNERO', 'EMPRESA', 'DIRECTIVA', 'ADMIN'],
    puntos: ['COMUNERO', 'ADMIN'],
  };

  return (map[feature] || []).includes(r);
}

export function isDirectiva(role?: string) {
  return role === 'DIRECTIVA';
}

export function isComunero(role?: string) {
  return role === 'COMUNERO' || !role;
}
