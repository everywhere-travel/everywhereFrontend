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
    { title: 'Clientes', description: 'Gestión de clientes y proveedores', icon: 'fas fa-users', route: '/personas', iconType: 'clientes', action: { text: 'Ver Clientes' }, moduleKey: 'CLIENTES' },
    { title: 'Cotizaciones', description: 'Gestiona las cotizaciones de viajes', icon: 'fas fa-file-invoice-dollar', route: '/cotizaciones', iconType: 'cotizaciones', action: { text: 'Gestionar' }, moduleKey: 'COTIZACIONES' },
    { title: 'Liquidaciones', description: 'Administra las liquidaciones', icon: 'fas fa-calculator', route: '/liquidaciones', iconType: 'liquidaciones', action: { text: 'Procesar' }, moduleKey: 'LIQUIDACIONES' },
    { title: 'Documentos de Cobranza', description: 'Gestiona aquellos generados desde cotizaciones', icon: 'fas fa-file-contract', route: '/documentos-cobranza', iconType: 'documentos', action: { text: 'Gestionar' }, moduleKey: 'DOCUMENTOS_COBRANZA' },
    { title: 'Categorias', description: 'Gestiona las categorías de clientes', icon: 'fas fa-file-invoice-dollar', route: '/categorias-persona', iconType: 'categorias-persona', action: { text: 'Gestionar' }, moduleKey: 'CATEGORIAS_CLIENTES' },
    { title: 'Recursos', description: 'Gestión de recursos', icon: 'fas fa-box', route: '/productos', iconType: 'recursos', action: { text: 'Administrar' }, moduleKey: 'PRODUCTOS' },
    { title: 'Organización', description: 'Gestión de organización', icon: 'fas fa-file-alt', route: '/sucursales', iconType: 'sucursales', action: { text: 'Administrar' }, moduleKey: 'SUCURSALES' }
  ];

  constructor(
    private authService: AuthServiceService,
    private router: Router,
    private exchangeService: ExchangeService
  ) { }

  ngOnInit(): void {
    this.initializeData();
    this.updateExchangeRate();
  }

  private initializeData(): void {
    const authData = this.authService.getUser();
    const userName = authData?.name || 'Administrador';
    const userRole = this.getRoleDisplayName(authData?.role || 'ADMIN');
    const userPermissions = authData?.permissions || {};

    // Header
    this.headerData.userData = { name: userName, role: userRole };

    // Welcome banner
    this.welcomeData.title = `¡Bienvenido, ${userName}!`;
    this.welcomeData.subtitle = `Hoy es ${this.getCurrentTime()} - Gestiona tu negocio desde aquí`;

    // Filtrar módulos según permisos
    // Si tiene ALL_MODULES, mostrar todos los módulos, sino filtrar por permisos específicos
    if (userPermissions['ALL_MODULES']) {
      // El usuario tiene acceso a todos los módulos, no filtrar
      this.modules = this.modules;
    } else {
      // Filtrar solo los módulos para los que tiene permisos específicos
      this.modules = this.modules.filter(m => m.moduleKey && Object.keys(userPermissions).includes(m.moduleKey));
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
