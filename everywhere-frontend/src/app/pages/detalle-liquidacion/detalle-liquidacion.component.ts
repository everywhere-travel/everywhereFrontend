import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

// Services
import { LiquidacionService } from '../../core/service/Liquidacion/liquidacion.service';
import { LoadingService } from '../../core/service/loading.service';

// Models
import { LiquidacionConDetallesResponse } from '../../shared/models/Liquidacion/liquidacion.model';
import { DetalleLiquidacionResponse } from '../../shared/models/Liquidacion/detalleLiquidacion.model';

// Components
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-detalle-liquidacion',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './detalle-liquidacion.component.html',
  styleUrls: ['./detalle-liquidacion.component.css']
})
export class DetalleLiquidacionComponent implements OnInit, OnDestroy {

  // Services
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private liquidacionService = inject(LiquidacionService);
  private loadingService = inject(LoadingService);

  // Data
  liquidacion: LiquidacionConDetallesResponse | null = null;
  liquidacionId: number | null = null;

  // UI State
  isLoading = false;
  error: string | null = null;
  sidebarCollapsed = false;

  // Sidebar menu items
  sidebarMenuItems = [
    { id: '1', title: 'Dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard', route: '/dashboard', active: false },
    { id: '2', title: 'Personas', icon: 'fas fa-users', label: 'Personas', route: '/personas', active: false },
    { id: '3', title: 'Viajeros', icon: 'fas fa-user-tie', label: 'Viajeros', route: '/viajero', active: false },
    { id: '4', title: 'Cotizaciones', icon: 'fas fa-quote-right', label: 'Cotizaciones', route: '/cotizaciones', active: false },
    { id: '5', title: 'Liquidaciones', icon: 'fas fa-credit-card', label: 'Liquidaciones', route: '/liquidaciones', active: true },
    { id: '6', title: 'Documentos', icon: 'fas fa-file-invoice', label: 'Documentos', route: '/documentos', active: false },
    { id: '7', title: 'Productos', icon: 'fas fa-box', label: 'Productos', route: '/productos', active: false },
    { id: '8', title: 'Proveedores', icon: 'fas fa-truck', label: 'Proveedores', route: '/proveedor', active: false },
    { id: '9', title: 'Operadores', icon: 'fas fa-headset', label: 'Operadores', route: '/operadores', active: false },
    { id: '10', title: 'Estadísticas', icon: 'fas fa-chart-bar', label: 'Estadísticas', route: '/estadistica', active: false }
  ];

  private subscriptions = new Subscription();

  ngOnInit(): void {
    this.loadLiquidacionFromRoute();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadLiquidacionFromRoute(): void {
    // Obtener el ID de la ruta
    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam || isNaN(Number(idParam))) {
      this.error = 'ID de liquidación inválido';
      return;
    }

    this.liquidacionId = Number(idParam);
    this.loadLiquidacion(this.liquidacionId);
  }

  private loadLiquidacion(id: number): void {
    this.isLoading = true;
    this.error = null;

    // Mostrar loading global
    this.loadingService.setLoading(true);

    const subscription = this.liquidacionService.getLiquidacionById(id)
      .pipe(
        tap(liquidacion => {
          if (!liquidacion) {
            throw new Error('Liquidación no encontrada');
          }
        }),
        catchError(error => {
          console.error('Error al cargar liquidación:', error);
          this.error = 'Error al cargar la liquidación. Por favor, intente nuevamente.';
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
          this.loadingService.setLoading(false);
        })
      )
      .subscribe(liquidacion => {
        this.liquidacion = liquidacion;
      });

    this.subscriptions.add(subscription);
  }

  // Navigation methods
  volverALiquidaciones(): void {
    this.router.navigate(['/liquidaciones']);
  }

  irAEditarLiquidacion(): void {
    if (this.liquidacionId) {
      this.router.navigate(['/liquidaciones'], {
        queryParams: { editId: this.liquidacionId }
      });
    }
  }

  // Sidebar methods
  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onSidebarItemClick(item: any): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  // Utility methods
  trackByDetalle(index: number, detalle: DetalleLiquidacionResponse): number {
    return detalle.id;
  }

  // Calcular totales para la vista
  get totalCostoTickets(): number {
    if (!this.liquidacion?.detalles) return 0;
    return this.liquidacion.detalles.reduce((sum, detalle) =>
      sum + (detalle.costoTicket || 0), 0);
  }

  get totalCargoServicio(): number {
    if (!this.liquidacion?.detalles) return 0;
    return this.liquidacion.detalles.reduce((sum, detalle) =>
      sum + (detalle.cargoServicio || 0), 0);
  }

  get totalValorVenta(): number {
    if (!this.liquidacion?.detalles) return 0;
    return this.liquidacion.detalles.reduce((sum, detalle) =>
      sum + (detalle.valorVenta || 0), 0);
  }

  get totalMontoDescuento(): number {
    if (!this.liquidacion?.detalles) return 0;
    return this.liquidacion.detalles.reduce((sum, detalle) =>
      sum + (detalle.montoDescuento || 0), 0);
  }

  get totalPagoPaxUSD(): number {
    if (!this.liquidacion?.detalles) return 0;
    return this.liquidacion.detalles.reduce((sum, detalle) =>
      sum + (detalle.pagoPaxUSD || 0), 0);
  }

  get totalPagoPaxPEN(): number {
    if (!this.liquidacion?.detalles) return 0;
    return this.liquidacion.detalles.reduce((sum, detalle) =>
      sum + (detalle.pagoPaxPEN || 0), 0);
  }

  // Refresh data
  recargarDatos(): void {
    if (this.liquidacionId) {
      this.loadLiquidacion(this.liquidacionId);
    }
  }
}
