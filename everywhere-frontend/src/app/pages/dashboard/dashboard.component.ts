import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthServiceService } from '../../core/service/auth/auth.service';
import { Exchange } from '../../shared/models/Exchange/exchange.model';
import { ExchangeService } from '../../core/service/exchange/exchange.service';
import {
  DashboardHeaderComponent,
  WelcomeBannerComponent,
  ModuleCardComponent,
  ModuleCardData,
  WelcomeBannerData,
  DashboardHeaderData
} from '../../shared/components/ui';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [
    RouterModule,
    CommonModule,
    DashboardHeaderComponent,
    WelcomeBannerComponent,
    ModuleCardComponent
  ]
})
export class DashboardComponent implements OnInit {

  isLoading = false;

  exchangeData: Exchange | null = null;

  // Datos para componentes
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

  modules: ModuleCardData[] = [
    { title: 'Clientes', description: 'Gestión de clientes', icon: 'fas fa-users', route: '/people', iconType: 'clientes', action: { text: 'Ver Clientes' }, moduleKey: 'CLIENTES' },
    { title: 'Carpetas', description: 'Gestión de carpetas', icon: 'fas fa-folder', route: '/folders', iconType: 'documentos', action: { text: 'Administrar' }, moduleKey: 'CARPETA' },
    { title: 'Cotizaciones', description: 'Gestiona las cotizaciones de viajes', icon: 'fas fa-file-invoice-dollar', route: '/quotes', iconType: 'cotizaciones', action: { text: 'Gestionar' }, moduleKey: 'COTIZACIONES' },
    { title: 'Liquidaciones', description: 'Administra las liquidaciones', icon: 'fas fa-calculator', route: '/settlements', iconType: 'liquidaciones', action: { text: 'Procesar' }, moduleKey: 'LIQUIDACIONES' },
    
    // Generación de Documentos
    { title: 'Documentos Cobranza', description: 'Generados desde cotizaciones', icon: 'fas fa-file-contract', route: '/collection-documents', iconType: 'documentos', action: { text: 'Gestionar' }, moduleKey: 'DOCUMENTOS_COBRANZA' },
    { title: 'Recibos', description: 'Emisión de recibos', icon: 'fas fa-file-alt', route: '/receipts', iconType: 'documentos', action: { text: 'Gestionar' }, moduleKey: 'RECIBOS' },
    { title: 'Asientos Contables', description: 'Historial de movimientos', icon: 'fas fa-book-open', route: '/accounting-entries', iconType: 'documentos', action: { text: 'Gestionar' }, moduleKey: 'ASIENTOS_CONTABLES' },
    
    // Gestión de Categorías
    { title: 'Categ. de Clientes', description: 'Clasificación de clientes', icon: 'fas fa-users', route: '/people-categories', iconType: 'categorias-persona', action: { text: 'Gestionar' }, moduleKey: 'CATEGORIA_CLIENTE' },
    { title: 'Doc. de Clientes', description: 'Tipos de documentos', icon: 'fas fa-file-alt', route: '/documents', iconType: 'documentos', action: { text: 'Gestionar' }, moduleKey: 'DOCUMENTO_CLIENTE' },
    { title: 'Categ. de Productos', description: 'Clasificación de productos', icon: 'fas fa-list', route: '/categories', iconType: 'categorias-persona', action: { text: 'Gestionar' }, moduleKey: 'CATEGORIA_PRODUCTO' },
    { title: 'Estados Cotización', description: 'Estados disponibles', icon: 'fas fa-clipboard-check', route: '/quote-status', iconType: 'cotizaciones', action: { text: 'Gestionar' }, moduleKey: 'ESTADO_COTIZACION' },
    { title: 'Formas de Pago', description: 'Medios de pago', icon: 'fas fa-credit-card', route: '/payment-methods', iconType: 'cotizaciones', action: { text: 'Gestionar' }, moduleKey: 'FORMA-PAGO' },
    
    // Recursos
    { title: 'Productos', description: 'Gestión de productos', icon: 'fas fa-cube', route: '/products', iconType: 'recursos', action: { text: 'Administrar' }, moduleKey: 'PRODUCTOS' },
    { title: 'Proveedores', description: 'Red de proveedores', icon: 'fas fa-truck', route: '/suppliers', iconType: 'recursos', action: { text: 'Administrar' }, moduleKey: 'PROVEEDORES' },
    { title: 'Operadores', description: 'Operadores turísticos', icon: 'fas fa-headset', route: '/operators', iconType: 'recursos', action: { text: 'Administrar' }, moduleKey: 'OPERADOR' },
    
    // Sistema
    { title: 'Usuarios', description: 'Gestión de accesos y roles', icon: 'fas fa-users-cog', route: '/users', iconType: 'sucursales', action: { text: 'Administrar' }, moduleKey: 'USUARIOS' },
    { title: 'Sucursales', description: 'Estructura de la empresa', icon: 'fas fa-building', route: '/branches', iconType: 'sucursales', action: { text: 'Administrar' }, moduleKey: 'SUCURSALES' }
  ];

  constructor(
    private authService: AuthServiceService,
    private router: Router,
    private exchangeService: ExchangeService
  ) { }

  ngOnInit(): void {
    this.initializeData();
    //this.updateExchangeRate();
  }

  private initializeData(): void {
    const authData = this.authService.getUser();
    const userName = authData?.name || 'Administrador';
    const userRole = this.getRoleDisplayName(authData?.role || 'ADMIN');

    // Header
    this.headerData.userData = { name: userName, role: userRole };

    // Welcome banner
    this.welcomeData.title = `¡Bienvenido, ${userName}!`;
    this.welcomeData.subtitle = `Hoy es ${this.getCurrentTime()} - Gestiona tu negocio desde aquí`;

    // Filtrar módulos según permisos del nuevo formato ["MODULO:ACCION", ...]
    const userPermissions = authData?.permissions ?? [];
    const hasAllModules = userPermissions.some((p: string) => p.startsWith('ALL_MODULES:'));

    if (hasAllModules) {
      // El usuario tiene acceso a todos los módulos, no filtrar
      this.modules = this.modules;
    } else {
      // Extraer módulos accesibles desde los permisos planos
      const accessibleModules = new Set(
        userPermissions.map((p: string) => p.split(':')[0])
      );
      this.modules = this.modules.filter(m => m.moduleKey && accessibleModules.has(m.moduleKey));
    }
  }

  private updateExchangeRate(): void {
    this.isLoading = true; // Activamos el estado de carga general
    this.exchangeService.getExchangeRates().subscribe({
      next: (data) => {
        this.exchangeData = data; // Guardamos los datos recibidos
        this.updateWelcomeSubtitle(); // Actualizamos el texto de bienvenida con los datos
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al obtener el tipo de cambio', err);
        this.exchangeData = null; // En caso de error, limpiamos los datos
        this.updateWelcomeSubtitle(); // Actualizamos el texto para mostrar un error
        this.isLoading = false;
      }
    });
  }

  private updateWelcomeSubtitle(): void {
    const today = this.getCurrentTime();
    let exchangeInfo = 'Cargando tipo de cambio...'; // Mensaje por defecto

    if (this.exchangeData) {
      // Si tenemos datos, mostramos los precios
      exchangeInfo = `Dólar: Compra S/ ${this.exchangeData.buy} | Venta S/ ${this.exchangeData.sell}`;
    } else if (!this.isLoading) {
      // Si no está cargando y no hay datos, es un error
      exchangeInfo = 'No se pudo cargar el tipo de cambio.';
    }

    this.welcomeData.subtitle = `${today}  •  ${exchangeInfo}`;
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
