import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SucursalService } from '../../core/service/Sucursal/sucursal.service';
import { SucursalRequest, SucursalResponse } from '../../shared/models/Sucursal/sucursal.model';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { DataTableConfig } from '../../shared/components/data-table/data-table.config';

// Interface para la tabla de sucursales
export interface SucursalTabla {
  id: number;
  descripcion: string;
  direccion: string;
  telefono: string;
  email: string;
  estado: boolean;
  estadoText: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

@Component({
  selector: 'app-sucursales',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SidebarComponent,
    DataTableComponent
  ],
  templateUrl: './sucursales.component.html',
  styleUrls: ['./sucursales.component.css']
})
export class SucursalesComponent implements OnInit {

  // Sidebar Configuration
  sidebarCollapsed = false;
  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];

  // Data
  sucursales: SucursalResponse[] = [];
  sucursalesTabla: SucursalTabla[] = [];
  filteredSucursales: SucursalTabla[] = [];

  // Forms
  sucursalForm!: FormGroup;

  // Control variables
  isLoading: boolean = false;
  loading = false;
  mostrarModalCrear = false;
  mostrarModalEliminar = false;
  editandoSucursal = false;
  sucursalSeleccionada: SucursalResponse | null = null;
  sucursalAEliminar: SucursalResponse | null = null;

  searchTerm = '';
  selectedStatus = 'todos';
  currentView: 'table' | 'cards' | 'list' = 'table';

  // Sorting variables
  sortColumn: string = 'descripcion';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Función para adaptar sucursal a formato module-card
  // Variables para selección múltiple
  selectedItems: number[] = [];
  allSelected: boolean = false;
  someSelected: boolean = false;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Estadísticas
  totalSucursales = 0;
  totalActivas = 0;
  totalInactivas = 0;

  // Math object for template use
  Math = Math;

  // Configuración de DataTable
  tableConfig: DataTableConfig<SucursalTabla> = {
    data: [],
    columns: [
      {
        key: 'descripcion',
        header: 'Nombre',
        icon: 'fa-map-marker-alt',
        sortable: true,
        render: (item) => item.descripcion || 'N/A'
      },
      {
        key: 'direccion',
        header: 'Dirección',
        icon: 'fa-location-arrow',
        sortable: true,
        render: (item) => item.direccion || 'N/A'
      },
      {
        key: 'telefono',
        header: 'Teléfono',
        icon: 'fa-phone',
        sortable: true,
        width: '130px',
        render: (item) => item.telefono || 'N/A'
      },
      {
        key: 'email',
        header: 'Email',
        icon: 'fa-envelope',
        sortable: true,
        render: (item) => item.email || 'N/A'
      },
      {
        key: 'estado',
        header: 'Estado',
        icon: 'fa-info-circle',
        sortable: true,
        width: '100px',
        render: (item) => item.estadoText
      },
      {
        key: 'creado',
        header: 'Fecha de Creación',
        icon: 'fa-calendar',
        sortable: true,
        width: '150px',
        render: (item) => this.formatDate(item.fechaCreacion)
      },
      {
        key: 'actualizado',
        header: 'Fecha de Actualización',
        icon: 'fa-calendar',
        sortable: true,
        width: '150px',
        render: (item) => this.formatDate(item.fechaActualizacion)
      }
    ],
    enableSearch: true,
    searchPlaceholder: 'Buscar sucursales...',
    enableSelection: true,
    enablePagination: true,
    enableViewSwitcher: true,
    enableSorting: true,
    itemsPerPage: 10,
    pageSizeOptions: [5, 10, 25, 50],
    actions: [
      {
        icon: 'fa-edit',
        label: 'Editar',
        color: 'blue',
        handler: (item) => this.editarSucursal(item)
      },
      {
        icon: 'fa-toggle-on',
        label: 'Cambiar Estado',
        color: 'yellow',
        handler: (item) => this.confirmarEliminar(item)
      }
    ],
    emptyMessage: 'No se encontraron sucursales',
    loadingMessage: 'Cargando sucursales...',
    defaultView: 'table',
    enableRowHover: true,
    trackByKey: 'id'
  };

  constructor(
    private fb: FormBuilder,
    private sucursalService: SucursalService,
    private router: Router,
    private menuConfigService: MenuConfigService,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.sidebarMenuItems = this.menuConfigService.getMenuItems('/sucursales');
    this.loadSucursales();
  }

  // =================================================================
  // SIDEBAR FILTERING
  // ================================================================= 
  // Sidebar methods
  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onSidebarItemClick(item: ExtendedSidebarMenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }


  private initializeForm(): void {
    this.sucursalForm = this.fb.group({
      descripcion: ['', this.optionalMinLength(3)],
      direccion: ['', this.optionalMinLength(5)],
      telefono: ['', this.optionalMinLength(7)],
      email: ['', this.optionalEmail()],
      estado: [false] // Sin valor por defecto, usuario debe elegir
    });
  }

  // Validador personalizado para longitud mínima opcional
  private optionalMinLength(minLength: number) {
    return (control: any) => {
      if (!control.value || control.value === '') {
        return null; // Campo vacío es válido
      }
      return control.value.length >= minLength ? null : { minlength: { requiredLength: minLength, actualLength: control.value.length } };
    };
  }

  // Validador personalizado para email opcional
  private optionalEmail() {
    return (control: any) => {
      if (!control.value || control.value === '') {
        return null; // Campo vacío es válido
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(control.value) ? null : { email: true };
    };
  }

  // CRUD Operations
  loadSucursales(): void {
    this.loading = true;
    this.sucursalService.findAllSucursal().subscribe({
      next: (data) => {
        this.sucursales = data;
        this.transformarDataParaTabla();
        this.applyFilters();
        this.calcularEstadisticas();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar sucursales:', error);
        this.loading = false;
      }
    });
  }

  private transformarDataParaTabla(): void {
    this.sucursalesTabla = this.sucursales.map(sucursal => ({
      ...sucursal,
      estadoText: sucursal.estado ? 'Activa' : 'Inactiva'
    }));
    this.tableConfig = {
      ...this.tableConfig,
      data: this.sucursalesTabla
    };
  }

  // Método principal para guardar (crea o actualiza según el estado)
  guardarSucursal(): void {
    if (this.sucursalForm.valid) {
      if (this.editandoSucursal) {
        this.actualizarSucursal();
      } else {
        this.crearSucursal();
      }
    }
  }

  crearSucursal(): void {
    const sucursalData: SucursalRequest = {
      ...this.sucursalForm.value
    };

    this.loading = true;
    this.sucursalService.saveSucursal(sucursalData).subscribe({
      next: (response) => {
        this.loadSucursales();
        this.cerrarModal();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al crear sucursal:', error);
        this.loading = false;
      }
    });
  }

  actualizarSucursal(): void {
    if (this.sucursalSeleccionada) {
      const sucursalData: SucursalRequest = {
        ...this.sucursalForm.value
      };

      this.loading = true;
      this.sucursalService.updateSucursal(this.sucursalSeleccionada.id, sucursalData).subscribe({
        next: (response) => {
          this.loadSucursales();
          this.cerrarModal();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al actualizar sucursal:', error);
          this.loading = false;
        }
      });
    }
  }

  // Modal de confirmación de eliminación
  confirmarEliminar(sucursal: SucursalTabla): void {
    const sucursalCompleta = this.sucursales.find(s => s.id === sucursal.id);
    if (sucursalCompleta) {
      this.sucursalAEliminar = sucursalCompleta;
      this.mostrarModalEliminar = true;
    }
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.sucursalAEliminar = null;
  }

  confirmarEliminacionModal(): void {
    if (this.sucursalAEliminar) {
      this.cambiarEstadoSucursal(this.sucursalAEliminar);
    }
  }

  cambiarEstadoSucursal(sucursal: SucursalResponse): void {
    const nuevoEstado = !sucursal.estado;

    this.loading = true;
    this.sucursalService.cambiarEstadoSucursal(sucursal.id, nuevoEstado).subscribe({
      next: (response) => {
        this.loadSucursales();
        this.cerrarModalEliminar();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cambiar estado de sucursal:', error);
        this.loading = false;
      }
    });
  }

  // Modal management
  abrirModalCrear(): void {
    this.editandoSucursal = false;
    this.sucursalSeleccionada = null;
    this.sucursalForm.reset();
    this.mostrarModalCrear = true;
  }

  editarSucursal(sucursalTabla: SucursalTabla): void {
    const sucursalCompleta = this.sucursales.find(s => s.id === sucursalTabla.id);
    if (sucursalCompleta) {
      this.editandoSucursal = true;
      this.sucursalSeleccionada = sucursalCompleta;
      this.sucursalForm.patchValue(sucursalCompleta);
      this.mostrarModalCrear = true;
    }
  }

  cerrarModal(): void {
    this.mostrarModalCrear = false;
    this.editandoSucursal = false;
    this.sucursalSeleccionada = null;
    this.sucursalForm.reset();
  }

  // Search and filter
  applyFilters(): void {
    let filtered = [...this.sucursalesTabla];

    // Filtro por búsqueda
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(sucursal =>
        sucursal.descripcion.toLowerCase().includes(searchLower) ||
        sucursal.direccion.toLowerCase().includes(searchLower) ||
        sucursal.telefono.toLowerCase().includes(searchLower) ||
        sucursal.email.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por estado
    if (this.selectedStatus !== 'todos') {
      const estado = this.selectedStatus === 'activos';
      filtered = filtered.filter(sucursal => sucursal.estado === estado);
    }

    this.filteredSucursales = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 1;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  refreshData(): void {
    this.loadSucursales();
  }

  onItemsPerPageChange(): void {
    this.itemsPerPage = Number(this.itemsPerPage);
    this.currentPage = 1;
    this.calcularEstadisticas();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getVisiblePages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 2;

    let start = Math.max(1, current - delta);
    let end = Math.min(total, current + delta);

    if (end - start < 2 * delta) {
      if (start === 1) {
        end = Math.min(total, start + 2 * delta);
      } else if (end === total) {
        start = Math.max(1, end - 2 * delta);
      }
    }

    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }


  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredSucursales.sort((a, b) => {
      let valueA: any = a[column as keyof SucursalTabla];
      let valueB: any = b[column as keyof SucursalTabla];

      // Manejo especial para fechas
      if (column === 'fechaCreacion' || column === 'fechaActualizacion') {
        valueA = new Date(valueA);
        valueB = new Date(valueB);
      } else if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }

      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // Métodos para selección múltiple
  toggleAllSelection(): void {
    if (this.allSelected) {
      this.selectedItems = [];
    } else {
      this.selectedItems = this.paginatedSucursales.map(sucursal => sucursal.id);
    }
    this.updateSelectionState();
  }

  toggleSelection(id: number): void {
    const index = this.selectedItems.indexOf(id);
    if (index > -1) {
      this.selectedItems.splice(index, 1);
    } else {
      this.selectedItems.push(id);
    }
    this.updateSelectionState();
  }

  updateSelectionState(): void {
    const currentPageIds = this.paginatedSucursales.map(sucursal => sucursal.id);
    this.allSelected = currentPageIds.length > 0 && currentPageIds.every(id => this.selectedItems.includes(id));
    this.someSelected = currentPageIds.some(id => this.selectedItems.includes(id)) && !this.allSelected;
  }

  isSelected(id: number): boolean {
    return this.selectedItems.includes(id);
  }

  clearSelection(): void {
    this.selectedItems = [];
    this.updateSelectionState();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  // Pagination
  get paginatedSucursales(): SucursalTabla[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredSucursales.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredSucursales.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateSelectionState();
    }
  }

  // Estadísticas
  calcularEstadisticas(): void {
    this.totalSucursales = this.sucursales.length;
    this.totalActivas = this.sucursales.filter(s => s.estado).length;
    this.totalInactivas = this.sucursales.filter(s => !s.estado).length;
  }

  // Sidebar methods


  // Métodos para cambiar entre vistas
  changeView(view: 'table' | 'cards' | 'list'): void {
    this.currentView = view;
  }

  isActiveView(view: 'table' | 'cards' | 'list'): boolean {
    return this.currentView === view;
  }

  // Métodos para estadísticas del header
  getActiveSucursalesCount(): number {
    return this.totalActivas;
  }

  getInactiveSucursalesCount(): number {
    return this.totalInactivas;
  }

  getTotalSucursalesCount(): number {
    return this.totalSucursales;
  }

  // Métodos para formatear fechas
  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES');
  }

  formatTime(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // TrackBy function for performance
  trackBySucursalId(index: number, sucursal: SucursalTabla): number {
    return sucursal.id;
  }
}
