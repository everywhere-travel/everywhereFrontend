import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthServiceService } from '../../core/service/auth/auth.service';
import { Exchange } from '../../shared/models/Exchange/exchange.model';
import { ExchangeService } from '../../core/service/exchange/exchange.service';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';
import { PersonaService } from '../../core/service/persona/persona.service';
import { CotizacionService } from '../../core/service/Cotizacion/cotizacion.service';
import { LiquidacionService } from '../../core/service/Liquidacion/liquidacion.service';
import {
  DashboardHeaderComponent,
  WelcomeBannerData,
  DashboardHeaderData
} from '../../shared/components/ui';

export interface DashboardActionItem {
  title: string;
  description: string;
  route: string;
  icon: string;
  colorTheme: 'red' | 'orange' | 'blue' | 'green';
  moduleKey?: string;
  actionText?: string;
}

export interface DashboardCategory {
  categoryName: string;
  items: DashboardActionItem[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    DashboardHeaderComponent,
    SidebarComponent
  ]
})
export class DashboardComponent implements OnInit {

  isLoading = false;
  statsLoading = false;
  sidebarCollapsed = false;
  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];
  userName = 'Administrador';
  showGerencialSection = false;
  showApiConfigModal = false;
  savingApiConfig = false;
  apiConfigForm = {
    url: 'https://apiperu.dev/api/tipo_de_cambio',
    token: ''
  };

  exchangeData: Exchange | null = null;

  stats = {
    totalClientes: 0,
    totalNaturales: 0,
    totalJuridicas: 0,
    totalCotizaciones: 0,
    totalLiquidaciones: 0
  };

  // Datos para componentes header
  headerData: DashboardHeaderData = {
    logoSrc: '/logo.png',
    title: {
      main: 'Everywhere',
      secondary: 'Travel'
    },
    subtitle: 'Panel de Administración',
    userData: {
      name: '',
      role: ''
    },
    isLoading: false
  };

  welcomeData: WelcomeBannerData = {
    title: '',
    subtitle: ''
  };

  // Categorías al estilo del nuevo diseño POS/Gerencial
  allCategories: DashboardCategory[] = [
    {
      categoryName: 'Operaciones de Viaje & Facturación',
      items: [
        { title: 'Nueva Cotización', description: 'Cotizaciones de viajes y grupos', icon: 'fas fa-file-invoice-dollar', route: '/quotes', colorTheme: 'red', moduleKey: 'COTIZACIONES' },
        { title: 'Procesar Liquidación', description: 'Liquidaciones financieras', icon: 'fas fa-calculator', route: '/settlements', colorTheme: 'red', moduleKey: 'LIQUIDACIONES' },
        { title: 'Carpetas de Viaje', description: 'Expedientes y organización', icon: 'fas fa-folder-open', route: '/folders', colorTheme: 'red', moduleKey: 'CARPETA' }
      ]
    },
    {
      categoryName: 'Directorio y Clientes',
      items: [
        { title: 'Ver lista de clientes', description: 'Directorio de personas naturales y jurídicas', icon: 'fas fa-users', route: '/people', colorTheme: 'orange', moduleKey: 'CLIENTES' },
        { title: 'Búsqueda de documentos', description: 'Tipos y documentos de clientes', icon: 'fas fa-id-card', route: '/documents', colorTheme: 'orange', moduleKey: 'DOCUMENTO_CLIENTE' },
        { title: 'Categorías de Clientes', description: 'Clasificación de clientes', icon: 'fas fa-tags', route: '/people-categories', colorTheme: 'orange', moduleKey: 'CATEGORIA_CLIENTE' }
      ]
    },
    {
      categoryName: 'Productos, Servicios & Recursos',
      items: [
        { title: 'Ver lista de productos', description: 'Catálogo turístico y paquetes', icon: 'fas fa-cube', route: '/products', colorTheme: 'orange', moduleKey: 'PRODUCTOS' },
        { title: 'Red de Proveedores', description: 'Proveedores asociados', icon: 'fas fa-truck', route: '/suppliers', colorTheme: 'orange', moduleKey: 'PROVEEDORES' },
        { title: 'Operadores Turísticos', description: 'Operadores externos', icon: 'fas fa-headset', route: '/operators', colorTheme: 'orange', moduleKey: 'OPERADOR' }
      ]
    },
    {
      categoryName: 'Documentate y Contabilidad',
      items: [
        { title: 'Documentos de Cobranza', description: 'Generados desde cotizaciones', icon: 'fas fa-file-contract', route: '/collection-documents', colorTheme: 'blue', moduleKey: 'DOCUMENTOS_COBRANZA' },
        { title: 'Emisión de Recibos', description: 'Comprobantes y recibos de caja', icon: 'fas fa-file-alt', route: '/receipts', colorTheme: 'blue', moduleKey: 'RECIBOS' },
        { title: 'Asientos Contables', description: 'Historial de movimientos y caja', icon: 'fas fa-book-open', route: '/accounting-entries', colorTheme: 'blue', moduleKey: 'ASIENTOS_CONTABLES' }
      ]
    },
    {
      categoryName: 'Configuración y Sistema',
      items: [
        { title: 'Gestión de Usuarios y Roles', description: 'Seguridad y permisos del sistema', icon: 'fas fa-users-cog', route: '/users', colorTheme: 'green', moduleKey: 'USUARIOS' },
        { title: 'Sucursales y Empresa', description: 'Estructura organizacional', icon: 'fas fa-building', route: '/branches', colorTheme: 'green', moduleKey: 'SUCURSALES' },
        { title: 'Estados de Cotización', description: 'Flujos de estado disponibles', icon: 'fas fa-clipboard-check', route: '/quote-status', colorTheme: 'green', moduleKey: 'ESTADO_COTIZACION' },
        { title: 'Formas de Pago', description: 'Medios de cobro y pago', icon: 'fas fa-credit-card', route: '/payment-methods', colorTheme: 'green', moduleKey: 'FORMA-PAGO' },
        { title: 'Categorías de Producto', description: 'Clasificación del catálogo', icon: 'fas fa-list', route: '/categories', colorTheme: 'green', moduleKey: 'CATEGORIA_PRODUCTO' }
      ]
    }
  ];

  filteredCategories: DashboardCategory[] = [];

  constructor(
    private authService: AuthServiceService,
    private router: Router,
    private exchangeService: ExchangeService,
    private menuConfigService: MenuConfigService,
    private personaService: PersonaService,
    private cotizacionService: CotizacionService,
    private liquidacionService: LiquidacionService
  ) { }

  ngOnInit(): void {
    this.sidebarMenuItems = this.menuConfigService.getMenuItems('/dashboard');
    this.initializeData();
    this.loadGerencialStats();
  }

  private initializeData(): void {
    const authData = this.authService.getUser();
    this.userName = authData?.name || 'Administrador';
    const userRole = this.getRoleDisplayName(authData?.role || 'ADMIN');

    // Header
    this.headerData.userData = { name: this.userName, role: userRole };

    // Welcome banner text fallback
    this.welcomeData.title = `¡Hola ${this.userName}!`;
    this.welcomeData.subtitle = `Hoy es ${this.getCurrentTime()}`;

    // Permisos y filtrado
    const userPermissions = authData?.permissions ?? [];
    const hasAllModules = userPermissions.some((p: string) => p.startsWith('ALL_MODULES:'));

    if (hasAllModules) {
      this.filteredCategories = JSON.parse(JSON.stringify(this.allCategories));
      // this.showGerencialSection = true; // COMENTADO Y OCULTO TEMPORALMENTE
      this.showGerencialSection = false;
    } else {
      const accessibleModules = new Set(
        userPermissions.map((p: string) => p.split(':')[0])
      );

      // Bootstrapping de roles gerenciales / sistemas / admin
      const roleUpper = (authData?.role || '').toUpperCase();
      if (['GERENTE', 'SISTEMAS', 'ADMIN', 'ROLE_ADMIN', 'ADMINISTRATOR'].some(r => roleUpper.includes(r))) {
        accessibleModules.add('USUARIOS');
        accessibleModules.add('ROLES');
      }
      
      // OCULTADO TEMPORALMENTE PARA EVITAR ALERTAS DE PERMISOS EN MÓDULOS COMO LIQUIDACIONES
      this.showGerencialSection = false;

      this.filteredCategories = this.allCategories
        .map(cat => ({
          categoryName: cat.categoryName,
          items: cat.items.filter(item => !item.moduleKey || accessibleModules.has(item.moduleKey))
        }))
        .filter(cat => cat.items.length > 0);
    }
  }

  loadGerencialStats(): void {
    // FUNCIONES Y CONSULTAS COMENTADAS TEMPORALMENTE PARA EVITAR "ACCESO DENEGADO"
    /*
    if (!this.showGerencialSection) return;
    this.statsLoading = true;

    // Cargar Estadísticas de Clientes
    this.personaService.getPersonaStats().subscribe({
      next: (res) => {
        if (res) {
          this.stats.totalNaturales = res.totalNaturales || 0;
          this.stats.totalJuridicas = res.totalJuridicas || 0;
          this.stats.totalClientes = (res.totalNaturales || 0) + (res.totalJuridicas || 0);
        }
      },
      error: (err) => console.warn('No se pudieron obtener estadísticas de clientes', err)
    });

    // Cargar Total de Cotizaciones Emitidas
    this.cotizacionService.getCotizacionesPage(0, 1).subscribe({
      next: (res) => {
        if (res && typeof res.totalElements === 'number') {
          this.stats.totalCotizaciones = res.totalElements;
        }
      },
      error: (err) => console.warn('No se pudieron obtener estadísticas de cotizaciones', err)
    });

    // Cargar Total de Liquidaciones
    this.liquidacionService.getLiquidacionesPage(0, 1).subscribe({
      next: (res) => {
        if (res && typeof res.totalElements === 'number') {
          this.stats.totalLiquidaciones = res.totalElements;
        }
        this.statsLoading = false;
      },
      error: (err) => {
        console.warn('No se pudieron obtener estadísticas de liquidaciones', err);
        this.statsLoading = false;
      }
    });
    */
  }

  refreshGerencial(): void {
    // this.loadGerencialStats();
  } 

  private updateWelcomeSubtitle(): void {
    this.welcomeData.subtitle = this.getCurrentTime();
  }

  formatKpi(val: number): string {
    if (val >= 1000) {
      return (val / 1000).toFixed(1) + 'K';
    }
    return val.toString();
  }

  // Métodos de navegación y sidebar
  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onSidebarItemClick(item: ExtendedSidebarMenuItem): void {
    if (item.route && !item.children) {
      this.router.navigate([item.route]);
    }
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  // Métodos para el header
  getCurrentTime(): string {
    return new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  getUserInitials(): string {
    const user = this.authService.getUser();
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return 'AD';
  }

  private getRoleDisplayName(role: string): string {
    const roleMap: { [key: string]: string } = {
      'ROLE_ADMIN': 'Administrador',
      'ROLE_ORGANIZER': 'Organizador',
      'ROLE_PARTICIPANT': 'Participante',
      'ADMIN': 'Administrador',
      'USER': 'Usuario'
    };
    return roleMap[role] || 'Usuario';
  }

  refreshData(): void {
    this.headerData.isLoading = true;
    this.isLoading = true;

    setTimeout(() => {
      this.initializeData();
      this.loadGerencialStats();
      this.headerData.isLoading = false;
      this.isLoading = false;
    }, 1000);
  }

  onHeaderRefresh(): void {
    this.refreshData();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
