import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthServiceService } from '../../core/service/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [RouterModule, CommonModule]
})
export class DashboardComponent implements OnInit {

  // Estado de carga
  isLoading = false;

  // Datos principales
  estadisticasGenerales: any;

  ventasPorMes: { mes: string, ventas: number }[] = [];
  estadoCotizaciones: { estado: string, cantidad: number, porcentaje: number }[] = [];
  topProductos: { nombre: string, ventas: number, ingresos: number }[] = [];
  ingresosPorMoneda: { moneda: string, monto: number }[] = [];
  quickActions: { title: string, description: string, icon: string, route: string, color: string }[] = [];

  // Datos para las nuevas funcionalidades
  revenueSparkline: number[] = [30, 45, 35, 60, 55, 70, 65, 80, 75, 90];
  performanceData = [
    { value: 30, position: 10 },
    { value: 45, position: 20 },
    { value: 35, position: 30 },
    { value: 60, position: 40 },
    { value: 55, position: 50 },
    { value: 70, position: 60 },
    { value: 65, position: 70 },
    { value: 80, position: 80 },
    { value: 75, position: 90 }
  ];

  topDestinations = [
    { name: 'Cusco - Machu Picchu', bookings: 125, revenue: 87500, percentage: 85 },
    { name: 'Lima - City Tour', bookings: 98, revenue: 45200, percentage: 70 },
    { name: 'Arequipa - Colca', bookings: 76, revenue: 32400, percentage: 60 },
    { name: 'Iquitos - Amazonas', bookings: 54, revenue: 28900, percentage: 45 },
    { name: 'Trujillo - Huacas', bookings: 43, revenue: 19800, percentage: 35 }
  ];

  constructor(private authService: AuthServiceService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  // Métodos para el header
  getCurrentTime(): string {
    return new Date().toLocaleString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
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

  // Métodos para KPIs
  getCompletionRate(): number {
    if (!this.estadisticasGenerales) return 0;
    const total = this.estadisticasGenerales.cotizacionesActivas + this.estadisticasGenerales.cotizacionesCompletadas;
    return total > 0 ? Math.round((this.estadisticasGenerales.cotizacionesCompletadas / total) * 100) : 0;
  }

  // Simulación de carga de datos (puedes cambiarlo a un servicio real)
  cargarDatos(): void {
    this.isLoading = true;

    setTimeout(() => {
      this.estadisticasGenerales = {
        cotizacionesActivas: 89,
        cotizacionesCompletadas: 247,
        liquidacionesPendientes: 17,
        ventasMensual: 892450
      };

      this.ventasPorMes = [
        { mes: 'Enero', ventas: 685000 },
        { mes: 'Febrero', ventas: 720000 },
        { mes: 'Marzo', ventas: 892450 },
        { mes: 'Abril', ventas: 754200 },
        { mes: 'Mayo', ventas: 986300 }
      ];

      this.estadoCotizaciones = [
        { estado: 'Activas', cantidad: 89, porcentaje: 26 },
        { estado: 'Completadas', cantidad: 247, porcentaje: 74 },
        { estado: 'Pendientes', cantidad: 17, porcentaje: 5 }
      ];

      this.topProductos = [
        { nombre: 'Paquete Cusco Mágico', ventas: 156, ingresos: 487200 },
        { nombre: 'Tour Amazonia Premium', ventas: 124, ingresos: 386800 },
        { nombre: 'Lima Colonial + Moderna', ventas: 98, ingresos: 245600 },
        { nombre: 'Arequipa & Colca Canyon', ventas: 87, ingresos: 304500 },
        { nombre: 'Ica & Paracas Adventure', ventas: 76, ingresos: 228000 }
      ];

      this.ingresosPorMoneda = [
        { moneda: 'USD', monto: 547890 },
        { moneda: 'EUR', monto: 234567 },
        { moneda: 'PEN', monto: 892450 },
        { moneda: 'GBP', monto: 123456 }
      ];

      this.quickActions = [
        {
          title: 'Nueva Cotización',
          description: 'Crear cotización personalizada',
          icon: '📋',
          route: '/cotizaciones',
          color: 'primary'
        },
        {
          title: 'Ver Reportes',
          description: 'Análisis y estadísticas',
          icon: '📊',
          route: '/reportes',
          color: 'accent'
        },
        {
          title: 'Gestionar Productos',
          description: 'Catálogo de servicios',
          icon: '🎯',
          route: '/productos',
          color: 'warning'
        },
        {
          title: 'Clientes',
          description: 'Base de datos de clientes',
          icon: '👥',
          route: '/personas',
          color: 'success'
        },
        {
          title: 'Liquidaciones',
          description: 'Procesar pagos pendientes',
          icon: '�',
          route: '/liquidaciones',
          color: 'info'
        },
        {
          title: 'Estadísticas',
          description: 'Métricas avanzadas',
          icon: '📈',
          route: '/estadisticas',
          color: 'purple'
        }
      ];

      this.isLoading = false;
    }, 1500);
  }

  // Refrescar datos (simula actualización)
  refreshData(): void {
    this.cargarDatos();
  }

  // Formatear moneda
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-PE', { 
      style: 'currency', 
      currency: 'PEN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  // Colores según estado
  getStatusColor(estado: string): string {
    switch (estado) {
      case 'Activas': return 'var(--primary-color)';
      case 'Completadas': return 'var(--success-color)';
      case 'Pendientes': return 'var(--warning-color)';
      default: return 'var(--text-secondary)';
    }
  }
}
