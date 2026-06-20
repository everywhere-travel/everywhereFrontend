import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Services
import { AsientoContableService } from '../../core/service/AsiendoContable/asiento-contable.service';
import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';

// Models
import { AsientoContableResponse } from '../../shared/models/AsientoContable/asientoContable.model';

// Components
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { DataTableConfig } from '../../shared/components/data-table/data-table.config';

@Component({
  selector: 'app-asiento-contable',
  standalone: true,
  templateUrl: './asiento-contable.html',
  styleUrls: ['./asiento-contable.css'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SidebarComponent, DataTableComponent]
})
export class AsientoContable implements OnInit, OnDestroy {

  // ===== SERVICES INJECTION =====
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private asientoContableService = inject(AsientoContableService);

  // ===== UI STATE =====
  loading: boolean = false;
  isLoading = false;
  sidebarCollapsed = false;
  mostrarModalVer = false;
  mostrarModalAnular = false;

  // ===== DATA ARRAYS =====
  asientos: AsientoContableResponse[] = [];
  filteredAsientos: AsientoContableResponse[] = [];

  // ===== SELECTION STATE =====
  asientoSeleccionado: AsientoContableResponse | null = null;

  // ===== SEARCH =====
  searchTerm = '';

  // ===== MESSAGES =====
  errorMessage: string = '';
  successMessage: string = '';
  showErrorMessage: boolean = false;
  showSuccessMessage: boolean = false;

  // ===== FORMS =====
  searchForm!: FormGroup;

  // ===== SIDEBAR CONFIGURATION =====
  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];

  // ===== TEMPLATE UTILITIES =====
  Math = Math;

  // Configuración de DataTable
  tableConfig: DataTableConfig<AsientoContableResponse> = {
    data: [],
    columns: [
      {
        key: 'id',
        header: 'N° Asiento',
        icon: 'fa-hashtag',
        sortable: true,
        width: '120px',
        render: (item) => this.getNumeroAsiento(item.id)
      },
      {
        key: 'fecha',
        header: 'Fecha',
        icon: 'fa-calendar',
        sortable: true,
        width: '120px',
        render: (item) => this.formatDate(item.fecha)
      },
      {
        key: 'glosa',
        header: 'Glosa',
        icon: 'fa-align-left',
        sortable: true,
      },
      {
        key: 'origen',
        header: 'Origen',
        icon: 'fa-file-invoice',
        sortable: true,
        width: '150px',
        render: (item) => `${item.origen || 'N/A'} ${item.origenId ? '#' + item.origenId : ''}`
      },
      {
        key: 'moneda',
        header: 'Moneda',
        icon: 'fa-coins',
        sortable: true,
        width: '100px',
        align: 'center',
        render: () => 'USD'
      },
      {
        key: 'totalDebe',
        header: 'Total Debe',
        icon: 'fa-arrow-down',
        sortable: true,
        align: 'right',
        render: (item) => this.formatCurrency(item.totalDebe, item.moneda)
      },
      {
        key: 'totalHaber',
        header: 'Total Haber',
        icon: 'fa-arrow-up',
        sortable: true,
        align: 'right',
        render: (item) => this.formatCurrency(item.totalHaber, item.moneda)
      },
      {
        key: 'estado',
        header: 'Estado',
        icon: 'fa-info-circle',
        sortable: true,
        align: 'center',
        render: (item) => {
          return item.anulado ? 'Anulado' : 'Activo';
        }
      }
    ],
    enableSearch: true,
    searchPlaceholder: 'Buscar por glosa, origen...',
    enableSelection: false,
    enablePagination: true,
    enableViewSwitcher: true,
    enableSorting: true,
    itemsPerPage: 10,
    pageSizeOptions: [5, 10, 25, 50],
    actions: [
      {
        icon: 'fa-eye',
        label: 'Ver Detalle',
        color: 'blue',
        handler: (item) => this.verDetalleAsiento(item)
      }
    ],
    emptyMessage: 'No se encontraron asientos contables',
    loadingMessage: 'Cargando asientos contables...',
    defaultView: 'table',
    enableRowHover: true,
    trackByKey: 'id'
  };

  constructor(private menuConfigService: MenuConfigService) { }

  ngOnInit(): void {
    this.initializeForms();
    this.loadInitialData();
    // Assuming you have a menu configuration for asientos contables, otherwise fallback to root
    this.sidebarMenuItems = this.menuConfigService.getMenuItems('/accounting-entries') || this.menuConfigService.getMenuItems('/');
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions if needed
  }

  // ===== STATS METHODS =====
  getTotalAsientos(): number {
    return this.asientos.length;
  }

  getAsientosActivos(): number {
    return this.asientos.filter(a => !a.anulado).length;
  }

  getAsientosAnulados(): number {
    return this.asientos.filter(a => a.anulado).length;
  }

  // ===== INITIALIZATION =====
  private initializeForms(): void {
    this.searchForm = this.fb.group({
      searchTerm: ['']
    });

    this.searchForm.get('searchTerm')?.valueChanges.subscribe(value => {
      this.searchTerm = value;
      this.filterAsientos();
    });
  }

  private async loadInitialData(): Promise<void> {
    this.loading = true;
    this.isLoading = true;
    try {
      await this.loadAsientos();
    } catch (error) {
      this.showError('Error al cargar los datos iniciales');
    } finally {
      this.loading = false;
      this.isLoading = false;
    }
  }

  // ===== DATA LOADING =====
  private async loadAsientos(): Promise<void> {
    try {
      this.asientos = await this.asientoContableService.getAllAsientosContables().toPromise() || [];
      // Ordenar por id descendente (más recientes primero)
      this.asientos.sort((a, b) => (b.id || 0) - (a.id || 0));
      this.filteredAsientos = [...this.asientos];
      
      this.tableConfig = {
        ...this.tableConfig,
        data: this.filteredAsientos
      };
    } catch (error) {
      console.error('Error al cargar asientos contables:', error);
      this.showError('Error al cargar los asientos contables');
      this.asientos = [];
    }
  }

  // ===== REFRESH METHODS =====
  async actualizarDatos(): Promise<void> {
    this.loading = true;
    this.isLoading = true;
    try {
      await this.loadAsientos();
      this.showSuccess('Datos actualizados correctamente');
    } catch (error) {
      this.showError('Error al actualizar los datos');
    } finally {
      this.loading = false;
      this.isLoading = false;
    }
  }

  // ===== SEARCH AND FILTER =====
  clearSearch(): void {
    this.searchForm.patchValue({ searchTerm: '' });
    this.searchTerm = '';
    this.filterAsientos();
  }

  private filterAsientos(): void {
    if (!this.searchTerm.trim()) {
      this.filteredAsientos = [...this.asientos];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredAsientos = this.asientos.filter(asiento => 
        (asiento.glosa?.toLowerCase() || '').includes(term) ||
        (asiento.origen?.toLowerCase() || '').includes(term) ||
        asiento.id?.toString().includes(term) ||
        asiento.origenId?.toString().includes(term)
      );
    }
    this.tableConfig = {
      ...this.tableConfig,
      data: this.filteredAsientos
    };
  }

  // ===== MESSAGE HANDLING =====
  private showError(message: string): void {
    this.errorMessage = message;
    this.showErrorMessage = true;
    setTimeout(() => this.hideMessages(), 5000);
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.showSuccessMessage = true;
    setTimeout(() => this.hideMessages(), 3000);
  }

  hideMessages(): void {
    this.showErrorMessage = false;
    this.showSuccessMessage = false;
  }

  // ===== ACTIONS =====
  async verDetalleAsiento(asiento: AsientoContableResponse): Promise<void> {
    this.isLoading = true;
    try {
      if (!asiento.detalles || asiento.detalles.length === 0) {
        // Cargar el detalle completo si no tiene detalles
        const completo = await this.asientoContableService.getByIdAsientoContable(asiento.id!).toPromise();
        this.asientoSeleccionado = completo || asiento;
      } else {
        this.asientoSeleccionado = asiento;
      }
      this.mostrarModalVer = true;
    } catch (error) {
      this.showError('Error al cargar el detalle del asiento');
    } finally {
      this.isLoading = false;
    }
  }

  cerrarModalVer(): void {
    this.mostrarModalVer = false;
    this.asientoSeleccionado = null;
  }

  confirmarAnular(asiento: AsientoContableResponse): void {
    this.asientoSeleccionado = asiento;
    this.mostrarModalAnular = true;
  }

  cerrarModalAnular(): void {
    this.mostrarModalAnular = false;
    this.asientoSeleccionado = null;
  }

  anularAsiento(): void {
    if (!this.asientoSeleccionado?.id) return;

    this.isLoading = true;
    this.asientoContableService.anularAsientoContable(this.asientoSeleccionado.id).subscribe({
      next: () => {
        this.showSuccess('Asiento anulado correctamente');
        this.cerrarModalAnular();
        this.loadAsientos();
      },
      error: (error) => {
        const errorMsg = error.error?.message || error.message || 'Error al anular el asiento';
        this.showError(errorMsg);
        this.isLoading = false;
        this.cerrarModalAnular();
      }
    });
  }

  // ===== SIDEBAR METHODS =====
  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onSidebarItemClick(item: ExtendedSidebarMenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  // ===== UTILITY METHODS =====
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    // Si viene ISO de Local Date Time
    const dateParts = dateString.split('T')[0].split('-');
    if (dateParts.length === 3) {
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10);
      const day = parseInt(dateParts[2], 10);
      const localDate = new Date(year, month - 1, day);
      return localDate.toLocaleDateString('es-ES');
    }
    return new Date(dateString).toLocaleDateString('es-ES');
  }

  formatCurrency(amount: number | undefined, moneda?: string): string {
    if (amount === undefined || amount === null) return '$ 0.00';
    return '$ ' + amount.toFixed(2);
  }

  getNumeroAsiento(id: number | undefined): string {
    if (!id) return 'N/A';
    return `AST-${String(id).padStart(6, '0')}`;
  }

}
