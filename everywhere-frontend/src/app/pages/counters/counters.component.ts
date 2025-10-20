import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CounterService } from '../../core/service/Counter/counter.service';
import { CounterRequest, CounterResponse } from '../../shared/models/Counter/counter.model';
import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';
import { ModuleCardComponent, ModuleCardData } from '../../shared/components/ui/module-card/module-card.component';
import { AuthServiceService } from '../../core/service/auth/auth.service';

// Extender la interfaz para agregar moduleKey
interface ExtendedSidebarMenuItem extends SidebarMenuItem {
  moduleKey?: string;
  children?: ExtendedSidebarMenuItem[];
}

// Interface para la tabla de counters
export interface CounterTabla {
  id: number;
  nombre: string;
  codigo: string;
  estado: boolean;
  estadoText: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

@Component({
  selector: 'app-counters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SidebarComponent
  ],
  templateUrl: './counters.component.html',
  styleUrls: ['./counters.component.css']
})
export class CountersComponent implements OnInit {

  // Sidebar Configuration
  sidebarCollapsed = false;
  allSidebarMenuItems: ExtendedSidebarMenuItem[] = [
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
      moduleKey: 'CLIENTES',
      children: [
        {
          id: 'personas',
          title: 'Clientes',
          icon: 'fas fa-address-card',
          route: '/personas',
          moduleKey: 'CLIENTES'
        },
        {
          id: 'viajeros',
          title: 'Viajeros',
          icon: 'fas fa-passport',
          route: '/viajero',
          moduleKey: 'VIAJEROS'
        },
        {
          id: 'viajeros-frecuentes',
          title: 'Viajeros Frecuentes',
          icon: 'fas fa-crown',
          route: '/viajero-frecuente',
          moduleKey: 'VIAJEROS'
        }
      ]
    },
    {
      id: 'cotizaciones',
      title: 'Cotizaciones',
      icon: 'fas fa-file-invoice',
      route: '/cotizaciones',
      moduleKey: 'COTIZACIONES'
    },
    {
      id: 'liquidaciones',
      title: 'Liquidaciones',
      icon: 'fas fa-credit-card',
      route: '/liquidaciones',
      moduleKey: 'LIQUIDACIONES'
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
          route: '/productos',
          moduleKey: 'PRODUCTOS'
        },
        {
          id: 'proveedores',
          title: 'Proveedores',
          icon: 'fas fa-truck',
          route: '/proveedores',
          moduleKey: 'PROVEEDORES'
        },
        {
          id: 'operadores',
          title: 'Operadores',
          icon: 'fas fa-headset',
          route: '/operadores',
          moduleKey: 'OPERADOR'
        },
        {
          id: 'documentos',
          title: 'Documentos',
          icon: 'fas fa-file-alt',
          route: '/documentos',
          moduleKey: 'DOCUMENTOS'
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
          route: '/counters',
          moduleKey: 'COUNTERS',
          active: true
        },
        {
          id: 'sucursales',
          title: 'Sucursales',
          icon: 'fas fa-building',
          route: '/sucursales',
          moduleKey: 'SUCURSALES'
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
          route: '/carpetas',
          moduleKey: 'CARPETAS'
        }
      ]
    }
  ];

  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];

  // Data
  counters: CounterResponse[] = [];
  countersTabla: CounterTabla[] = [];
  filteredCounters: CounterTabla[] = [];

  // Forms
  counterForm!: FormGroup;

  // Control variables
  loading = false;
  mostrarModalCrear = false;
  mostrarModalEliminar = false;
  editandoCounter = false;
  counterSeleccionado: CounterResponse | null = null;
  counterAEliminar: CounterResponse | null = null;

  searchTerm = '';
  selectedStatus = 'todos';
  currentView: 'table' | 'cards' | 'list' = 'table';

  // Sorting variables
  sortColumn: string = 'nombre';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Función para adaptar counter a formato module-card
  adaptCounterToModuleCard(counter: CounterTabla): ModuleCardData {
    return {
      title: counter.nombre,
      description: `Código: ${counter.codigo}`,
      route: '', // No necesitamos navegación para las tarjetas de counter
      icon: '',
      iconType: 'counters',
      status: {
        text: counter.estadoText,
        type: counter.estado ? 'active' : 'neutral'
      },
      action: {
        text: 'Gestionar'
      },
      featured: false
    };
  }

  // Variables para selección múltiple
  selectedItems: number[] = [];
  allSelected: boolean = false;
  someSelected: boolean = false;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Estadísticas
  totalCounters = 0;
  totalActivos = 0;
  totalInactivos = 0;

  // Math object for template use
  Math = Math;

  constructor(
    private fb: FormBuilder,
    private counterService: CounterService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private authService: AuthServiceService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.initializeSidebar();
    this.loadCounters();
  }

  // =================================================================
  // SIDEBAR FILTERING
  // =================================================================

  private initializeSidebar(): void {
    const authData = this.authService.getUser();
    const userPermissions = authData?.permissions || {};

    // Si tiene ALL_MODULES, mostrar todos los items, sino filtrar por permisos específicos
    if (userPermissions['ALL_MODULES']) {
      this.sidebarMenuItems = this.allSidebarMenuItems;
    } else {
      this.sidebarMenuItems = this.filterSidebarItems(this.allSidebarMenuItems, userPermissions);
    }
  }

  private filterSidebarItems(items: ExtendedSidebarMenuItem[], userPermissions: any): ExtendedSidebarMenuItem[] {
    return items.filter(item => {
      // Dashboard siempre visible
      if (item.id === 'dashboard') {
        return true;
      }

      // Items sin moduleKey (como configuración, reportes) siempre visibles
      if (!item.moduleKey) {
        // Si tiene children, filtrar los children
        if (item.children) {
          const filteredChildren = this.filterSidebarItems(item.children, userPermissions);
          // Solo mostrar el padre si tiene al menos un hijo visible
          if (filteredChildren.length > 0) {
            return {
              ...item,
              children: filteredChildren
            };
          }
          return false;
        }
        return true;
      }

      // Verificar si el usuario tiene permisos para este módulo
      const hasPermission = Object.keys(userPermissions).includes(item.moduleKey);

      if (hasPermission) {
        // Si tiene children, filtrar los children también
        if (item.children) {
          const filteredChildren = this.filterSidebarItems(item.children, userPermissions);
          return {
            ...item,
            children: filteredChildren
          };
        }
        return true;
      }

      return false;
    }).map(item => {
      // Asegurar que los children filtrados se apliquen correctamente
      if (item.children) {
        return {
          ...item,
          children: this.filterSidebarItems(item.children, userPermissions)
        };
      }
      return item;
    }).filter(item => {
      // Filtrar items padre que no tengan children después del filtrado
      if (item.children) {
        return item.children.length > 0;
      }
      return true;
    });
  }

  // Sidebar methods
  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onSidebarItemClick(item: ExtendedSidebarMenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  // Validador para campos opcionales con longitud mínima
  private optionalMinLength(minLength: number) {
    return (control: any) => {
      if (!control.value || control.value.length === 0) {
        return null; // Campo vacío es válido
      }
      return control.value.length >= minLength ? null : { minlength: { requiredLength: minLength, actualLength: control.value.length } };
    };
  }

  private initializeForm(): void {
    this.counterForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      codigo: ['', [this.optionalMinLength(2)]]
    });
  }

  // CRUD Operations
  loadCounters(): void {
    this.loading = true;
    this.counterService.getAllCounters().subscribe({
      next: (data) => {
        this.counters = data;
        this.transformarDataParaTabla();
        this.calcularEstadisticas();
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar counters:', error);
        this.loading = false;
      }
    });
  }

  private transformarDataParaTabla(): void {
    this.countersTabla = this.counters.map(counter => ({
      id: counter.id,
      nombre: counter.nombre || '',
      codigo: counter.codigo || '',
      estado: counter.estado || false,
      estadoText: counter.estado ? 'Activo' : 'Inactivo',
      fechaCreacion: counter.fechaCreacion || '',
      fechaActualizacion: counter.fechaActualizacion || ''
    }));
  }

  // Método principal para guardar (crea o actualiza según el estado)
  guardarCounter(): void {
    if (this.counterForm.invalid) return;

    if (this.editandoCounter) {
      this.actualizarCounter();
    } else {
      this.crearCounter();
    }
  }

  crearCounter(): void {
    const request: CounterRequest = this.counterForm.value;
    this.loading = true;

    this.counterService.createCounter(request).subscribe({
      next: (response) => {
        this.loadCounters();
        this.cerrarModal();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al crear counter:', error);
        this.loading = false;
      }
    });
  }

  actualizarCounter(): void {
    const request: CounterRequest = this.counterForm.value;
    this.loading = true;

    this.counterService.updateCounter(request).subscribe({
      next: (response) => {
        this.loadCounters();
        this.cerrarModal();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al actualizar counter:', error);
        this.loading = false;
      }
    });
  }

  // Modal de confirmación de eliminación
  confirmarEliminar(counter: CounterTabla): void {
    const counterOriginal = this.counters.find(c => c.id === counter.id);
    if (counterOriginal) {
      this.counterAEliminar = counterOriginal;
      this.mostrarModalEliminar = true;
    }
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.counterAEliminar = null;
  }

  confirmarEliminacionModal(): void {
    if (this.counterAEliminar) {
      this.cambiarEstadoCounter(this.counterAEliminar);
    }
  }

  cambiarEstadoCounter(counter: CounterResponse): void {
    this.loading = true;
    const request: CounterRequest = {
      nombre: counter.nombre,
      codigo: counter.codigo
    };

    const operacion = counter.estado ?
      this.counterService.deactivateCounter(request) :
      this.counterService.activateCounter(request);

    operacion.subscribe({
      next: (response) => {
        this.loadCounters();
        this.cerrarModalEliminar();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
        this.loading = false;
      }
    });
  }

  // Modal management
  abrirModalCrear(): void {
    this.editandoCounter = false;
    this.counterSeleccionado = null;
    this.counterForm.reset();
    this.mostrarModalCrear = true;
  }

  editarCounter(counterTabla: CounterTabla): void {
    const counterOriginal = this.counters.find(c => c.id === counterTabla.id);
    if (counterOriginal) {
      this.editandoCounter = true;
      this.counterSeleccionado = counterOriginal;
      this.counterForm.patchValue({
        nombre: counterOriginal.nombre,
        codigo: counterOriginal.codigo
      });
      this.mostrarModalCrear = true;
    }
  }

  cerrarModal(): void {
    this.mostrarModalCrear = false;
    this.editandoCounter = false;
    this.counterSeleccionado = null;
    this.counterForm.reset();
  }

  // Search and filter
  applyFilters(): void {
    let filtered = [...this.countersTabla];

    // Filtrar por término de búsqueda
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(counter =>
        counter.nombre.toLowerCase().includes(searchLower) ||
        counter.codigo.toLowerCase().includes(searchLower)
      );
    }

    // Filtrar por estado
    if (this.selectedStatus !== 'todos') {
      const estadoBuscado = this.selectedStatus === 'activos';
      filtered = filtered.filter(counter => counter.estado === estadoBuscado);
    }

    this.filteredCounters = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 1; // Reset a primera página
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

    this.filteredCounters.sort((a, b) => {
      let valueA = (a as any)[column];
      let valueB = (b as any)[column];

      // Manejo especial para fechas
      if (column === 'fechaCreacion' || column === 'fechaActualizacion') {
        valueA = new Date(valueA);
        valueB = new Date(valueB);
      } else if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }

      let result = 0;
      if (valueA < valueB) result = -1;
      else if (valueA > valueB) result = 1;

      return this.sortDirection === 'asc' ? result : -result;
    });
  }

  // Métodos para selección múltiple
  toggleAllSelection(): void {
    this.allSelected = !this.allSelected;
    if (this.allSelected) {
      this.selectedItems = this.paginatedCounters.map(c => c.id);
    } else {
      this.selectedItems = [];
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
    const paginatedIds = this.paginatedCounters.map(c => c.id);
    this.allSelected = paginatedIds.length > 0 && paginatedIds.every(id => this.selectedItems.includes(id));
    this.someSelected = this.selectedItems.length > 0 && !this.allSelected;
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
  get paginatedCounters(): CounterTabla[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredCounters.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateSelectionState();
    }
  }

  // Estadísticas
  calcularEstadisticas(): void {
    this.totalCounters = this.counters.length;
    this.totalActivos = this.counters.filter(c => c.estado).length;
    this.totalInactivos = this.totalCounters - this.totalActivos;
  }

  // Métodos para cambiar entre vistas
  changeView(view: 'table' | 'cards' | 'list'): void {
    this.currentView = view;
  }

  isActiveView(view: 'table' | 'cards' | 'list'): boolean {
    return this.currentView === view;
  }

  // Métodos para estadísticas del header
  getActiveCountersCount(): number {
    return this.totalActivos;
  }

  getInactiveCountersCount(): number {
    return this.totalInactivos;
  }

  getTotalCountersCount(): number {
    return this.totalCounters;
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
  trackByCounterId(index: number, counter: CounterTabla): number {
    return counter.id;
  }
}
