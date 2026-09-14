import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { CotizacionService } from '../../core/service/Cotizacion/cotizacion.service';
import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';
import { ConfirmService } from '../../core/service/confirm/confirm.service';

import { CotizacionResponse } from '../../shared/models/Cotizacion/cotizacion.model';

import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { DataTableConfig } from '../../shared/components/data-table/data-table.config';

export interface CotizacionTabla {
  id: number;
  codigoCotizacion: string;
  nombreCotizacion: string;
  cliente: string;
  clienteId: number;
  fechaEmision: string;
  fechaVencimiento: string;
  cantAdultos: number;
  cantNinos: number;
  estado: string;
  estadoId: number;
  moneda: string;
  total: number;
  cotizacionOriginal: CotizacionResponse;
}

@Component({
  selector: 'app-cotizaciones',
  standalone: true,
  templateUrl: './cotizaciones.component.html',
  styleUrls: ['./cotizaciones.component.css'],
  imports: [CommonModule, SidebarComponent, DataTableComponent],
})

export class CotizacionesComponent implements OnInit {
  private router = inject(Router);
  private cotizacionService = inject(CotizacionService);
  private confirmService = inject(ConfirmService);

  isLoading = false;

  errorMessage: string = '';
  successMessage: string = '';
  showErrorMessage: boolean = false;
  showSuccessMessage: boolean = false;


  totalServerItems = 0;


  private currentPage = 0;


  private currentPageSize = 25;

  sidebarCollapsed = false;
  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];

  cotizacionesTabla: CotizacionTabla[] = [];

  tableConfig: DataTableConfig<CotizacionTabla> = {
    data: [],
    columns: [
      {
        key: 'codigoCotizacion',
        header: 'Código',
        icon: 'fa-hashtag',
        sortable: true,
        width: '120px',
      },
      {
        key: 'cliente',
        header: 'Cliente',
        icon: 'fa-user',
        sortable: true,
      },
      {
        key: 'fechaEmision',
        header: 'Emisión',
        icon: 'fa-calendar',
        sortable: true,
        render: (item: CotizacionTabla) => this.formatDate(item.fechaEmision),
      },
      {
        key: 'fechaVencimiento',
        header: 'Venc.',
        icon: 'fa-calendar-check',
        sortable: true,
        render: (item: CotizacionTabla) => this.formatDate(item.fechaVencimiento),
      },
      {
        key: 'cantAdultos',
        header: 'Pasajeros',
        icon: 'fa-users',
        sortable: true,
        align: 'center',
        render: (item: CotizacionTabla) => {
          let text = `${item.cantAdultos} adulto${item.cantAdultos !== 1 ? 's' : ''}`;
          if (item.cantNinos > 0) {
            text += ` | ${item.cantNinos} niño${item.cantNinos !== 1 ? 's' : ''}`;
          }
          return text;
        },
      },
      {
        key: 'estado',
        header: 'Estado',
        icon: 'fa-info-circle',
        sortable: true,
        align: 'center',
      },
    ],
    enableSearch: true,
    searchPlaceholder: 'Buscar por código, nombre o cliente...',
    enableSelection: false,
    enablePagination: true,
    enableViewSwitcher: true,
    enableSorting: true,

    serverSidePagination: true,
    totalServerItems: 0,
    itemsPerPage: 25,
    pageSizeOptions: [10, 25, 50, 100],

    actions: [
      {
        icon: 'fa-eye',
        label: 'Ver',
        color: 'green',
        handler: (item: CotizacionTabla) => this.navegarADetalle(item.cotizacionOriginal.id),
      },
      {
        icon: 'fa-edit',
        label: 'Editar',
        color: 'blue',
        handler: (item: CotizacionTabla) => this.navegarADetalle(item.cotizacionOriginal.id, true),
      },
      {
        icon: 'fa-file-word',
        label: 'Word',
        color: 'indigo',
        handler: (item: CotizacionTabla) => this.descargarWord(item.cotizacionOriginal),
      },
      {
        icon: 'fa-history',
        label: 'Historial',
        color: 'blue',
        handler: (item: CotizacionTabla) => this.navegarAHistorial(item.cotizacionOriginal.id),
      },
      {
        icon: 'fa-trash',
        label: 'Eliminar',
        color: 'red',
        handler: (item: CotizacionTabla) => this.confirmarEliminacion(item.cotizacionOriginal),
      },
    ],
    bulkActions: [],
    emptyMessage: 'No se encontraron cotizaciones',
    loadingMessage: 'Cargando cotizaciones...',
    defaultView: 'table',
    enableRowHover: true,
    trackByKey: 'id',
  };

  constructor(private menuConfigService: MenuConfigService) { }

  ngOnInit(): void {
    this.sidebarMenuItems = this.menuConfigService.getMenuItems('/quotes');
    this.loadCotizaciones();
  }




  onPageChange(page: number): void {
    this.currentPage = page - 1;
    this.loadCotizaciones();
  }


  onItemsPerPageChange(newSize: number): void {
    this.currentPage = 0;
    this.currentPageSize = newSize;
    this.loadCotizaciones();
  }



  private showError(message: string): void {
    this.errorMessage = message;
    this.showErrorMessage = true;
    this.showSuccessMessage = false;
    setTimeout(() => {
      this.showErrorMessage = false;
    }, 5000);
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.showSuccessMessage = true;
    this.showErrorMessage = false;
    setTimeout(() => {
      this.showSuccessMessage = false;
    }, 3000);
  }

  hideMessages(): void {
    this.showErrorMessage = false;
    this.showSuccessMessage = false;
  }

  private async loadCotizaciones(): Promise<void> {
    try {
      this.isLoading = true;

      const response = await this.cotizacionService
        .getCotizacionesPage(this.currentPage, this.currentPageSize, 'id', 'desc')
        .toPromise();

      const content = response?.content || [];
      this.totalServerItems = response?.totalElements || 0;

      this.cotizacionesTabla = content.map((c) => ({
        id: c.id,
        codigoCotizacion: c.codigoCotizacion || '',
        nombreCotizacion: c.nombreCotizacion || 'Sin nombre',
        cliente: c.clienteNombre || 'Sin cliente',
        clienteId: c.personas?.id || 0,
        fechaEmision: c.fechaEmision || '',
        fechaVencimiento: c.fechaVencimiento || '',
        cantAdultos: c.cantAdultos || 0,
        cantNinos: c.cantNinos || 0,
        estado: c.estadoCotizacion?.descripcion || 'Sin estado',
        estadoId: c.estadoCotizacion?.id || 0,
        moneda: c.moneda || 'USD',
        total: 0,
        cotizacionOriginal: c,
      }));


      this.tableConfig = {
        ...this.tableConfig,
        data: this.cotizacionesTabla,
        totalServerItems: this.totalServerItems,
      };
    } catch (error) {
      this.showError('Error al cargar las cotizaciones. Por favor, recargue la página.');
      this.cotizacionesTabla = [];
      this.tableConfig = { ...this.tableConfig, data: [] };
    } finally {
      this.isLoading = false;
    }
  }

  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onSidebarItemClick(item: SidebarMenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  confirmarEliminacion(cotizacion: CotizacionResponse): void {
    this.confirmService.confirm({
      title: 'Eliminar Cotización',
      message: `¿Estás seguro de que deseas eliminar la cotización ${cotizacion.codigoCotizacion}?`,
      type: 'danger'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.eliminarCotizacionDirectamente(cotizacion.id);
      }
    });
  }

  mostrarFormularioCrear(): void {
    this.router.navigate(['/quotes/crear']);
  }

  navegarADetalle(cotizacionId: number | undefined, modoEdicion: boolean = false): void {
    if (!cotizacionId) {
      this.showError('ID de cotización no válido');
      return;
    }

    if (modoEdicion) {
      this.router.navigate(['/quotes/detalle', cotizacionId], {
        queryParams: { modo: 'editar' }
      });
    } else {
      this.router.navigate(['/quotes/detalle', cotizacionId]);
    }
  }

  navegarAHistorial(cotizacionId: number | undefined): void {
    if (!cotizacionId) {
      this.showError('ID de cotización no válido');
      return;
    }

    this.router.navigate(['/quotes/detalle', cotizacionId], {
      queryParams: { seccion: 'historial' }
    });
  }

  descargarWord(cotizacion: CotizacionResponse): void {
    if (!cotizacion || !cotizacion.id) {
      this.showError('No se puede generar el documento. Cotización inválida.');
      return;
    }

    this.isLoading = true;
    this.cotizacionService.descargarDocx(cotizacion.id, cotizacion.codigoCotizacion);

    setTimeout(() => {
      this.isLoading = false;
      this.showSuccess('Documento Word generado correctamente');
    }, 1000);
  }

  private async eliminarCotizacionDirectamente(id: number): Promise<void> {
    this.isLoading = true;

    try {
      await this.cotizacionService.deleteByIdCotizacion(id).toPromise();

      await this.loadCotizaciones();
      this.showSuccess('Cotización eliminada exitosamente.');
    } catch (error: any) {
      const errorMessage =
        error?.error?.detail ||
        error?.error?.message ||
        error?.message ||
        'Error al eliminar la cotización. Por favor, inténtelo de nuevo.';
      this.showError(errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES');
  }


  getTotalCotizaciones(): number {
    return this.totalServerItems;
  }
}