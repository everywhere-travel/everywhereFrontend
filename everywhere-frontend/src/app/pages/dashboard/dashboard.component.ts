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

  // Estado de carga
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
    {
      title: 'Cotizaciones',
      description: 'Gestiona las cotizaciones de viajes',
      icon: 'fas fa-file-invoice-dollar',
      route: '/cotizaciones',
      iconType: 'cotizaciones',
      status: { text: '12 Activas', type: 'active' },
      action: { text: 'Gestionar' }
    },
    {
      title: 'Counters',
      description: 'Administra los contadores del sistema',
      icon: 'fas fa-tachometer-alt',
      route: '/counters',
      iconType: 'counters',
      status: { text: '5 Activos', type: 'success' },
      action: { text: 'Gestionar' }
    },
    {
      title: 'Sucursales',
      description: 'Gestiona las sucursales de la empresa',
      icon: 'fas fa-building',
      route: '/sucursales',
      iconType: 'sucursales',
      status: { text: '3 Activas', type: 'success' },
      action: { text: 'Gestionar' }
    },
    {
      title: 'Liquidaciones',
      description: 'Administra las liquidaciones',
      icon: 'fas fa-calculator',
      route: '/liquidaciones',
      iconType: 'liquidaciones',
      status: { text: '8 Pendientes', type: 'warning' },
      action: { text: 'Procesar' }
    },
    {
      title: 'Productos',
      description: 'Catálogo de productos y servicios',
      icon: 'fas fa-cube',
      route: '/productos',
      iconType: 'productos',
      status: { text: '45 Disponibles', type: 'success' },
      action: { text: 'Administrar' }
    },
    {
      title: 'Clientes',
      description: 'Gestión de clientes y proveedores',
      icon: 'fas fa-users',
      route: '/personas',
      iconType: 'clientes',
      status: { text: '234 Registrados', type: 'neutral' },
      action: { text: 'Ver Clientes' }
    },
    {
      title: 'Reportes',
      description: 'Reportes y estadísticas',
      icon: 'fas fa-chart-bar',
      route: '/reportes',
      iconType: 'reportes',
      status: { text: '56 Generados', type: 'success' },
      action: { text: 'Generar' }
    },
    {
      title: 'Gestor de Archivos',
      description: 'Explorador de carpetas y documentos',
      icon: 'fas fa-folder-open',
      route: '/carpetas',
      iconType: 'reportes',
      status: { text: 'Organiza archivos', type: 'neutral' },
      action: { text: 'Explorar' }
    },
    {
      title: 'Tipos de Documentos',
      description: 'Gestión de categorías de documentos',
      icon: 'fas fa-file-alt',
      route: '/documentos',
      iconType: 'reportes',
      status: { text: 'Configurar tipos', type: 'neutral' },
      action: { text: 'Administrar' }
    }
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
    const user = this.getCurrentUser();

    // Actualizar datos del header
    this.headerData.userData = {
      name: user.name,
      role: user.role
    };

    // Actualizar datos del welcome banner
    this.welcomeData.title = `¡Bienvenido, ${user.name}!`;
    this.welcomeData.subtitle = `Hoy es ${this.getCurrentTime()} - Gestiona tu negocio desde aquí`;
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
    return new Date().toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getUserInitials(): string {
    const user = this.authService.getUser();
    if (user?.name) {
      return user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
    }
    return 'AD';
  }

  getCurrentUser() {
    const authData = this.authService.getUser();
    return {
      name: authData?.name || 'Administrador',
      role: this.getRoleDisplayName(authData?.role || 'ADMIN')
    };
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

  // Refrescar datos (simula actualización)
  refreshData(): void {
    this.headerData.isLoading = true;
    this.isLoading = true;

    setTimeout(() => {
      this.initializeData();
      this.headerData.isLoading = false;
      this.isLoading = false;
    }, 1000);
  }

  // Manejar evento de refresh desde el header
  onHeaderRefresh(): void {
    this.refreshData();
  }

  // Cerrar sesión
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
