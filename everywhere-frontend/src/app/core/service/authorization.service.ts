import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Role, RoleType, Permission, Module, ROLES_DEFINITION } from '../../shared/models/role.model';
import { AuthServiceService } from './auth/auth.service';
import { AuthResponse } from '../../shared/models/auth/auth-response-model';

export interface User {
  id: number;
  email: string;
  name: string;
  role: RoleType;
}

@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {
  private authService = inject(AuthServiceService);

  constructor() {}

  /**
   * Obtiene el usuario actual del servicio de autenticación
   */
  getCurrentUser(): User | null {
    const authData = this.authService.getUser();
    if (!authData) {
      return null;
    }

    return {
      id: authData.id,
      email: '', // Si necesitas email, agrégalo al AuthResponse
      name: authData.name,
      role: authData.role as RoleType
    };
  }

  /**
   * Obtiene el rol actual del usuario
   */
  getCurrentRole(): Role | null {
    const currentUser = this.getCurrentUser();
    if (!currentUser || !currentUser.role) {
      return null;
    }
    
    const roleDefinition = ROLES_DEFINITION[currentUser.role];
    return roleDefinition || null;
  }

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  hasPermission(permission: Permission): boolean {
    const role = this.getCurrentRole();
    if (!role) {
      return false;
    }
    return role.permissions.includes(permission);
  }

  /**
   * Verifica si el usuario tiene acceso a un módulo específico
   */
  hasModuleAccess(module: Module): boolean {
    const role = this.getCurrentRole();
    if (!role) {
      return false;
    }
    return role.modules.includes(module);
  }

  /**
   * Verifica si el usuario puede realizar una acción específica en un módulo
   */
  canAccess(module: Module, permission: Permission): boolean {
    return this.hasModuleAccess(module) && this.hasPermission(permission);
  }

  /**
   * Obtiene todos los módulos a los que el usuario tiene acceso
   */
  getAccessibleModules(): Module[] {
    const role = this.getCurrentRole();
    if (!role) {
      return [];
    }
    return role.modules as Module[];
  }

  /**
   * Obtiene todos los permisos del usuario
   */
  getUserPermissions(): Permission[] {
    const role = this.getCurrentRole();
    if (!role) {
      return [];
    }
    return role.permissions as Permission[];
  }

  /**
   * Verifica si el usuario es administrador
   */
  isAdmin(): boolean {
    const currentUser = this.getCurrentUser();
    return currentUser?.role === RoleType.ADMIN || currentUser?.role === RoleType.SISTEMAS;
  }

  /**
   * Verifica si el usuario tiene rol de ventas
   */
  isSalesRole(): boolean {
    const currentUser = this.getCurrentUser();
    return currentUser?.role === RoleType.VENTAS_ADMIN || currentUser?.role === RoleType.VENTAS_JUNIOR;
  }

  /**
   * Verifica si el usuario tiene rol de administración
   */
  isAdminRole(): boolean {
    const currentUser = this.getCurrentUser();
    return currentUser?.role === RoleType.ADMINISTRACION_ADMIN || currentUser?.role === RoleType.ADMINISTRACION_JUNIOR;
  }

  /**
   * Verifica si el usuario tiene rol de contabilidad
   */
  isAccountingRole(): boolean {
    const currentUser = this.getCurrentUser();
    return currentUser?.role === RoleType.CONTABILIDAD_ADMIN || currentUser?.role === RoleType.CONTABILIDAD_JUNIOR;
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  /**
   * Limpia los datos del usuario (para logout)
   */
  clearUser(): void {
    this.authService.logout();
  }

  /**
   * Obtiene una configuración de menú filtrada basada en los permisos del usuario
   */
  getFilteredMenuItems(): MenuItemConfig[] {
    const accessibleModules = this.getAccessibleModules();
    
    return MENU_ITEMS.filter(item => {
      // Si es un item principal sin módulo específico, verificar si tiene subitems accesibles
      if (item.children) {
        const accessibleChildren = item.children.filter(child => 
          !child.requiredModule || accessibleModules.includes(child.requiredModule)
        );
        return accessibleChildren.length > 0;
      }
      
      // Si es un item simple, verificar acceso al módulo
      return !item.requiredModule || accessibleModules.includes(item.requiredModule);
    }).map(item => ({
      ...item,
      children: item.children ? item.children.filter(child => 
        !child.requiredModule || accessibleModules.includes(child.requiredModule)
      ) : undefined
    }));
  }
}

// Configuración del menú con los módulos requeridos
export interface MenuItemConfig {
  id: string;
  label: string;
  route?: string;
  icon?: string;
  requiredModule?: Module;
  requiredPermission?: Permission;
  children?: MenuItemConfig[];
}

export const MENU_ITEMS: MenuItemConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    route: '/dashboard',
    icon: 'dashboard'
  },
  {
    id: 'cotizaciones',
    label: 'Cotizaciones',
    route: '/cotizaciones',
    icon: 'quote',
    requiredModule: Module.COTIZACIONES
  },
  {
    id: 'personas',
    label: 'Clientes',
    route: '/personas',
    icon: 'people',
    requiredModule: Module.PERSONAS
  },
  {
    id: 'viajeros',
    label: 'Viajeros',
    route: '/viajero',
    icon: 'flight',
    requiredModule: Module.VIAJEROS
  },
  {
    id: 'viajeros-frecuentes',
    label: 'Viajeros Frecuentes',
    route: '/viajero-frecuente',
    icon: 'flight_takeoff',
    requiredModule: Module.VIAJEROS
  },
  {
    id: 'liquidaciones',
    label: 'Liquidaciones',
    route: '/liquidaciones',
    icon: 'payment',
    requiredModule: Module.LIQUIDACIONES
  },
  {
    id: 'productos',
    label: 'Productos',
    route: '/productos',
    icon: 'inventory',
    requiredModule: Module.PRODUCTOS
  },
  {
    id: 'proveedores',
    label: 'Proveedores',
    route: '/proveedor',
    icon: 'business',
    requiredModule: Module.PROVEEDORES
  },
  {
    id: 'operadores',
    label: 'Operadores',
    route: '/operadores',
    icon: 'support_agent',
    requiredModule: Module.SISTEMA
  },
  {
    id: 'administracion',
    label: 'Administración',
    icon: 'admin_panel_settings',
    requiredModule: Module.ADMINISTRACION,
    children: [
      {
        id: 'usuarios',
        label: 'Usuarios',
        route: '/usuarios',
        icon: 'person_add',
        requiredModule: Module.USUARIOS
      },
      {
        id: 'sucursales',
        label: 'Sucursales',
        route: '/sucursales',
        icon: 'business',
        requiredModule: Module.SUCURSALES
      }
    ]
  },
  {
    id: 'contabilidad',
    label: 'Contabilidad',
    icon: 'account_balance',
    requiredModule: Module.CONTABILIDAD,
    children: [
      {
        id: 'reportes',
        label: 'Reportes',
        route: '/reportes',
        icon: 'assessment',
        requiredModule: Module.CONTABILIDAD
      },
      {
        id: 'estadisticas',
        label: 'Estadísticas',
        route: '/estadistica',
        icon: 'analytics',
        requiredModule: Module.CONTABILIDAD
      }
    ]
  }
];