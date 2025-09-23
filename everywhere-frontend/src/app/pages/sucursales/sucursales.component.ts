import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SucursalService } from '../../core/service/Sucursal/sucursal.service';
import { SucursalRequest, SucursalResponse } from '../../shared/models/Sucursal/sucursal.model';
import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';

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
    SidebarComponent
  ],
  templateUrl: './sucursales.component.html',
  styleUrls: ['./sucursales.component.css']
})
export class SucursalesComponent implements OnInit {

  // Sidebar Configuration
  sidebarCollapsed = false;
  sidebarMenuItems: SidebarMenuItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'fas fa-chart-pie',
      route: '/dashboard'
    },
    {
      id: 'clientes',
      title: 'Gestión de Clientes',
      icon: 'fas fa-users', 
      children: [
        {
          id: 'personas',
          title: 'Clientes',
          icon: 'fas fa-address-card',
          route: '/personas'
        },
        {
          id: 'viajeros',
          title: 'Viajeros',
          icon: 'fas fa-passport',
          route: '/viajero'
        },
        {
          id: 'viajeros-frecuentes',
          title: 'Viajeros Frecuentes',
          icon: 'fas fa-crown',
          route: '/viajero-frecuente'
        }
      ]
    },
    {
      id: 'cotizaciones',
      title: 'Cotizaciones',
      icon: 'fas fa-file-invoice',
      route: '/cotizaciones'
    },
    {
      id: 'liquidaciones',
      title: 'Liquidaciones',
      icon: 'fas fa-credit-card',
      route: '/liquidaciones'
    },
    {
      id: 'recursos',
      title: 'Recursos',
      icon: 'fas fa-box',
      children: [
        {
          id: 'productos',
          title: 'Productos',
          icon: 'fas fa-cube',
          route: '/productos'
        },
        {
          id: 'proveedores',
          title: 'Proveedores',
          icon: 'fas fa-truck',
          route: '/proveedores'
        },
        {
          id: 'operadores',
          title: 'Operadores',
          icon: 'fas fa-headset',
          route: '/operadores'
        }
      ]
    },
    {
      id: 'organización',
      title: 'Organización',
      icon: 'fas fa-sitemap',
      active: true,
      children: [
        {
          id: 'counters',
          title: 'Counters',
          icon: 'fas fa-users-line',
          route: '/counters'
        },
        {
          id: 'sucursales',
          title: 'Sucursales',
          icon: 'fas fa-building',
          route: '/sucursales'
        }
      ]
    },
    {
      id: 'archivos',
      title: 'Gestión de Archivos',
      icon: 'fas fa-folder', 
      children: [
        {
          id: 'carpetas',
          title: 'Explorador',
          icon: 'fas fa-folder-open',
          route: '/carpetas'
        }
      ]
    },
    {
      id: 'reportes',
      title: 'Reportes y Analytics',
      icon: 'fas fa-chart-bar',
      children: [
        {
          id: 'estadisticas',
          title: 'Estadísticas',
          icon: 'fas fa-chart-line',
          route: '/estadistica'
        },
        {
          id: 'reportes-general',
          title: 'Reportes Generales',
          icon: 'fas fa-file-pdf',
          route: '/reportes'
        }
      ]
    },
    {
      id: 'configuracion',
      title: 'Configuración',
      icon: 'fas fa-cog',
      children: [
        {
          id: 'usuarios',
          title: 'Usuarios',
          icon: 'fas fa-user-shield',
          route: '/usuarios'
        },
        {
          id: 'sistema',
          title: 'Sistema',
          icon: 'fas fa-server',
          route: '/configuracion'
        }
      ]
    }
  ];

  // Data
  sucursales: SucursalResponse[] = [];
  sucursalesTabla: SucursalTabla[] = [];
  filteredSucursales: SucursalTabla[] = [];

  // Forms
  sucursalForm!: FormGroup;

  // Control variables
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

  constructor(
    private fb: FormBuilder,
    private sucursalService: SucursalService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadSucursales();
  }

  private initializeForm(): void {
    this.sucursalForm = this.fb.group({
      descripcion: ['', this.optionalMinLength(3)],
      direccion: ['', this.optionalMinLength(5)],
      telefono: ['', this.optionalMinLength(7)],
      email: ['', this.optionalEmail()]
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
      ...this.sucursalForm.value,
      estado: true
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
        ...this.sucursalForm.value,
        estado: this.sucursalSeleccionada.estado
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
  onSidebarItemClick(item: SidebarMenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this.cdr.detectChanges();
  }

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
