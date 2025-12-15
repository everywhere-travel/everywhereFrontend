import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CarpetaService } from '../../core/service/Carpeta/carpeta.service';
import { CarpetaRequest, CarpetaResponse } from '../../shared/models/Carpeta/carpeta.model';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';

// Interface para la tabla de carpetas
export interface CarpetaTabla {
  id: number;
  nombre: string;
  descripcion: string;
  nivel: number;
  carpetaPadreId?: number;
  creado: string;
  actualizado: string;
  esEspecial?: boolean; // Para determinar si tiene borde rojo
}

// Interfaces para el explorador dual
interface TreeNode {
  carpeta: CarpetaResponse;
  expanded: boolean;
  loading: boolean;
  children: TreeNode[];
  hasChildren: boolean;
  level: number;
}

interface BreadcrumbItem {
  carpeta: CarpetaResponse;
  label: string;
}

// Tipos de vista del explorador
type ViewMode = 'breadcrumb' | 'tree';

@Component({
  selector: 'app-carpetas',
  standalone: true,
  templateUrl: './carpetas.component.html',
  styleUrls: ['./carpetas.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SidebarComponent
  ]
})
export class CarpetasComponent implements OnInit {

  // Sidebar
  sidebarCollapsed = false; 
  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];

  // Data - Modo tradicional
  carpetas: CarpetaResponse[] = [];
  carpetasTabla: CarpetaTabla[] = [];
  filteredCarpetas: CarpetaTabla[] = [];
  carpetaActual: CarpetaResponse | null = null;
  caminoBreadcrumb: CarpetaResponse[] = [];

  // Data - Explorador dual
  currentViewMode: ViewMode = 'breadcrumb'; // Por defecto vista navegación

  // Para vista breadcrumb (Modo 1)
  carpetasEnNivelActual: CarpetaResponse[] = [];
  breadcrumbPath: BreadcrumbItem[] = [];
  breadcrumbLoading = false;

  // Para vista de árbol (Modo 2)
  treeNodes: TreeNode[] = [];
  selectedTreeNode: TreeNode | null = null;
  treeLoading = false;

  // Forms
  carpetaForm!: FormGroup;

  // Control variables
  loading = false;
  mostrarModalCrear = false;
  mostrarModalEliminar = false;
  editandoCarpeta = false;
  carpetaSeleccionada: CarpetaResponse | null = null;
  carpetaAEliminar: CarpetaResponse | null = null;

  searchTerm = '';

  // Action menu control
  showActionMenu: number | null = null;
  showQuickActions: number | null = null;

  // Math object for template use
  Math = Math;

  constructor(
    private fb: FormBuilder,
    private carpetaService: CarpetaService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private menuConfigService: MenuConfigService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.sidebarMenuItems = this.menuConfigService.getMenuItems('/carpetas');
    this.inicializarVistaDual();
  }

  // =================================================================
  // SIDEBAR EVENTS
  // =================================================================

  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onSidebarItemClick(item: ExtendedSidebarMenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  // =================================================================
  // INICIALIZACIÓN DUAL
  // =================================================================

  private async inicializarVistaDual(): Promise<void> {
    this.loading = true;
    try {
      // Cargar vista tradicional (compatibilidad)
      this.cargarRaices();

      // Cargar vista breadcrumb (raíces)
      await this.cargarNivelRaiz();

      // Cargar vista de árbol
      await this.cargarArbolRaices();

    } catch (error) {
      console.error('Error al inicializar vista dual:', error);
      this.mostrarError('Error al cargar carpetas');
    } finally {
      this.loading = false;
    }
  }

  private initializeForms(): void {
    this.carpetaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      descripcion: ['']
    });
  }

  // NAVEGACIÓN DE CARPETAS
  cargarRaices(): void {
    this.loading = true;
    this.carpetaService.findRaicesCarpeta().subscribe({
      next: (carpetas) => {
        this.carpetas = carpetas;
        this.carpetaActual = null;
        this.caminoBreadcrumb = [];
        this.convertirATabla();
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar carpetas raíz:', error);
        this.loading = false;
      }
    });
  }

  navegarACarpeta(carpeta: CarpetaTabla | CarpetaResponse): void {
    this.loading = true;

    // Obtener el ID de la carpeta
    const carpetaId = carpeta.id;

    // Actualizar camino de navegación
    this.carpetaService.findCaminoCarpeta(carpetaId).subscribe({
      next: (camino) => {
        this.caminoBreadcrumb = camino;
        this.carpetaActual = camino[camino.length - 1] || null;

        // Cargar hijos de la carpeta
        this.carpetaService.findHijosCarpeta(carpetaId).subscribe({
          next: (carpetas) => {
            this.carpetas = carpetas;
            this.convertirATabla();
            this.applyFilters();
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: (error) => {
            console.error('Error al cargar carpetas hijas:', error);
            this.loading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error al cargar camino:', error);
        this.loading = false;
      }
    });
  }

  navegarAtras(): void {
    if (this.caminoBreadcrumb.length <= 1) {
      this.cargarRaices();
    } else {
      const carpetaPadre = this.caminoBreadcrumb[this.caminoBreadcrumb.length - 2];
      this.navegarACarpeta({
        id: carpetaPadre.id,
        nombre: carpetaPadre.nombre || '',
        descripcion: carpetaPadre.descripcion || '',
        nivel: carpetaPadre.nivel,
        carpetaPadreId: carpetaPadre.carpetaPadreId,
        creado: carpetaPadre.creado,
        actualizado: carpetaPadre.actualizado
      });
    }
  }

  navegarBreadcrumb(carpeta: CarpetaResponse, index: number): void {
    if (index === 0) {
      this.cargarRaices();
    } else {
      this.navegarACarpeta({
        id: carpeta.id,
        nombre: carpeta.nombre || '',
        descripcion: carpeta.descripcion || '',
        nivel: carpeta.nivel,
        carpetaPadreId: carpeta.carpetaPadreId,
        creado: carpeta.creado,
        actualizado: carpeta.actualizado
      });
    }
  }

  // =================================================================
  // NAVEGACIÓN BREADCRUMB (MODO 1)
  // =================================================================

  async cargarNivelRaiz(): Promise<void> {
    this.breadcrumbLoading = true;
    try {
      this.carpetasEnNivelActual = await this.carpetaService.findRaicesCarpeta().toPromise() || [];
      this.carpetaActual = null;
      this.breadcrumbPath = [{
        carpeta: { id: 0, nombre: 'Raíz', nivel: -1 } as CarpetaResponse,
        label: 'Raíz'
      }];
      this.aplicarFiltrosBreadcrumb();
    } catch (error) {
      console.error('Error al cargar nivel raíz:', error);
      this.mostrarError('Error al cargar carpetas raíz');
    } finally {
      this.breadcrumbLoading = false;
    }
  }

  async navegarACarpetaDual(carpeta: CarpetaResponse): Promise<void> {
    if (this.currentViewMode === 'tree') {
      // En modo árbol, expandir/contraer
      const node = this.encontrarNodoEnArbol(carpeta.id);
      if (node) {
        await this.toggleNodeExpansion(node);
      }
      return;
    }

    // Modo breadcrumb: navegar al contenido
    this.breadcrumbLoading = true;
    try {
      // Cargar hijos de la carpeta
      const hijos = await this.carpetaService.findHijosCarpeta(carpeta.id).toPromise() || [];

      // Cargar camino actualizado
      const camino = await this.carpetaService.findCaminoCarpeta(carpeta.id).toPromise() || [];

      // Actualizar estado
      this.carpetasEnNivelActual = hijos;
      this.carpetaActual = carpeta;

      // Construir breadcrumb path
      this.breadcrumbPath = [
        { carpeta: { id: 0, nombre: 'Raíz', nivel: -1 } as CarpetaResponse, label: 'Raíz' }
      ];

      camino.forEach(c => {
        this.breadcrumbPath.push({ carpeta: c, label: c.nombre || 'Sin nombre' });
      });

      this.aplicarFiltrosBreadcrumb();

    } catch (error) {
      console.error('Error al navegar a carpeta:', error);
      this.mostrarError('Error al cargar contenido de la carpeta');
    } finally {
      this.breadcrumbLoading = false;
    }
  }

  async navegarPorBreadcrumb(item: BreadcrumbItem, index: number): Promise<void> {
    if (index === 0) {
      // Navegar a raíz
      await this.cargarNivelRaiz();
    } else {
      // Navegar a carpeta específica
      await this.navegarACarpetaDual(item.carpeta);
    }
  }

  async navegarAtrasDual(): Promise<void> {
    if (this.breadcrumbPath.length > 1) {
      const penultimoItem = this.breadcrumbPath[this.breadcrumbPath.length - 2];
      await this.navegarPorBreadcrumb(penultimoItem, this.breadcrumbPath.length - 2);
    }
  }

  // =================================================================
  // NAVEGACIÓN ÁRBOL (MODO 2)
  // =================================================================

  async cargarArbolRaices(): Promise<void> {
    this.treeLoading = true;
    try {
      const raices = await this.carpetaService.findRaicesCarpeta().toPromise() || [];

      this.treeNodes = raices.map(carpeta => ({
        carpeta,
        expanded: false,
        loading: false,
        children: [],
        hasChildren: true, // Asumimos que pueden tener hijos hasta verificar
        level: 0
      }));

    } catch (error) {
      console.error('Error al cargar árbol:', error);
      this.mostrarError('Error al cargar estructura de carpetas');
    } finally {
      this.treeLoading = false;
    }
  }

  async toggleNodeExpansion(node: TreeNode): Promise<void> {
    if (node.expanded) {
      // Contraer nodo
      node.expanded = false;
      node.children = [];
    } else {
      // Expandir nodo
      node.loading = true;
      try {
        const hijos = await this.carpetaService.findHijosCarpeta(node.carpeta.id).toPromise() || [];

        node.children = hijos.map(carpeta => ({
          carpeta,
          expanded: false,
          loading: false,
          children: [],
          hasChildren: true,
          level: node.level + 1
        }));

        node.expanded = true;
        node.hasChildren = hijos.length > 0;

      } catch (error) {
        console.error('Error al cargar hijos:', error);
        this.mostrarError('Error al cargar subcarpetas');
      } finally {
        node.loading = false;
      }
    }
  }

  encontrarNodoEnArbol(carpetaId: number): TreeNode | null {
    const buscarEnNodos = (nodos: TreeNode[]): TreeNode | null => {
      for (const nodo of nodos) {
        if (nodo.carpeta.id === carpetaId) {
          return nodo;
        }
        if (nodo.children.length > 0) {
          const encontrado = buscarEnNodos(nodo.children);
          if (encontrado) return encontrado;
        }
      }
      return null;
    };

    return buscarEnNodos(this.treeNodes);
  }

  seleccionarNodoArbol(node: TreeNode): void {
    this.selectedTreeNode = node;

    // En vista árbol solo selecciona, no navega
    // En vista breadcrumb navega
    if (this.currentViewMode === 'breadcrumb') {
      this.navegarACarpeta(node.carpeta);
    }
  }

  // =================================================================
  // GESTIÓN DE MODOS DE VISTA
  // =================================================================

  cambiarModoVista(modo: ViewMode): void {
    this.currentViewMode = modo;

    // Recargar datos según el modo
    if (modo === 'tree' && this.treeNodes.length === 0) {
      this.cargarArbolRaices();
    } else if (modo === 'breadcrumb' && this.carpetasEnNivelActual.length === 0) {
      this.cargarNivelRaiz();
    }
  }

  // =================================================================
  // BÚSQUEDA Y FILTROS DUAL
  // =================================================================

  private aplicarFiltrosBreadcrumb(): void {
    // Este método se usará en el template para filtrar carpetas en vista breadcrumb
    // Por ahora mantiene compatibilidad con el sistema existente
  }

  /**
   * Convierte CarpetaResponse a CarpetaTabla con valores seguros
   * Soluciona el error TS2345 de tipos incompatibles
   */
  private convertirCarpetaResponse(carpeta: CarpetaResponse): CarpetaTabla {
    return {
      id: carpeta.id,
      nombre: carpeta.nombre || 'Sin nombre',
      descripcion: carpeta.descripcion || 'Sin descripción',
      nivel: carpeta.nivel,
      carpetaPadreId: carpeta.carpetaPadreId,
      creado: carpeta.creado,
      actualizado: carpeta.actualizado,
      esEspecial: this.esEspecial(carpeta)
    };
  }

  private convertirATabla(): void {
    this.carpetasTabla = this.carpetas.map(carpeta => this.convertirCarpetaResponse(carpeta));
  }

  private esEspecial(carpeta: CarpetaResponse): boolean {
    // Lógica para determinar si una carpeta debe tener borde rojo
    // Por ejemplo: carpetas de nivel 0 (raíces) o con nombres específicos
    return carpeta.nivel === 0 ||
           !!(carpeta.nombre && ['Importante', 'Urgente', 'Confidencial'].includes(carpeta.nombre));
  }

  // CRUD Operations
  crearCarpeta(): void {
    if (this.carpetaForm.valid) {
      this.loading = true;
      const carpetaRequest: CarpetaRequest = this.carpetaForm.value;
      const carpetaPadreId = this.carpetaActual?.id;

      this.carpetaService.createCarpeta(carpetaRequest, carpetaPadreId).subscribe({
        next: (response) => {
          this.recargarCarpetaActual();
          this.cerrarModal();
          this.loading = false;
          this.mostrarExito(`Carpeta "${carpetaRequest.nombre}" creada exitosamente`);
        },
        error: (error) => {
          console.error('Error al crear carpeta:', error);
          this.mostrarError('Error al crear la carpeta');
          this.loading = false;
        }
      });
    }
  }

  editarCarpeta(carpeta: CarpetaTabla | CarpetaResponse): void {
    let carpetaCompleta: CarpetaResponse;

    // Si es CarpetaTabla, buscar la CarpetaResponse correspondiente
    if ('esEspecial' in carpeta) {
      const found = this.carpetas.find(c => c.id === carpeta.id);
      if (!found) return;
      carpetaCompleta = found;
    } else {
      // Ya es CarpetaResponse
      carpetaCompleta = carpeta;
    }

    this.editandoCarpeta = true;
    this.carpetaSeleccionada = carpetaCompleta;

    this.carpetaForm.patchValue({
      nombre: carpetaCompleta.nombre || 'Sin nombre',
      descripcion: carpetaCompleta.descripcion || 'Sin descripción'
    });

    this.mostrarModalCrear = true;
  }

  actualizarCarpeta(): void {
    if (this.carpetaForm.valid && this.carpetaSeleccionada) {
      this.loading = true;
      const carpetaRequest: CarpetaRequest = this.carpetaForm.value;

      this.carpetaService.updateCarpeta(this.carpetaSeleccionada.id, carpetaRequest).subscribe({
        next: (response) => {
          this.recargarCarpetaActual();
          this.cerrarModal();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al actualizar carpeta:', error);
          this.loading = false;
        }
      });
    }
  }

  confirmarEliminar(carpeta: CarpetaTabla | CarpetaResponse): void {
    let carpetaCompleta: CarpetaResponse;

    // Si es CarpetaTabla, buscar la CarpetaResponse correspondiente
    if ('esEspecial' in carpeta) {
      const found = this.carpetas.find(c => c.id === carpeta.id);
      if (!found) return;
      carpetaCompleta = found;
    } else {
      // Ya es CarpetaResponse
      carpetaCompleta = carpeta;
    }

    this.carpetaAEliminar = carpetaCompleta;
    this.mostrarModalEliminar = true;
  }

  eliminarCarpetaDefinitivo(): void {
    if (this.carpetaAEliminar) {
      this.loading = true;
      this.carpetaService.deleteByIdCarpeta(this.carpetaAEliminar.id).subscribe({
        next: () => {
          this.recargarCarpetaActual();
          this.cerrarModalEliminar();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al eliminar carpeta:', error);
          this.loading = false;
          this.cerrarModalEliminar();
        }
      });
    }
  }

  private recargarCarpetaActual(): void {
    if (this.currentViewMode === 'breadcrumb') {
      // En vista navegación, recargar el nivel actual
      this.recargarNivelActualBreadcrumb();
    } else if (this.carpetaActual) {
      // Para otras vistas, usar navegación normal
      this.navegarACarpeta({
        id: this.carpetaActual.id,
        nombre: this.carpetaActual.nombre || '',
        descripcion: this.carpetaActual.descripcion || '',
        nivel: this.carpetaActual.nivel,
        carpetaPadreId: this.carpetaActual.carpetaPadreId,
        creado: this.carpetaActual.creado,
        actualizado: this.carpetaActual.actualizado
      });
    } else {
      this.cargarRaices();
    }

    // Si estamos en vista árbol, actualizar también el árbol conservando expansiones
    if (this.currentViewMode === 'tree') {
      this.actualizarArbolConservandoEstado();
    }
  }

  private async recargarNivelActualBreadcrumb(): Promise<void> {
    this.breadcrumbLoading = true;
    try {
      if (this.carpetaActual) {
        // Recargar hijos de la carpeta actual
        const hijos = await this.carpetaService.findHijosCarpeta(this.carpetaActual.id).toPromise() || [];
        this.carpetasEnNivelActual = hijos;
      } else {
        // Estamos en la raíz, recargar raíces
        this.carpetasEnNivelActual = await this.carpetaService.findRaicesCarpeta().toPromise() || [];
      }
      this.aplicarFiltrosBreadcrumb();
    } catch (error) {
      console.error('Error al recargar nivel actual:', error);
      this.mostrarError('Error al actualizar la vista');
    } finally {
      this.breadcrumbLoading = false;
    }
  }

  /**
   * Actualiza el árbol conservando el estado de expansión
   */
  private actualizarArbolConservandoEstado(): void {
    // Guardar IDs de nodos expandidos
    const nodosExpandidos = this.obtenerNodosExpandidos(this.treeNodes);

    // Recargar el árbol
    this.cargarArbolRaices().then(() => {
      // Restaurar expansiones
      this.restaurarExpansiones(this.treeNodes, nodosExpandidos);
    });
  }

  /**
   * Obtiene recursivamente los IDs de todos los nodos expandidos
   */
  private obtenerNodosExpandidos(nodes: TreeNode[]): number[] {
    const expandidos: number[] = [];

    for (const node of nodes) {
      if (node.expanded) {
        expandidos.push(node.carpeta.id);
        // Recursivamente obtener hijos expandidos
        expandidos.push(...this.obtenerNodosExpandidos(node.children));
      }
    }

    return expandidos;
  }

  /**
   * Restaura recursivamente las expansiones de los nodos
   */
  private async restaurarExpansiones(nodes: TreeNode[], nodosExpandidos: number[]): Promise<void> {
    for (const node of nodes) {
      if (nodosExpandidos.includes(node.carpeta.id)) {
        // Expandir el nodo
        await this.expandirNodo(node);

        // Recursivamente restaurar hijos
        if (node.children.length > 0) {
          await this.restaurarExpansiones(node.children, nodosExpandidos);
        }
      }
    }
  }

  /**
   * Expande un nodo específico cargando sus hijos
   */
  private async expandirNodo(node: TreeNode): Promise<void> {
    if (node.expanded || node.loading) return;

    node.loading = true;

    try {
      const hijos = await this.carpetaService.findHijosCarpeta(node.carpeta.id).toPromise() || [];

      node.children = hijos.map(carpeta => ({
        carpeta,
        expanded: false,
        loading: false,
        children: [],
        hasChildren: true,
        level: node.level + 1
      }));

      node.expanded = true;
      node.hasChildren = hijos.length > 0;

    } catch (error) {
      console.error('Error al cargar hijos del nodo:', error);
    } finally {
      node.loading = false;
    }
  }

  // Modal management
  abrirModalCrear(): void {
    this.editandoCarpeta = false;
    this.carpetaSeleccionada = null;
    this.carpetaForm.reset();
    this.mostrarModalCrear = true;
  }

  cerrarModal(): void {
    this.mostrarModalCrear = false;
    this.editandoCarpeta = false;
    this.carpetaSeleccionada = null;
    this.carpetaForm.reset();
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.carpetaAEliminar = null;
  }

  // Método principal para guardar (crea o actualiza según el estado)
  guardarCarpeta(): void {
    if (this.editandoCarpeta) {
      this.actualizarCarpeta();
    } else {
      this.crearCarpeta();
    }
  }

  // Search and filter
  applyFilters(): void {
    let filtered = [...this.carpetasTabla];

    // Filtro por búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(carpeta => {
        const searchableText = `${carpeta.nombre} ${carpeta.descripcion}`.toLowerCase();
        return searchableText.includes(term);
      });
    }

    this.filteredCarpetas = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  // Action menus
  toggleActionMenu(carpetaId: number, event: Event): void {
    event.stopPropagation();
    this.showActionMenu = this.showActionMenu === carpetaId ? null : carpetaId;
    this.showQuickActions = null;
  }

  // Utilities
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

  // Listener para cerrar menus al hacer click fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.action-menu-container')) {
      this.showActionMenu = null;
      this.showQuickActions = null;
    }
  }

  // Estadísticas
  getTotalCarpetasCount(): number {
    return this.carpetas.length;
  }

  getNivelActual(): number {
    return this.carpetaActual?.nivel || 0;
  }

  // =================================================================
  // UTILIDADES Y HELPERS DUAL
  // =================================================================

  getTreeIndentClass(nivel: number): string {
    return `pl-${Math.min(nivel * 4, 20)}`;
  }

  getCarpetaIcon(carpeta: CarpetaResponse): string {
    // Determinar ícono basado en propiedades de la carpeta
    if (carpeta.nivel === 0) return 'fas fa-home';
    return 'fas fa-folder';
  }

  // =================================================================
  // MÉTODOS ADICIONALES
  // =================================================================

  /**
   * Actualiza la vista de navegación breadcrumb
   */
  actualizarVistaNavegacion(): void {
    if (this.breadcrumbLoading) return;

    if (this.currentViewMode === 'breadcrumb') {
      // Usar el nuevo método para recargar el nivel actual
      this.recargarNivelActualBreadcrumb();
    } else if (this.currentViewMode === 'tree') {
      // Actualizar árbol conservando estado de expansión
      this.actualizarArbolConservandoEstado();
    }
  }

  /**
   * Crea una nueva carpeta dentro de la carpeta especificada
   */
  crearCarpetaEn(carpetaPadre: CarpetaResponse): void {
    // Establecer la carpeta padre como contexto para la creación
    this.carpetaActual = carpetaPadre;

    // Abrir modal de crear carpeta
    this.editandoCarpeta = false;
    this.carpetaSeleccionada = null;

    // Limpiar el formulario
    this.carpetaForm.reset();
    this.carpetaForm.patchValue({
      nombre: '',
      descripcion: ''
    });

    this.mostrarModalCrear = true;
  }

  // =================================================================
  // NOTIFICACIONES
  // =================================================================

  private mostrarExito(mensaje: string): void {
    // Simulación de notificación exitosa
    console.log('Éxito:', mensaje);
    // Aquí podrías integrar una librería de notificaciones como Toastr o SweetAlert2
  }

  private mostrarError(mensaje: string): void {
    // Simulación de notificación de error
    console.error('Error:', mensaje);
    // Aquí podrías integrar una librería de notificaciones como Toastr o SweetAlert2
  }
}
