import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarMenuItem } from '../../../shared/components/sidebar/sidebar.component';
import { AuthServiceService } from '../auth/auth.service';

//Extended sidebar menu item with permission control
export interface ExtendedSidebarMenuItem extends SidebarMenuItem {
    moduleKey?: string;
    children?: ExtendedSidebarMenuItem[];
}


@Injectable({
    providedIn: 'root'
})
export class MenuConfigService {
    private readonly ALL_MENU_ITEMS: ExtendedSidebarMenuItem[] = [
        {
            id: 'dashboard',
            title: 'Dashboard',
            icon: 'fas fa-chart-pie',
            route: '/dashboard'
        },
        {
            id: 'profile',
            title: 'Perfil',
            icon: 'fas fa-user-circle',
            route: '/profile'
        },
        {
            id: 'clientes',
            title: 'Clientes',
            icon: 'fas fa-address-book',
            route: '/personas',
            moduleKey: 'CLIENTES'
        },
        {
            id: 'carpetas',
            title: 'Carpetas',
            icon: 'fas fa-folder',
            route: '/carpetas',
            moduleKey: 'CARPETA'
        },
        {
            id: 'cotizaciones',
            title: 'Cotizaciones',
            icon: 'fas fa-file-invoice',
            route: '/cotizaciones',
            moduleKey: 'COTIZACIONES'
        },
        {
            id: 'liquidaciones',
            title: 'Liquidaciones',
            icon: 'fas fa-credit-card',
            route: '/liquidaciones',
            moduleKey: 'LIQUIDACIONES'
        },
        {
            id: 'generacion-documentos',
            title: 'Generacion de Documentos',
            icon: 'fas fa-file-pdf',
            children: [
                {
                    id: 'documentos-cobranza',
                    title: 'Documentos de Cobranza',
                    icon: 'fas fa-file-contract',
                    route: '/documentos-cobranza',
                    moduleKey: 'DOCUMENTOS_COBRANZA'
                },
                {
                    id: 'recibos',
                    title: 'Recibos',
                    icon: 'fas fa-file-alt',
                    route: '/recibos',
                    moduleKey: 'RECIBOS'
                },
            ]
        },
        {
            id: 'categorias',
            title: 'Gestion de Categorias',
            icon: 'fas fa-table-columns',
            children: [
                {
                    id: 'categorias-persona',
                    title: 'Categorias de Clientes',
                    icon: 'fas fa-users',
                    route: '/categorias-persona',
                    moduleKey: 'CATEGORIA_CLIENTE'
                },
                {
                    id: 'documentos',
                    title: 'Documentos de clientes',
                    icon: 'fas fa-file-alt',
                    route: '/documentos',
                    moduleKey: 'DOCUMENTO_CLIENTE'
                },
                {
                    id: 'categorias-producto',
                    title: 'Categorias de Producto',
                    icon: 'fas fa-list',
                    route: '/categorias',
                    moduleKey: 'CATEGORIA_PRODUCTO'
                },
                {
                    id: 'estado-cotizacion',
                    title: 'Estado de Cotización',
                    icon: 'fas fa-clipboard-check',
                    route: '/estado-cotizacion',
                    moduleKey: 'ESTADO_COTIZACION'
                },
                {
                    id: 'forma-pago',
                    title: 'Forma de Pago',
                    icon: 'fas fa-credit-card',
                    route: '/formas-pago',
                    moduleKey: 'FORMA-PAGO'
                }
            ]
        },
        {
            id: 'recursos',
            title: 'Recursos',
            icon: 'fas fa-box',
            children: [
                {
                    id: 'productos',
                    title: 'Productos',
                    icon: 'fas fa-cube',
                    route: '/productos',
                    moduleKey: 'PRODUCTOS'
                },
                {
                    id: 'proveedores',
                    title: 'Proveedores',
                    icon: 'fas fa-truck',
                    route: '/proveedores',
                    moduleKey: 'PROVEEDORES'
                },
                {
                    id: 'operadores',
                    title: 'Operadores',
                    icon: 'fas fa-headset',
                    route: '/operadores',
                    moduleKey: 'OPERADOR'
                }
            ]
        },
        {
            id: 'usuarios-root',
            title: 'Usuarios y Roles',
            icon: 'fas fa-users-cog',
            route: '/usuarios',
            moduleKey: 'USUARIOS'
        },
        {
            id: 'organización',
            title: 'Organización',
            icon: 'fas fa-sitemap',
            children: [
                {
                    id: 'sucursales',
                    title: 'Sucursales',
                    icon: 'fas fa-building',
                    route: '/sucursales',
                    moduleKey: 'SUCURSALES'
                }
            ]
        }
    ];

    constructor(
        private authService: AuthServiceService,
        private router: Router
    ) { }

    /**
     * Get menu items filtered by user permissions and with active route marked
     *
     * @param currentRoute - Optional current route to mark as active
     * @returns Filtered menu items based on user permissions
     */
    getMenuItems(currentRoute?: string): ExtendedSidebarMenuItem[] {
        const userPermissions = this.getUserPermissions();
        const filteredItems = this.filterByPermissions(userPermissions);

        if (currentRoute) {
            return this.markActiveRoute(filteredItems, currentRoute);
        }

        return filteredItems;
    }

    /**
     * Get menu items with automatic active route detection
     *
     * @returns Filtered menu items with current route marked as active
     */
    getMenuItemsWithActiveRoute(): ExtendedSidebarMenuItem[] {
        const currentRoute = this.router.url;
        return this.getMenuItems(currentRoute);
    }

    /**
     * Get all menu items without filtering (useful for admin views)
     *
     * @returns All menu items
     */
    getAllMenuItems(): ExtendedSidebarMenuItem[] {
        return this.deepClone(this.ALL_MENU_ITEMS);
    }

    /**
     * Get user permissions from auth service
     *
     * @returns User permissions object
     */
    private getUserPermissions(): string[] {
        return this.authService.getUser()?.permissions ?? [];
    }

    /**
     * Filter menu items based on user permissions
     * If user has ALL_MODULES permission, returns all items
     * Otherwise, filters items based on moduleKey permissions
     *
     * @param userPermissions - User permissions object
     * @returns Filtered menu items
     */
    private filterByPermissions(userPermissions: string[]): ExtendedSidebarMenuItem[] {
        // Si tiene ALL_MODULES, mostrar todos los items
        if (userPermissions.some(p => p.startsWith('ALL_MODULES:'))) {
            return this.deepClone(this.ALL_MENU_ITEMS);
        }

        // Extraer los módulos accesibles del array de permisos
        const accessibleModules = new Set(userPermissions.map(p => p.split(':')[0]));

        // Bootstrapping para roles de gerencia/sistemas
        const userRole = this.authService.getUser()?.role?.toUpperCase();
        if (userRole === 'GERENTE' || userRole === 'SISTEMAS' || userRole === 'ADMIN' || userRole === 'ADMINISTRAR' || userRole === 'ROLE_ADMIN') {
            accessibleModules.add('USUARIOS');
            accessibleModules.add('ROLES');
        }

        return this.filterMenuItems(this.ALL_MENU_ITEMS, accessibleModules);
    }

    /**
     * Recursively filter menu items and their children based on permissions
     *
     * Rules:
     * - Dashboard is always visible
     * - Items without moduleKey are visible if they have visible children
     * - Items with moduleKey are visible only if user has that permission
     *
     * @param items - Menu items to filter
     * @param userPermissions - User permissions
     * @returns Filtered menu items
     */
    private filterMenuItems(
        items: ExtendedSidebarMenuItem[],
        accessibleModules: Set<string>
    ): ExtendedSidebarMenuItem[] {
        return items
            .filter(item => this.shouldShowItem(item, accessibleModules))
            .map(item => this.filterItemChildren(item, accessibleModules))
            .filter(item => this.hasVisibleContent(item));
    }

    /**
     * Determine if an item should be shown based on permissions
     *
     * @param item - Menu item to check
     * @param userPermissions - User permissions
     * @returns True if item should be shown
     */
    private shouldShowItem(
        item: ExtendedSidebarMenuItem,
        accessibleModules: Set<string>
    ): boolean {
        if (item.id === 'dashboard' || item.id === 'profile') return true;
        if (!item.moduleKey) return true;
        return accessibleModules.has(item.moduleKey);
    }

    // Eliminado: hasPermission ya no se usa como método separado, se integró en shouldShowItem

    /**
     * Filter children of a menu item
     *
     * @param item - Menu item
     * @param userPermissions - User permissions
     * @returns Menu item with filtered children
     */
    private filterItemChildren(
        item: ExtendedSidebarMenuItem,
        accessibleModules: Set<string>
    ): ExtendedSidebarMenuItem {
        if (!item.children || item.children.length === 0) {
            return { ...item };
        }
        return {
            ...item,
            children: this.filterMenuItems(item.children, accessibleModules)
        };
    }

    /**
     * Check if an item has visible content
     * Items with children are only visible if they have at least one visible child
     *
     * @param item - Menu item to check
     * @returns True if item has visible content
     */
    private hasVisibleContent(item: ExtendedSidebarMenuItem): boolean {
        if (!item.children) {
            return true;
        }

        return item.children.length > 0;
    }

    /**
     * Mark the active route in menu items
     * Also marks parent items as active if any of their children are active
     *
     * @param items - Menu items
     * @param currentRoute - Current route
     * @returns Menu items with active route marked
     */
    private markActiveRoute(
        items: ExtendedSidebarMenuItem[],
        currentRoute: string
    ): ExtendedSidebarMenuItem[] {
        return items.map(item => {
            const isActive = this.isRouteActive(item, currentRoute);
            const markedItem = { ...item, active: isActive };

            if (item.children) {
                markedItem.children = this.markActiveRoute(item.children, currentRoute);
                // Mark parent as active if any child is active
                const hasActiveChild = markedItem.children.some(child => child.active);
                if (hasActiveChild) {
                    markedItem.active = true;
                }
            }

            return markedItem;
        });
    }

    /**
     * Check if a menu item's route matches the current route
     *
     * @param item - Menu item
     * @param currentRoute - Current route
     * @returns True if routes match
     */
    private isRouteActive(item: ExtendedSidebarMenuItem, currentRoute: string): boolean {
        if (!item.route) {
            return false;
        }

        // Exact match or starts with the route (for child routes)
        return currentRoute === item.route || currentRoute.startsWith(item.route + '/');
    }

    /**
     * Deep clone menu items to avoid mutations
     *
     * @param items - Items to clone
     * @returns Cloned items
     */
    private deepClone(items: ExtendedSidebarMenuItem[]): ExtendedSidebarMenuItem[] {
        return JSON.parse(JSON.stringify(items));
    }
}
