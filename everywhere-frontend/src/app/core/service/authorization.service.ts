import { Injectable, inject } from '@angular/core';
import { AuthServiceService } from './auth/auth.service';
import { AuthResponse } from '../../shared/models/auth/auth-response-model';
import {
  hasPermission,
  isAdminPermissions,
  getAccessibleModules,
  MODULE,
  ModuleKey,
  ActionKey
} from '../../shared/models/role.model';

export interface CurrentUser {
  id: number;
  name: string;
  role: string;
  permissions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {
  private authService = inject(AuthServiceService);

  // ----------------------------------------------------------------
  //  Datos del usuario actual
  // ----------------------------------------------------------------

  getCurrentUser(): CurrentUser | null {
    const authData = this.authService.getUser();
    if (!authData) return null;

    return {
      id:          authData.id,
      name:        authData.name,
      role:        authData.role,
      permissions: authData.permissions ?? []
    };
  }

  /**
   * Permisos del usuario en formato plano: ["CLIENTES:READ", ...]
   */
  getPermissions(): string[] {
    return this.authService.getPermissions();
  }

  // ----------------------------------------------------------------
  //  Verificación de permisos (nuevo formato MODULO:ACCION)
  // ----------------------------------------------------------------

  /**
   * Verifica si el usuario puede realizar una acción sobre un módulo.
   *
   * @param module  Nombre del módulo — usa MODULE.xxx para evitar typos
   * @param action  "READ" | "CREATE" | "UPDATE" | "DELETE"
   *
   * @example
   *   authorizationService.canAccess(MODULE.CLIENTES, 'READ')
   *   authorizationService.canAccess('COTIZACIONES', 'DELETE')
   */
  canAccess(module: string, action: ActionKey): boolean {
    const permissions = this.getPermissions();
    return hasPermission(permissions, module, action);
  }

  /**
   * Alias de canAccess para compatibilidad con código existente
   */
  hasPermission(module: string, action: ActionKey = 'READ'): boolean {
    return this.canAccess(module, action);
  }

  /**
   * Verifica si el usuario tiene acceso de lectura a un módulo
   */
  hasModuleAccess(module: string): boolean {
    return this.canAccess(module, 'READ');
  }

  /**
   * Obtiene todos los módulos a los que el usuario tiene acceso de lectura
   */
  getAccessibleModules(): string[] {
    const permissions = this.getPermissions();

    // Si tiene ALL_MODULES, tiene acceso a todos los módulos conocidos
    if (permissions.some(p => p.startsWith('ALL_MODULES:'))) {
      return Object.values(MODULE);
    }

    return getAccessibleModules(permissions);
  }

  // ----------------------------------------------------------------
  //  Checks de roles especiales
  // ----------------------------------------------------------------

  /**
   * Admin = tiene permiso ALL_MODULES:DELETE (acceso total)
   */
  isAdmin(): boolean {
    return isAdminPermissions(this.getPermissions());
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  clearUser(): void {
    this.authService.logout();
  }

  // ----------------------------------------------------------------
  //  Menú dinámico filtrado por permisos del usuario
  // ----------------------------------------------------------------

  getFilteredMenuItems(): MenuItemConfig[] {
    return MENU_ITEMS.filter(item => {
      if (item.children) {
        const accessibleChildren = item.children.filter(child =>
          !child.requiredModule || this.hasModuleAccess(child.requiredModule)
        );
        return accessibleChildren.length > 0;
      }
      return !item.requiredModule || this.hasModuleAccess(item.requiredModule);
    }).map(item => ({
      ...item,
      children: item.children
        ? item.children.filter(child =>
            !child.requiredModule || this.hasModuleAccess(child.requiredModule)
          )
        : undefined
    }));
  }
}

// ----------------------------------------------------------------
//  Configuración del menú
// ----------------------------------------------------------------

export interface MenuItemConfig {
  id: string;
  label: string;
  route?: string;
  icon?: string;
  requiredModule?: string;   // Módulo requerido para ver el item
  requiredAction?: ActionKey; // Acción requerida (por defecto READ)
  children?: MenuItemConfig[];
}

export const MENU_ITEMS: MenuItemConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    route: '/dashboard',
    icon: 'dashboard'
    // Sin requiredModule → siempre visible para usuarios autenticados
  },
  {
    id: 'cotizaciones',
    label: 'Cotizaciones',
    route: '/cotizaciones',
    icon: 'quote',
    requiredModule: MODULE.COTIZACIONES
  },
  {
    id: 'personas',
    label: 'Clientes',
    route: '/personas',
    icon: 'people',
    requiredModule: MODULE.CLIENTES
  },
  {
    id: 'viajeros',
    label: 'Viajeros',
    route: '/viajero',
    icon: 'flight',
    requiredModule: MODULE.VIAJEROS
  },
  {
    id: 'viajeros-frecuentes',
    label: 'Viajeros Frecuentes',
    route: '/viajero-frecuente',
    icon: 'flight_takeoff',
    requiredModule: MODULE.VIAJEROS_FREC
  },
  {
    id: 'liquidaciones',
    label: 'Liquidaciones',
    route: '/liquidaciones',
    icon: 'payment',
    requiredModule: MODULE.LIQUIDACIONES
  },
  {
    id: 'productos',
    label: 'Productos',
    route: '/productos',
    icon: 'inventory',
    requiredModule: MODULE.PRODUCTOS
  },
  {
    id: 'proveedores',
    label: 'Proveedores',
    route: '/proveedor',
    icon: 'business',
    requiredModule: MODULE.PROVEEDORES
  },
  {
    id: 'operadores',
    label: 'Operadores',
    route: '/operadores',
    icon: 'support_agent',
    requiredModule: MODULE.OPERADOR
  },
  {
    id: 'carpetas',
    label: 'Carpetas',
    route: '/carpetas',
    icon: 'folder',
    requiredModule: MODULE.CARPETA
  },
  {
    id: 'administracion',
    label: 'Administración',
    icon: 'admin_panel_settings',
    requiredModule: MODULE.ALL_MODULES,  // Solo visible para admins
    children: [
      {
        id: 'sucursales',
        label: 'Sucursales',
        route: '/sucursales',
        icon: 'business',
        requiredModule: MODULE.ALL_MODULES
      },
      {
        id: 'roles',
        label: 'Roles y Permisos',
        route: '/roles',
        icon: 'security',
        requiredModule: MODULE.ALL_MODULES
      }
    ]
  }
];