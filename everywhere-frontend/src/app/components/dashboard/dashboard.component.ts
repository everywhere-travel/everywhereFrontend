import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../shared/navbar/navbar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [RouterModule, NavbarComponent]
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

  constructor() {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  // Simulación de carga de datos (puedes cambiarlo a un servicio real)
  cargarDatos(): void {
    this.isLoading = true;

    setTimeout(() => {
      this.estadisticasGenerales = {
        cotizacionesActivas: 12,
        cotizacionesCompletadas: 34,
        liquidacionesPendientes: 8,
        ventasMensual: 48200
      };

      this.ventasPorMes = [
        { mes: 'Enero', ventas: 30000 },
        { mes: 'Febrero', ventas: 45000 },
        { mes: 'Marzo', ventas: 60000 },
        { mes: 'Abril', ventas: 80000 },
        { mes: 'Mayo', ventas: 70000 }
      ];

      this.estadoCotizaciones = [
        { estado: 'Activas', cantidad: 12, porcentaje: 25 },
        { estado: 'Completadas', cantidad: 34, porcentaje: 60 },
        { estado: 'Pendientes', cantidad: 8, porcentaje: 15 }
      ];

      this.topProductos = [
        { nombre: 'Paquete Cancún', ventas: 120, ingresos: 24000 },
        { nombre: 'Tour Machu Picchu', ventas: 90, ingresos: 18000 },
        { nombre: 'Crucero Caribe', ventas: 45, ingresos: 15000 }
      ];

      this.ingresosPorMoneda = [
        { moneda: 'USD', monto: 50000 },
        { moneda: 'EUR', monto: 32000 },
        { moneda: 'PEN', monto: 120000 }
      ];

      this.quickActions = [
        {
          title: 'Nueva Cotización',
          description: 'Crear una cotización para un cliente',
          icon: '➕',
          route: '/cotizaciones/nueva',
          color: 'primary'
        },
        {
          title: 'Ver Reportes',
          description: 'Accede a los reportes detallados',
          icon: '📊',
          route: '/reportes',
          color: 'accent'
        },
        {
          title: 'Gestión de Productos',
          description: 'Administra los productos disponibles',
          icon: '🛒',
          route: '/productos',
          color: 'warning'
        }
      ];

      this.isLoading = false;
    }, 1200);
  }

  // Refrescar datos (simula actualización)
  refreshData(): void {
    this.cargarDatos();
  }

  // Formatear moneda
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
  }

  // Colores según estado
  getStatusColor(estado: string): string {
    switch (estado) {
      case 'Activas': return '#3b82f6';   // azul
      case 'Completadas': return '#10b981'; // verde
      case 'Pendientes': return '#f59e0b'; // amarillo
      default: return '#6b7280'; // gris
    }
  }
}
