import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ViajeroFrecuenteService } from '../../core/service/viajero/viajero-frecuente.service';
import { ViajeroService } from '../../core/service/viajero/viajero.service';
import { ViajeroFrecuenteRequest, ViajeroFrecuenteResponse } from '../../shared/models/Viajero/viajeroFrecuente.model';
import { ViajeroResponse } from '../../shared/models/Viajero/viajero.model';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';

interface SidebarMenuItem {
  id: string;
  title: string;
  icon: string;
  route?: string;
  active?: boolean;
  children?: SidebarMenuItem[];
}

@Component({
  selector: 'app-viajero-frecuente',
  standalone: true,
  templateUrl: './viajero-frecuente.html',
  styleUrl: './viajero-frecuente.css',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SidebarComponent
  ]
})
export class ViajeroFrecuente implements OnInit {

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
        active: true,
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
        route: '/cotizaciones',
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

  // Data arrays
  viajerosFrecuentes: ViajeroFrecuenteResponse[] = [];
  viajerosFrecuentesFiltrados: ViajeroFrecuenteResponse[] = [];
  viajeros: ViajeroResponse[] = [];

  // Loading state
  isLoading = true;

  // Search and filters
  searchQuery = '';
  filtroAerolinea = 'todas';

  // View management
  currentView: 'table' | 'cards' | 'list' = 'table';

  // Estadísticas
  totalViajeroFrecuente = 0;

  // Math object for template use
  Math = Math;

  // Variables para selección múltiple
  selectedItems: number[] = [];
  allSelected: boolean = false;
  someSelected: boolean = false;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Action menus
  showActionMenu: number | null = null;
  showActionMenuCards: number | null = null;
  showActionMenuList: number | null = null;

  // Sorting
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Statistics
  estadisticas = {
    totalViajerosActivos: 0,
    aerolineasPopulares: 0
  };

  // Modal states
  mostrarModalEliminar = false;
  viajeroFrecuenteAEliminar: ViajeroFrecuenteResponse | null = null;
  mostrarModalEliminarMultiple = false;
  mostrarModalDetalles = false;
  viajeroFrecuenteDetalles: ViajeroFrecuenteResponse | null = null;
  mostrarModalCrearViajeroFrecuente = false;
  editandoViajeroFrecuente: ViajeroFrecuenteResponse | null = null;
  isSubmitting = false;

  // Form
  viajeroFrecuenteForm: FormGroup;

  // Viajero search
  viajeroSearchQuery = '';
  viajerosFiltrados: ViajeroResponse[] = [];
  selectedViajero: ViajeroResponse | null = null;
  showViajeroDropdown = false;

  constructor(
    private viajeroFrecuenteService: ViajeroFrecuenteService,
    private viajeroService: ViajeroService,
    private router: Router,
    private formBuilder: FormBuilder
  ) {
    this.viajeroFrecuenteForm = this.createViajeroFrecuenteForm();
  }

  ngOnInit(): void {
    this.loadViajerosFrecuentes();
    this.loadViajeros();
    this.calcularEstadisticas();
  }

  // Form methods
  private createViajeroFrecuenteForm(): FormGroup {
    return this.formBuilder.group({
      viajeroId: ['', Validators.required],
      areolinea: ['', [Validators.required, Validators.minLength(2)]],
      codigo: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  // Load data methods
  loadViajerosFrecuentes(): void {
    this.isLoading = true;

    // Para obtener todos los viajeros frecuentes, necesitamos iterar por cada viajero
    this.viajeroService.findAll().subscribe({
      next: (viajeros) => {
        this.viajeros = viajeros;

        // Obtener viajeros frecuentes para cada viajero
        let allViajerosFrecuentes: ViajeroFrecuenteResponse[] = [];
        let completedRequests = 0;

        if (viajeros.length === 0) {
          this.viajerosFrecuentes = [];
          this.viajerosFrecuentesFiltrados = [];
          this.isLoading = false;
          this.calculateStatistics();
          return;
        }

        viajeros.forEach(viajero => {
          this.viajeroFrecuenteService.listarPorViajero(viajero.id).subscribe({
            next: (viajerosF) => {
              allViajerosFrecuentes = [...allViajerosFrecuentes, ...viajerosF];
              completedRequests++;

              if (completedRequests === viajeros.length) {
                this.viajerosFrecuentes = allViajerosFrecuentes;
                this.viajerosFrecuentesFiltrados = [...this.viajerosFrecuentes];
                this.isLoading = false;
                this.calculateStatistics();
              }
            },
            error: (error) => {
              completedRequests++;

              if (completedRequests === viajeros.length) {
                this.viajerosFrecuentes = allViajerosFrecuentes;
                this.viajerosFrecuentesFiltrados = [...this.viajerosFrecuentes];
                this.isLoading = false;
                this.calculateStatistics();
              }
            }
          });
        });
      },
      error: (error) => {
        console.error('VIAJEROS FRECUENTES: Error al cargar viajeros:', error);
        this.isLoading = false;
      }
    });
  }

  loadViajeros(): void {
    this.viajeroService.findAll().subscribe({
      next: (viajeros) => {
        this.viajeros = viajeros;
      },
      error: (error) => {
        console.error('Error al cargar viajeros:', error);
      }
    });
  }

  // Statistics
  calculateStatistics(): void {
    this.estadisticas.totalViajerosActivos = this.viajerosFrecuentes.length;

    // Contar aerolíneas únicas
    const aerolineasUnicas = new Set(this.viajerosFrecuentes.map(vf => vf.areolinea));
    this.estadisticas.aerolineasPopulares = aerolineasUnicas.size;
  }

  // Search and filter methods
  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.viajerosFrecuentes];

    // Aplicar búsqueda
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(vf =>
        vf.codigo.toLowerCase().includes(query) ||
        vf.areolinea.toLowerCase().includes(query) ||
        vf.viajero.nombres.toLowerCase().includes(query) ||
        vf.viajero.apellidoPaterno.toLowerCase().includes(query) ||
        vf.viajero.apellidoMaterno.toLowerCase().includes(query)
      );
    }

    // Aplicar filtro de aerolínea
    if (this.filtroAerolinea !== 'todas') {
      filtered = filtered.filter(vf => vf.areolinea === this.filtroAerolinea);
    }

    this.viajerosFrecuentesFiltrados = filtered;
  }

  // View management
  setView(view: 'table' | 'cards' | 'list'): void {
    this.currentView = view;
    this.closeAllMenus();
  }

  // Selection management
  toggleSelection(id: number): void {
    const index = this.selectedItems.indexOf(id);
    if (index > -1) {
      this.selectedItems.splice(index, 1);
    } else {
      this.selectedItems.push(id);
    }
  }

  toggleAllSelection(): void {
    if (this.selectedItems.length === this.viajerosFrecuentesFiltrados.length) {
      this.selectedItems = [];
    } else {
      this.selectedItems = this.viajerosFrecuentesFiltrados.map(vf => vf.id);
    }
  }

  isSelected(id: number): boolean {
    return this.selectedItems.includes(id);
  }

  // Action menu management
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('[data-action-menu]')) {
      this.closeAllMenus();
    }
  }

  toggleActionMenu(event: Event, id: number, menuType: 'table' | 'cards' | 'list'): void {
    event.stopPropagation();

    this.closeAllMenus();

    setTimeout(() => {
      if (menuType === 'table') {
        this.showActionMenu = this.showActionMenu === id ? null : id;
      } else if (menuType === 'cards') {
        this.showActionMenuCards = this.showActionMenuCards === id ? null : id;
      } else if (menuType === 'list') {
        this.showActionMenuList = this.showActionMenuList === id ? null : id;
      }
    }, 10);
  }

  closeAllMenus(): void {
    this.showActionMenu = null;
    this.showActionMenuCards = null;
    this.showActionMenuList = null;
  }

  // CRUD Actions
  verViajeroFrecuente(viajeroFrecuente: ViajeroFrecuenteResponse): void {
    this.viajeroFrecuenteDetalles = viajeroFrecuente;
    this.mostrarModalDetalles = true;
    this.closeAllMenus();
  }

  editarViajeroFrecuente(viajeroFrecuente: ViajeroFrecuenteResponse): void {
    this.editandoViajeroFrecuente = viajeroFrecuente;
    this.populateFormWithViajeroFrecuente(viajeroFrecuente);
    this.mostrarModalCrearViajeroFrecuente = true;
    this.closeAllMenus();
  }

  confirmarEliminar(viajeroFrecuente: ViajeroFrecuenteResponse): void {
    this.viajeroFrecuenteAEliminar = viajeroFrecuente;
    this.mostrarModalEliminar = true;
    this.closeAllMenus();
  }

  confirmarEliminacionModal(): void {
    if (this.viajeroFrecuenteAEliminar) {
      this.viajeroFrecuenteService.eliminar(this.viajeroFrecuenteAEliminar.id).subscribe({
        next: () => {
          this.loadViajerosFrecuentes();
          this.cerrarModalEliminar();
        },
        error: (error) => {
          console.error('VIAJEROS FRECUENTES: Error al eliminar viajero frecuente:', error);
        }
      });
    }
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.viajeroFrecuenteAEliminar = null;
  }

  cerrarModalEliminarMultiple(): void {
    this.mostrarModalEliminarMultiple = false;
  }

  clearSelection(): void {
    this.selectedItems = [];
  }

  abrirModalCrearViajeroFrecuente(): void {
    this.editandoViajeroFrecuente = null;
    this.viajeroFrecuenteForm.reset();
    this.clearViajeroSearch();
    this.mostrarModalCrearViajeroFrecuente = true;
  }

  // Sorting
  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.viajerosFrecuentesFiltrados.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (column) {
        case 'codigo':
          valueA = a.codigo;
          valueB = b.codigo;
          break;
        case 'areolinea':
          valueA = a.areolinea;
          valueB = b.areolinea;
          break;
        case 'viajero':
          valueA = `${a.viajero.nombres} ${a.viajero.apellidoPaterno}`;
          valueB = `${b.viajero.nombres} ${b.viajero.apellidoPaterno}`;
          break;
        case 'fechaCreacion':
          valueA = new Date(a.creado);
          valueB = new Date(b.creado);
          break;
        default:
          return 0;
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

  // Sidebar
  onSidebarToggle(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onSidebarItemClick(item: SidebarMenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  onMenuItemClick(item: SidebarMenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  // Bulk operations
  editarSeleccionados(): void {
    if (this.selectedItems.length === 0) return;

    if (this.selectedItems.length === 1) {
      // Si solo hay uno seleccionado, abrir editor individual
      const viajeroFrecuente = this.viajerosFrecuentes.find(vf => vf.id === this.selectedItems[0]);
      if (viajeroFrecuente) {
        this.editarViajeroFrecuente(viajeroFrecuente);
      }
    } else {
      // Para múltiples elementos, mostrar mensaje que solo se puede editar uno a la vez
      alert('Solo se puede editar un viajero frecuente a la vez. Por favor, selecciona solo uno para editar.');
    }
  }

  eliminarSeleccionados(): void {
    if (this.selectedItems.length === 0) return;

    // Mostrar modal de confirmación múltiple
    this.mostrarModalEliminarMultiple = true;
  }

  // Método para eliminar múltiples viajeros frecuentes desde el modal
  confirmarEliminacionMultiple(): void {
    if (this.selectedItems.length === 0) return;

    this.isLoading = true;
    let eliminados = 0;
    const total = this.selectedItems.length;

    this.selectedItems.forEach(id => {
      this.viajeroFrecuenteService.eliminar(id).subscribe({
        next: () => {
          eliminados++;
          if (eliminados === total) {
            this.loadViajerosFrecuentes();
            this.clearSelection();
            this.isLoading = false;
            this.cerrarModalEliminarMultiple();
          }
        },
        error: (error) => {
          eliminados++;
          if (eliminados === total) {
            this.loadViajerosFrecuentes();
            this.clearSelection();
            this.isLoading = false;
            this.cerrarModalEliminarMultiple();
          }
        }
      });
    });
  }

  exportarSeleccionados(): void {
    // Implementar exportación
  }

  // Refresh data
  refreshData(): void {
    this.loadViajerosFrecuentes();
  }

  // Método para poblar el formulario con datos del viajero frecuente
  populateFormWithViajeroFrecuente(viajeroFrecuente: ViajeroFrecuenteResponse): void {
    // Poblar con los valores del viajero frecuente
    this.viajeroFrecuenteForm.patchValue({
      viajeroId: viajeroFrecuente.viajero.id,
      areolinea: viajeroFrecuente.areolinea,
      codigo: viajeroFrecuente.codigo
    });

    // Para el modo edición, configurar el viajero seleccionado en el campo de búsqueda
    this.selectedViajero = viajeroFrecuente.viajero;
    this.viajeroSearchQuery = `${viajeroFrecuente.viajero.nombres} ${viajeroFrecuente.viajero.apellidoPaterno} ${viajeroFrecuente.viajero.apellidoMaterno}`;
  }

  // Método para cerrar modal de detalles
  cerrarModalDetalles(): void {
    this.mostrarModalDetalles = false;
    this.viajeroFrecuenteDetalles = null;
  }

  // Método para cerrar modal de crear/editar
  cerrarModalCrearViajeroFrecuente(): void {
    this.mostrarModalCrearViajeroFrecuente = false;
    this.editandoViajeroFrecuente = null;
    this.isSubmitting = false;
    // Solo resetear el formulario cuando se cierre el modal
    this.viajeroFrecuenteForm.reset();
    this.clearViajeroSearch();
  }

  // Método para manejar el envío del formulario
  onSubmitViajeroFrecuente(): void {

    if (this.viajeroFrecuenteForm.invalid) {
      Object.keys(this.viajeroFrecuenteForm.controls).forEach(key => {
        this.viajeroFrecuenteForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    const formData = this.viajeroFrecuenteForm.value;

    const viajeroFrecuenteRequest: ViajeroFrecuenteRequest = {
      areolinea: formData.areolinea,
      codigo: formData.codigo
    };

    if (this.editandoViajeroFrecuente) {
      // Actualizar viajero frecuente existente

      this.viajeroFrecuenteService.actualizar(this.editandoViajeroFrecuente.id, viajeroFrecuenteRequest).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.cerrarModalCrearViajeroFrecuente();
          this.loadViajerosFrecuentes();
          // Aquí podrías agregar una notificación de éxito
        },
        error: (error) => {
          console.error('VIAJEROS FRECUENTES: Error al actualizar viajero frecuente:', error);
          this.isSubmitting = false;
          // Aquí podrías agregar una notificación de error
        }
      });
    } else {
      // Crear nuevo viajero frecuente

      this.viajeroFrecuenteService.crear(formData.viajeroId, viajeroFrecuenteRequest).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.cerrarModalCrearViajeroFrecuente();
          this.loadViajerosFrecuentes();
          // Aquí podrías agregar una notificación de éxito
        },
        error: (error) => {
          this.isSubmitting = false;
          // Aquí podrías agregar una notificación de error
        }
      });
    }
  }

  // Método para obtener aerolíneas únicas para el filtro
  getAerolineasUnicas(): string[] {
    const aerolineas = this.viajerosFrecuentes.map(vf => vf.areolinea);
    return [...new Set(aerolineas)].sort();
  }

  // Método para obtener el conteo de una aerolínea específica
  getAerolineaCount(aerolinea: string): number {
    return this.viajerosFrecuentes.filter(vf => vf.areolinea === aerolinea).length;
  }

  // Viajero search methods
  onViajeroSearchChange(): void {
    if (!this.viajeros || this.viajeros.length === 0) {
      this.viajerosFiltrados = [];
      this.showViajeroDropdown = false;
      return;
    }

    const query = this.viajeroSearchQuery?.toLowerCase().trim() || '';

    if (query === '') {
      // Sin búsqueda: mostrar los primeros 10
      this.viajerosFiltrados = this.viajeros.slice(0, 10);
    } else {
      // Con búsqueda: filtrar los que coincidan
      this.viajerosFiltrados = this.viajeros.filter((viajero: ViajeroResponse) => {
        const nombreCompleto = `${viajero.nombres} ${viajero.apellidoPaterno} ${viajero.apellidoMaterno}`.toLowerCase();

        return nombreCompleto.includes(query)
      }).slice(0, 10);
    }

    this.showViajeroDropdown = true;
  }

  // TEST METHOD - Asignar datos falsos para probar
  testSearchMethod(): void {
    this.viajerosFiltrados = [
      { id: 1, nombres: 'TEST', apellidoPaterno: 'USER', apellidoMaterno: 'FAKE' } as any
    ];
    this.showViajeroDropdown = true;
  }

  selectViajero(viajero: ViajeroResponse): void {
    this.selectedViajero = viajero;
    this.viajeroSearchQuery = `${viajero.nombres} ${viajero.apellidoPaterno} ${viajero.apellidoMaterno}`;
    this.viajeroFrecuenteForm.patchValue({ viajeroId: viajero.id });
    this.showViajeroDropdown = false;
  }

  clearViajeroSearch(): void {
    this.viajeroSearchQuery = '';
    this.selectedViajero = null;
    this.viajeroFrecuenteForm.patchValue({ viajeroId: '' });
    this.onViajeroSearchChange(); // Esto manejará mostrar las opciones iniciales
  }

  closeViajeroDropdown(): void {
    this.showViajeroDropdown = false;
  }

  onViajeroInputFocus(): void {
    // Simplemente ejecutar la búsqueda (que maneja tanto caso vacío como con texto)
    this.onViajeroSearchChange();
  }

  onViajeroInputBlur(): void {
    // Delay para permitir clicks en el dropdown
    setTimeout(() => {
      this.showViajeroDropdown = false;
    }, 200);
  }

  // TrackBy function para mejorar performance
  trackByFn(index: number, item: ViajeroFrecuenteResponse): number {
    return item.id;
  }

  trackByViajero(index: number, item: ViajeroResponse): number {
    return item.id;
  }

  // Método para resaltar texto que coincide con la búsqueda
  highlightSearchText(text: string, searchQuery: string): string {
    if (!searchQuery.trim()) return text;

    const regex = new RegExp(`(${searchQuery.trim()})`, 'gi');
    return text.replace(regex, '<strong class="bg-yellow-200 text-yellow-800">$1</strong>');
  }

  get totalPages(): number {
    const itemsPerPageNum = Number(this.itemsPerPage);
    return Math.ceil(this.totalItems / itemsPerPageNum);
  }

  // Estadísticas
  calcularEstadisticas(): void {
    this.totalViajeroFrecuente = this.viajerosFrecuentes.length;
  }

  onItemsPerPageChange(): void {
    this.itemsPerPage = Number(this.itemsPerPage);
    this.currentPage = 1;
    this.calcularEstadisticas();
  }

  // Método para actualizar datos paginados
  updatePaginatedData(): void {
    this.calcularEstadisticas();
  }

  // Métodos para paginación (remover el getter duplicado)
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
}
