import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CounterService } from '../../core/service/Counter/counter.service';
import { CounterRequest, CounterResponse } from '../../shared/models/Counter/counter.model';
import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';
import { ModuleCardComponent, ModuleCardData } from '../../shared/components/ui/module-card/module-card.component';

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
    private cdr: ChangeDetectorRef
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadCounters();
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

  // Sidebar methods
  onSidebarItemClick(item: SidebarMenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    // Forzar detección de cambios para actualizar el layout
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
