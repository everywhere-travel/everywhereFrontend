import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthServiceService } from '../../core/service/auth/auth.service';
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
      iconType: 'estadisticas',
      status: { text: '5 Activos', type: 'success' },
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
    }
  ];

  constructor(
    private authService: AuthServiceService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initializeData();
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
