// =========================================================
//  role.model.ts — Modelos dinámicos de roles y permisos
//  Los permisos ahora vienen de la BD (formato MODULO:ACCION)
//  y ya NO dependen de enums hardcodeados en el frontend.
// =========================================================

/**
 * Interfaz de un Rol tal como lo devuelve el backend
 */
export interface RoleResponse {
  id: number;
  name: string;
  permissions: string[]; // ["CLIENTES:READ", "ALL_MODULES:DELETE", ...]
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Interfaz de un Permiso individual
 */
export interface PermissionResponse {
  id: number;
  name: string;        // "CLIENTES:READ"
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoleRequest {
  name: string;
}

export interface PermissionRequest {
  name: string;        // Debe seguir el formato "MODULO:ACCION"
  description?: string;
}

// =========================================================
//  Helpers para trabajar con los permisos planos del backend
// =========================================================

/**
 * Verifica si una lista de permisos planos incluye acceso a un módulo+acción.
 * Soporta el comodín ALL_MODULES.
 *
 * @param permissions  Lista de strings tipo "MODULO:ACCION" del AuthResponse
 * @param module       Nombre del módulo (ej: "CLIENTES")
 * @param action       Acción requerida (ej: "READ")
 */
export function hasPermission(
  permissions: string[],
  module: string,
  action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE'
): boolean {
  if (!permissions || permissions.length === 0) return false;
  const wildcard = `ALL_MODULES:${action}`;
  const specific = `${module}:${action}`;
  return permissions.includes(wildcard) || permissions.includes(specific);
}

/**
 * Obtiene todos los módulos accesibles para un conjunto de permisos.
 * Extrae la parte antes de ":" de cada permiso.
 */
export function getAccessibleModules(permissions: string[]): string[] {
  if (!permissions || permissions.length === 0) return [];

  const modules = new Set<string>();
  permissions.forEach(p => {
    const [mod] = p.split(':');
    if (mod && mod !== 'ALL_MODULES') {
      modules.add(mod);
    }
  });
  return Array.from(modules);
}

/**
 * Verifica si los permisos otorgan acceso de admin
 * (tener ALL_MODULES:DELETE implica acceso total)
 */
export function isAdminPermissions(permissions: string[]): boolean {
  return permissions?.includes('ALL_MODULES:DELETE') ?? false;
}

// =========================================================
//  Módulos del sistema — usados en el menú y guards
//  Deben coincidir con los módulos del backend (@RequirePermission)
// =========================================================
export const MODULE = {
  CLIENTES:          'CLIENTES',
  VIAJEROS:          'VIAJEROS',
  VIAJEROS_FREC:     'VIAJEROS_FREC',
  COTIZACIONES:      'COTIZACIONES',
  RECIBOS:           'RECIBOS',
  LIQUIDACIONES:     'LIQUIDACIONES',
  PRODUCTOS:         'PRODUCTOS',
  PROVEEDORES:       'PROVEEDORES',
  OPERADOR:          'OPERADOR',
  CARPETA:           'CARPETA',
  PERSONAS:          'PERSONAS',
  ALL_MODULES:       'ALL_MODULES',
} as const;

export type ModuleKey = typeof MODULE[keyof typeof MODULE];

export const ACTION = {
  READ:   'READ',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
} as const;

export type ActionKey = typeof ACTION[keyof typeof ACTION];
