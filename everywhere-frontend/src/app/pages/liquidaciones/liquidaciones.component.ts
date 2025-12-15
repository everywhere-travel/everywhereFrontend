import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subscription, of } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';

// Services
import { LiquidacionService } from '../../core/service/Liquidacion/liquidacion.service';
import { DetalleLiquidacionService } from '../../core/service/DetalleLiquidacion/detalle-liquidacion.service';
import { CotizacionService } from '../../core/service/Cotizacion/cotizacion.service';
import { DetalleCotizacionService } from '../../core/service/DetalleCotizacion/detalle-cotizacion.service';

import { PersonaService } from '../../core/service/persona/persona.service';
import { PersonaNaturalService } from '../../core/service/natural/persona-natural.service';
import { PersonaJuridicaService } from '../../core/service/juridica/persona-juridica.service';
import { FormaPagoService } from '../../core/service/FormaPago/forma-pago.service';
import { ProductoService } from '../../core/service/Producto/producto.service';
import { ProveedorService } from '../../core/service/Proveedor/proveedor.service';
import { OperadorService } from '../../core/service/Operador/operador.service';
import { ViajeroService } from '../../core/service/viajero/viajero.service';

// Models
import { LiquidacionRequest, LiquidacionResponse, LiquidacionConDetallesResponse } from '../../shared/models/Liquidacion/liquidacion.model';
import { DetalleLiquidacionRequest, DetalleLiquidacionResponse } from '../../shared/models/Liquidacion/detalleLiquidacion.model';
import { CotizacionResponse, CotizacionConDetallesResponseDTO } from '../../shared/models/Cotizacion/cotizacion.model';

import { PersonaNaturalResponse } from '../../shared/models/Persona/personaNatural.model';
import { PersonaJuridicaResponse } from '../../shared/models/Persona/personaJuridica.models';
import { FormaPagoResponse } from '../../shared/models/FormaPago/formaPago.model';
import { ProductoResponse } from '../../shared/models/Producto/producto.model';
import { ProveedorResponse } from '../../shared/models/Proveedor/proveedor.model';
import { OperadorResponse } from '../../shared/models/Operador/operador.model';
import { ViajeroConPersonaNatural, ViajeroResponse } from '../../shared/models/Viajero/viajero.model';

// Components
import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';

// Services
import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';

interface DetalleLiquidacionTemp {
  id?: number;
  proveedor?: ProveedorResponse | null;
  producto?: ProductoResponse;
  operador?: OperadorResponse;
  viajero?: ViajeroConPersonaNatural;
  ticket?: string;
  costoTicket?: number;
  cargoServicio?: number;
  valorVenta?: number;
  facturaCompra?: string;
  boletaPasajero?: string;
  montoDescuento?: number;
  pagoPaxUSD?: number;
  pagoPaxPEN?: number;
  isTemporary?: boolean;
}

@Component({
  selector: 'app-liquidaciones',
  standalone: true,
  templateUrl: './liquidaciones.component.html',
  styleUrls: ['./liquidaciones.component.css'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SidebarComponent, LucideAngularModule]
})
export class LiquidacionesComponent implements OnInit, OnDestroy {
  // ===== CACHE AND MAPPING =====
  personasCache: { [id: number]: any } = {};
  personasDisplayMap: { [id: number]: string } = {};

  // Services injection
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private liquidacionService = inject(LiquidacionService);
  private detalleLiquidacionService = inject(DetalleLiquidacionService);
  private cotizacionService = inject(CotizacionService);
  private detalleCotizacionService = inject(DetalleCotizacionService);
  private personaService = inject(PersonaService);
  private personaNaturalService = inject(PersonaNaturalService);
  private personaJuridicaService = inject(PersonaJuridicaService);
  private formaPagoService = inject(FormaPagoService);
  private productoService = inject(ProductoService);
  private proveedorService = inject(ProveedorService);
  private operadorService = inject(OperadorService);
  private viajeroService = inject(ViajeroService);
  private clienteSearchSubscription: Subscription | null = null;

  // ===== UI STATE =====
  isLoading = false;
  loading: boolean = false;
  mostrarModalCrear = false;
  mostrarFormulario = false;
  editandoLiquidacion = false;
  mostrarGestionGrupos = false;
  mostrarModalVer = false;
  mostrarModalCotizaciones = false;
  sidebarCollapsed = false;
  currentView: 'table' | 'cards' | 'list' = 'table';

  // ===== COTIZACIONES DATA =====
  cotizaciones: CotizacionResponse[] = [];
  cotizacionesFiltradas: CotizacionResponse[] = [];
  cotizacionSeleccionada: CotizacionResponse | null = null;
  searchCotizacion = '';

  // Estadísticas
  totalLiquidaciones = 0;

  // ===== MESSAGES =====
  errorMessage: string = '';
  successMessage: string = '';
  showErrorMessage: boolean = false;
  showSuccessMessage: boolean = false;

  // ===== SELECTION STATE =====
  liquidacionSeleccionada: LiquidacionConDetallesResponse | null = null;
  liquidacionCompleta: LiquidacionConDetallesResponse | null = null;
  liquidacionEditandoId: number | null = null;

  selectedItems: number[] = [];
  allSelected: boolean = false;
  someSelected: boolean = false;

  // ===== PAGINATION =====
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // ===== STATISTICS =====
  totalProductos = 0;

  // ===== TEMPLATE UTILITIES =====
  Math = Math;
  // ===== SIDEBAR CONFIGURATION =====
  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];

  // ===== FORMS =====
  searchForm!: FormGroup;
  liquidacionForm!: FormGroup;
  detalleForm!: FormGroup;
  clienteSearchControl: FormControl = new FormControl('');

  // ===== DATA ARRAYS =====
  liquidaciones: LiquidacionResponse[] = [];
  personas: any[] = [];
  formasPago: FormaPagoResponse[] = [];
  productos: ProductoResponse[] = [];
  proveedores: ProveedorResponse[] = [];
  operadores: OperadorResponse[] = [];
  viajeros: ViajeroResponse[] = [];

  // ===== DETALLE LIQUIDACION ARRAYS =====
  detalles: DetalleLiquidacionTemp[] = [];
  deletedDetalleIds: number[] = [];

  // ===== SEARCH AND FILTERS =====
  searchTerm = '';
  filteredLiquidaciones: LiquidacionResponse[] = [];

  // ===== CLIENT SELECTION =====
  personasEncontradas: (PersonaNaturalResponse | PersonaJuridicaResponse)[] = [];
  todosLosClientes: (PersonaNaturalResponse | PersonaJuridicaResponse)[] = [];
  buscandoClientes = false;
  clienteSeleccionado: PersonaNaturalResponse | PersonaJuridicaResponse | null = null;

  // ===== CATEGORY MANAGEMENT =====
  creandoCategoria = false;
  categoriaEditandose: number | null = null;
  categoriaDatosOriginales: any = null;

  // ===== PRESS AND HOLD DELETION =====
  liquidacionAEliminar: LiquidacionResponse | null = null;
  presionandoEliminar = false;
  tiempoPresionado = 0;
  intervaloPulsacion: any = null;

  constructor(private menuConfigService: MenuConfigService) { }

  ngOnInit(): void {
    this.sidebarMenuItems = this.menuConfigService.getMenuItems('/liquidaciones');
    this.initializeForms();
    this.loadInitialData();
    this.setupClienteSearch();
  }

  ngOnDestroy(): void {
    // Limpiar intervalo si existe
    this.clienteSearchSubscription?.unsubscribe();
    if (this.intervaloPulsacion) {
      clearInterval(this.intervaloPulsacion);
      this.intervaloPulsacion = null;
    }
  }

  // ===== MESSAGE HANDLING =====
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

  private initializeForms(): void {
    // Search form
    this.searchForm = this.fb.group({
      searchTerm: ['']
    });

    // Liquidación form
    this.liquidacionForm = this.fb.group({
      numero: [''],
      cotizacionId: [''],
      destino: [''],
      fechaCompra: ['', [Validators.required]],
      numeroPasajeros: [1, [Validators.required, Validators.min(1)]],
      productoId: [''],
      formaPagoId: [''],
      observaciones: ['']
    });

    // Detalle form para detalles de liquidación
    this.detalleForm = this.fb.group({
      proveedorId: [''],
      productoId: ['', [Validators.required]],
      operadorId: [''],
      viajeroId: [''],
      ticket: [''],
      costoTicket: [0, [Validators.min(0)]],
      cargoServicio: [0, [Validators.min(0)]],
      valorVenta: [0, [Validators.min(0)]],
      facturaCompra: [''],
      boletaPasajero: [''],
      montoDescuento: [0, [Validators.min(0)]],
      pagoPaxUSD: [0, [Validators.min(0)]],
      pagoPaxPEN: [0, [Validators.min(0)]]
    });

    this.searchForm.get('searchTerm')?.valueChanges.subscribe(term => {
      this.searchTerm = term;
      this.filterLiquidaciones();
    });
  }

  private setupClienteSearch(): void {
    // Asegurar que tenemos la lista completa de clientes
    if (this.personas.length > 0) {
      this.todosLosClientes = [...this.personas];
    }

    // Mostrar todos los clientes inicialmente
    this.personasEncontradas = [...this.todosLosClientes];
    this.buscandoClientes = false;

    this.clienteSearchSubscription?.unsubscribe();

    this.clienteSearchSubscription = this.clienteSearchControl.valueChanges
      .pipe(
        debounceTime(300), // Reducido para respuesta más rápida
        distinctUntilChanged(),
        switchMap(searchTerm => {
          this.buscandoClientes = true;
          const termino = searchTerm?.trim() || '';

          // Si no hay término de búsqueda, mostrar todos los clientes
          const resultados = this.todosLosClientes.filter(persona =>
            this.getPersonaDisplayName(persona.id || 0).toLowerCase().includes(termino)
          );
          this.personasEncontradas = resultados;
          this.buscandoClientes = false;
          return of(null);
        })
      )
      .subscribe({
        error: (err) => {
          this.buscandoClientes = false;
        }
      });
  }

  private loadInitialData(): void {
    this.isLoading = true;

    // Cargar datos básicos para liquidaciones
    Promise.all([
      this.loadPersonas(),
      this.loadFormasPago(),
      this.loadProductos(),
      this.loadProveedores(),
      this.loadOperadores(),
      this.loadViajeros()
    ]).then(() => {
      return this.loadLiquidaciones();
    }).then(() => {
      // Después de cargar liquidaciones, verificar y cargar clientes faltantes
      return this.findAndLoadMissingClients();
    }).finally(() => {
      this.isLoading = false;
    });
  }

  private async loadLiquidaciones(): Promise<void> {
    try {
      this.loading = true;
      this.isLoading = true;

      this.liquidaciones = await this.liquidacionService.getAllLiquidaciones().toPromise() || [];
      this.filterLiquidaciones();
    } catch (error) {
      this.showError('Error al cargar las liquidaciones. Por favor, recargue la página.');
      this.liquidaciones = [];
    } finally {
      this.loading = false;
      this.isLoading = false;
    }
  }

  private async loadPersonas(): Promise<void> {
    try {
      const personasNaturales = await this.personaNaturalService.findAll().toPromise() || [];
      const personasJuridicas = await this.personaJuridicaService.findAll().toPromise() || [];
      this.personas = [...personasNaturales, ...personasJuridicas];
      this.todosLosClientes = [...this.personas];
      this.personasEncontradas = [...this.todosLosClientes];

      // Poblar cache usando ENFOQUE HÍBRIDO (tabla padre SI existe, sino tabla hija)
      this.personas.forEach(persona => {
        // Intentar usar ID de tabla padre PRIMERO, si no existe usar tabla hija
        const personaId = persona.persona?.id || persona.id;

        if (personaId) {
          this.personasCache[personaId] = {
            id: personaId,
            identificador: persona.ruc || persona.documento || persona.cedula || '',
            nombre: persona.razonSocial || `${persona.nombres || ''} ${persona.apellidosPaterno || ''} ${persona.apellidosMaterno || ''}`.trim() || 'Sin nombre',
            tipo: persona.ruc ? 'JURIDICA' : 'NATURAL'
          };
          const cached = this.personasCache[personaId];
          if (cached.identificador) {
            this.personasDisplayMap[personaId] = `${cached.tipo === 'JURIDICA' ? 'RUC' : 'DNI'}: ${cached.identificador} - ${cached.nombre}`;
          } else {
            this.personasDisplayMap[personaId] = cached.nombre;
          }
        }
      });

    } catch (error) {
      this.showError('Error al cargar los clientes. Algunas funciones pueden no estar disponibles.');
      this.personas = [];
      this.todosLosClientes = [];
      this.personasEncontradas = [];
    }
  }

  /**
   * Busca y carga clientes que aparecen en liquidaciones pero no están en el cache
   */
  private async findAndLoadMissingClients(): Promise<void> {
    try {
      // Obtener IDs únicos de personas desde las liquidaciones cargadas
      const personaIdsEnLiquidaciones = new Set<number>();
      this.liquidaciones.forEach(liquidacion => {
        if (liquidacion.cotizacion?.personas?.id) {
          personaIdsEnLiquidaciones.add(liquidacion.cotizacion.personas.id);
        }
      });

      // Encontrar IDs que están en liquidaciones pero NO en cache
      const idsEnCache = new Set(Object.keys(this.personasCache).map(id => parseInt(id)));
      const idsFaltantes = Array.from(personaIdsEnLiquidaciones).filter(id => !idsEnCache.has(id));

      if (idsFaltantes.length === 0) {
        return;
      }

      // Cargar información para cada cliente faltante usando el endpoint correcto
      const clientesFaltantes = await Promise.all(
        idsFaltantes.map(async (personaId) => {
          try {
            const personaDisplay = await this.personaService.findPersonaNaturalOrJuridicaById(personaId).toPromise();
            return personaDisplay;
          } catch (error) {
            return null;
          }
        })
      );

      // Agregar clientes válidos al cache y listas
      const clientesValidos = clientesFaltantes.filter(c => c !== null) as any[];

      clientesValidos.forEach(cliente => {
        if (cliente.id) {
          // Agregar al cache - mejorar datos para clientes "genéricos"
          const esGenerico = cliente.tipo === 'GENERICA' || !cliente.identificador;

          this.personasCache[cliente.id] = {
            id: cliente.id,
            identificador: cliente.identificador || '',
            nombre: cliente.nombre || `Cliente ID: ${cliente.id}`,
            tipo: esGenerico ? 'UNKNOWN' : cliente.tipo
          };

          const cached = this.personasCache[cliente.id];
          if (cached.identificador) {
            this.personasDisplayMap[cliente.id] = `${cached.tipo === 'JURIDICA' ? 'RUC' : cached.tipo === 'NATURAL' ? 'DNI' : 'DOC'}: ${cached.identificador} - ${cached.nombre}`;
          } else {
            this.personasDisplayMap[cliente.id] = esGenerico ? `Cliente ID: ${cliente.id} (Sin datos)` : cached.nombre;
          }

          // Agregar a las listas para búsqueda (solo si no es genérico)
          if (!esGenerico) {
            this.personas.push(cliente);
            this.todosLosClientes.push(cliente);
            this.personasEncontradas.push(cliente);
          }
        }
      });

    } catch (error) {

    }
  }

  private async loadFormasPago(): Promise<void> {
    try {
      this.formasPago = await this.formaPagoService.getAllFormasPago().toPromise() || [];
    } catch (error) {
      this.showError('Error al cargar las formas de pago.');
      this.formasPago = [];
    }
  }

  private async loadProductos(): Promise<void> {
    try {
      this.productos = await this.productoService.getAllProductos().toPromise() || [];
    } catch (error) {
      this.productos = [];
    }
  }

  private async loadProveedores(): Promise<void> {
    try {
      this.proveedores = await this.proveedorService.findAllProveedor().toPromise() || [];
    } catch (error) {
      this.proveedores = [];
    }
  }

  private async loadOperadores(): Promise<void> {
    try {
      this.operadores = await this.operadorService.findAllOperador().toPromise() || [];
    } catch (error) {
      this.operadores = [];
    }
  }

  private async loadViajeros(): Promise<void> {
    try {
      this.viajeros = await this.viajeroService.findAll().toPromise() || [];
    } catch (error) {
      this.viajeros = [];
    }
  }

  // Sidebar methods
  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onSidebarItemClick(item: SidebarMenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  // Métodos para cambiar entre vistas
  changeView(view: 'table' | 'cards' | 'list'): void {
    this.currentView = view;
  }

  // Search and filter methods
  clearSearch(): void {
    this.searchForm.get('searchTerm')?.setValue('');
    this.searchTerm = '';
    this.filterLiquidaciones();
  }

  private filterLiquidaciones(): void {
    if (!this.searchTerm.trim()) {
      this.filteredLiquidaciones = [...this.liquidaciones];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredLiquidaciones = this.liquidaciones.filter(liquidacion => {
        return (liquidacion.numero?.toLowerCase().includes(term)) ||
               (liquidacion.destino?.toLowerCase().includes(term)) ||
               (liquidacion.producto?.descripcion?.toLowerCase().includes(term)) ||
               (liquidacion.cotizacion?.codigoCotizacion?.toLowerCase().includes(term));
      });
    }
    // Update totalItems after filtering
    this.totalItems = this.filteredLiquidaciones.length;
    this.updateSelectionState();
  }

  // Form methods
  async mostrarFormularioCrear(): Promise<void> {
    try {
      this.isLoading = true;

      // Cargar cotizaciones para selección
      await this.loadCotizaciones();

      // Mostrar modal de selección de cotizaciones
      this.mostrarModalCotizaciones = true;

    } catch (error) {
      console.error('Error en mostrarFormularioCrear:', error);
      this.showError('Error al cargar las cotizaciones');
    } finally {
      this.isLoading = false;
    }
  }

  async mostrarFormularioEditar(liquidacion: LiquidacionResponse): Promise<void> {
    // Navegar al componente de detalle en modo edición
    this.router.navigate(['/liquidaciones/detalle', liquidacion.id], {
      queryParams: { modo: 'editar' }
    });
  }

  async mostrarFormularioEditarOld(liquidacion: LiquidacionResponse): Promise<void> {
    try {
      this.isLoading = true;

      if (this.todosLosClientes.length === 0) {
        await this.loadPersonas();
      }

      this.resetForm();
      this.editandoLiquidacion = true;
      this.liquidacionEditandoId = liquidacion.id;

      await this.populateLiquidacionForm(liquidacion);

      this.mostrarFormulario = true;

    } catch (error) {
      this.showError('Error al cargar el formulario de edición');
    } finally {
      // Se asegura de que el indicador de carga se oculte, incluso si hay un error
      this.isLoading = false;
    }
  }

  cerrarModalVer(): void {
    this.mostrarModalVer = false;
    this.liquidacionCompleta = null;
    this.liquidacionSeleccionada = null;
    this.isLoading = false;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.editandoLiquidacion = false;
    this.liquidacionEditandoId = null;
    this.liquidacionCompleta = null;
    this.resetForm();
  }

  private resetForm(): void {
    this.liquidacionForm.reset({
      numero: '',
      cotizacionId: '',
      destino: '',
      fechaCompra: '',
      numeroPasajeros: 1,
      productoId: '',
      formaPagoId: '',
      observaciones: ''
    });

    this.detalles = [];
    this.deletedDetalleIds = [];

    this.clienteSeleccionado = null;
    this.buscandoClientes = false;

    this.personasEncontradas = [...this.todosLosClientes];

    this.clienteSearchControl.setValue('', { emitEvent: false });
  }

  // Método simplificado para popular el formulario de liquidación
  private async populateLiquidacionForm(liquidacion: LiquidacionResponse): Promise<void> {
    try {
      this.liquidacionForm.patchValue({
        numero: liquidacion.numero || '',
        cotizacionId: liquidacion.cotizacion?.id || '',
        destino: liquidacion.destino || '',
        fechaCompra: liquidacion.fechaCompra ? this.formatDateForInput(new Date(liquidacion.fechaCompra)) : '',
        numeroPasajeros: liquidacion.numeroPasajeros || 1,
        productoId: liquidacion.producto?.id || '',
        formaPagoId: liquidacion.formaPago?.id || ''
      });

      if (liquidacion.id) {
        await this.loadDetallesLiquidacion(liquidacion.id);
      }

      this.mostrarFormulario = true;
    } catch (error) {
      this.showError('Error al cargar los datos de la liquidación');
    }
  }

  private async loadDetallesLiquidacion(liquidacionId: number): Promise<void> {
    try {
      const detalles = await this.detalleLiquidacionService.getDetallesByLiquidacionId(liquidacionId).toPromise() || [];
      this.detalles = detalles.map(detalle => ({
        id: detalle.id,
        proveedor: detalle.proveedor,
        producto: detalle.producto,
        operador: detalle.operador,
        viajero: detalle.viajero,
        ticket: detalle.ticket,
        costoTicket: detalle.costoTicket,
        cargoServicio: detalle.cargoServicio,
        valorVenta: detalle.valorVenta,
        facturaCompra: detalle.facturaCompra,
        boletaPasajero: detalle.boletaPasajero,
        montoDescuento: detalle.montoDescuento,
        pagoPaxUSD: detalle.pagoPaxUSD,
        pagoPaxPEN: detalle.pagoPaxPEN,
        isTemporary: false
      }));
    } catch (error) {
      this.showError('Error al cargar los detalles de la liquidación');
    }
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Función para calcular el total en tiempo real del formulario de detalle
  calcularTotalDetalle(): number {
    const cantidad = this.detalleForm.get('cantidad')?.value || 0;
    const precioUnitario = this.detalleForm.get('precioHistorico')?.value || 0;
    return cantidad * precioUnitario;
  }

  // Detalle cotización methods (Productos Fijos)
  agregarDetalleFijo(): void {

    if (this.detalleForm.invalid) {
      this.markFormGroupTouched(this.detalleForm);
      return;
    }

    const formValue = this.detalleForm.value;

    let proveedor = null;

    // Handle proveedor
    if (formValue.proveedorId) {
      const proveedorId = Number(formValue.proveedorId);
      proveedor = this.proveedores.find(p => p.id === proveedorId) || null;
    }

    let producto = null;
    if (formValue.productoId) {
      const productoId = Number(formValue.productoId);
      producto = this.productos.find(p => p.id === productoId) || null;
    }

    // Validar que tengamos al menos un producto
    if (!producto) {
      this.errorMessage = 'Error: No se pudo encontrar el producto seleccionado';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    const descripcion = formValue.descripcion?.trim() || 'Sin descripción';
    const precioHistorico = Number(formValue.precioHistorico) || 0;
    const comision = Number(formValue.comision) || 0;
    const cantidad = Number(formValue.cantidad) || 1;
    const unidad = formValue.unidad || 1;

    const nuevoDetalle: any = {
      proveedor,
      producto,
      descripcion,
      precioHistorico,
      comision,
      cantidad,
      unidad,
      total: (precioHistorico * cantidad) + comision,
      isTemporary: true
    };
    this.successMessage = 'Producto agregado correctamente';
    setTimeout(() => this.successMessage = '', 3000);
  }

  cancelarEliminacion(): void {
    this.presionandoEliminar = false;
    this.tiempoPresionado = 0;
    this.liquidacionAEliminar = null;

    if (this.intervaloPulsacion) {
      clearInterval(this.intervaloPulsacion);
      this.intervaloPulsacion = null;
    }
  }

  // Completar eliminación después de 3 segundos
  completarEliminacion(): void {
    if (this.liquidacionAEliminar) {
      const cotizacion = this.liquidacionAEliminar;
      this.cancelarEliminacion();
    }
  }

  // Obtener porcentaje de progreso para mostrar visualmente
  getPorcentajeProgreso(): number {
    return Math.min((this.tiempoPresionado / 3000) * 100, 100);
  }

  getMath() {
    return Math;
  }

  // Helper methods
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `Este campo es requerido`;
      }
      if (field.errors['min']) {
        return `El valor mínimo es ${field.errors['min'].min}`;
      }
    }
    return '';
  }

  getPersonaDisplayName(personaId: number): string {
    // Usar solo datos en cache para evitar llamadas HTTP cíclicas
    if (!personaId || personaId === 0) {
      return 'Sin cliente';
    }

    // Retornar desde display map si existe
    if (this.personasDisplayMap[personaId]) {
      return this.personasDisplayMap[personaId];
    }

    // Si no está en cache, retornar texto temporal
    // NO hacer llamadas HTTP desde aquí para evitar loops infinitos
    return 'Cliente no encontrado';
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    // Extraer solo la parte de la fecha (YYYY-MM-DD) y formatear manualmente
    // para evitar problemas de zona horaria
    const dateOnly = dateString.split('T')[0]; // "2024-11-20"
    const [year, month, day] = dateOnly.split('-');
    return `${day}/${month}/${year}`;
  }

  formatDateTime(dateString: string | undefined): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('es-ES');
  }

  updateSelectionState(): void {
    const totalItems = this.filteredLiquidaciones.length;
    const selectedCount = this.selectedItems.length;
    this.allSelected = selectedCount === totalItems && totalItems > 0;
    this.someSelected = selectedCount > 0 && selectedCount < totalItems;
  }

  // Métodos para acciones masivas
  clearSelection(): void {
    this.selectedItems = [];
    this.updateSelectionState();
  }

  calcularEstadisticas(): void {
    this.totalLiquidaciones = this.liquidaciones.length;
  }

  get totalPages(): number {
    const itemsPerPageNum = Number(this.itemsPerPage);
    return Math.ceil(this.totalItems / itemsPerPageNum);
  }

  get paginatedLiquidaciones(): LiquidacionResponse[] {
    const itemsPerPageNum = Number(this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * itemsPerPageNum;
    const endIndex = startIndex + itemsPerPageNum;
    return this.filteredLiquidaciones.slice(startIndex, endIndex);
  }

  onItemsPerPageChange(): void {
    this.itemsPerPage = Number(this.itemsPerPage);
    this.currentPage = 1;
    this.calcularEstadisticas();
  }

  // Métodos para selección múltiple
  toggleAllSelection(): void {
    if (this.allSelected) {
      this.selectedItems = [];
    } else {
      this.selectedItems = this.filteredLiquidaciones.map(l => l.id!);
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

  isSelected(id: number): boolean {
    return this.selectedItems.includes(id);
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

  // ===== MÉTODOS PARA LIQUIDACIONES =====
  getTotalLiquidaciones(): number {
    return this.liquidaciones.length;
  }

  getLiquidacionesProcesadas(): number {
    return this.liquidaciones.filter(liq => liq.producto !== null && liq.formaPago !== null).length;
  }

  getLiquidacionesPendientes(): number {
    return this.liquidaciones.filter(liq => liq.producto === null || liq.formaPago === null).length;
  }

  trackByLiquidacion(index: number, liquidacion: LiquidacionResponse): number {
    return liquidacion.id;
  }

  trackByDetalle(index: number, detalle: DetalleLiquidacionResponse): number {
    return detalle.id;
  }

  mostrarModalVerLiquidacion(liquidacion: LiquidacionResponse): void {
    this.router.navigate(['/liquidaciones/detalle', liquidacion.id]);
  }

  async mostrarModalVerLiquidacionOld(liquidacion: LiquidacionResponse): Promise<void> {
    this.liquidacionSeleccionada = liquidacion;
    this.isLoading = true;

    try {
      // Cargar liquidación con detalles
      const liquidacionConDetalles = await this.liquidacionService.getLiquidacionById(liquidacion.id).toPromise();
      this.liquidacionCompleta = liquidacionConDetalles || null;
      this.mostrarModalVer = true;
    } catch (error) {
      console.error('Error al cargar detalles de liquidación:', error);
      this.showError('Error al cargar los detalles de la liquidación');
    } finally {
      this.isLoading = false;
    }
  }

  private async eliminarLiquidacionDirectamente(id: number): Promise<void> {
    this.isLoading = true;

    try {
      await this.liquidacionService.deleteLiquidacion(id).toPromise();
      this.showSuccess('Liquidación eliminada exitosamente');
      await this.loadLiquidaciones();
    } catch (error: any) {
      const errorMessage = error?.error?.detail ||    // RFC 7807 format
                          error?.error?.message ||     // Custom format
                          error?.message ||             // Error object
                          'Error al eliminar la liquidación';
      this.showError(errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  // Form submission para CRUD de liquidaciones
  async onSubmitLiquidacion(): Promise<void> {
    if (this.liquidacionForm.invalid) {
      this.markFormGroupTouched(this.liquidacionForm);
      return;
    }
    this.isLoading = true;

    try {
      const formValue = this.liquidacionForm.value;
      // Preparar el request de liquidación
      const liquidacionRequest: LiquidacionRequest = {
        numero: formValue.numero || '',
        fechaCompra: formValue.fechaCompra,
        destino: formValue.destino || '',
        numeroPasajeros: formValue.numeroPasajeros || 1,
        productoId: formValue.productoId || null,
        formaPagoId: formValue.formaPagoId || null
      };

      let liquidacionResponse: LiquidacionResponse;

      if (this.editandoLiquidacion && this.liquidacionEditandoId) {
        // Actualizar liquidación existente
        const updateResult = await this.liquidacionService.updateLiquidacion(this.liquidacionEditandoId, liquidacionRequest).toPromise();
        if (!updateResult) throw new Error('Failed to update liquidación');
        liquidacionResponse = updateResult;
      } else {
        // Crear nueva liquidación
        const createResult = await this.liquidacionService.createLiquidacion(liquidacionRequest).toPromise();
        if (!createResult) throw new Error('Failed to create liquidación');
        liquidacionResponse = createResult;
      }

      // Procesar detalles de liquidación si existen
      if (this.detalles.length > 0) {
        await this.procesarDetallesLiquidacion(liquidacionResponse.id);
      }

      const successMessage = this.editandoLiquidacion
        ? 'Liquidación actualizada exitosamente!'
        : 'Liquidación creada exitosamente!';
      this.showSuccess(successMessage);

      await this.loadLiquidaciones();
      this.cerrarFormulario();
    } catch (error: any) {
      const errorMessage = error?.error?.detail ||    // RFC 7807 format
                          error?.error?.message ||     // Custom format
                          error?.message ||             // Error object
                          'Error al guardar la liquidación. Por favor, verifique los datos e intente nuevamente.';
      this.showError(errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  private async procesarDetallesLiquidacion(liquidacionId: number): Promise<void> {
    try {
      const deletePromises = this.deletedDetalleIds.map(id =>
        this.detalleLiquidacionService.deleteDetalleLiquidacion(id).toPromise());
      await Promise.all(deletePromises);
      this.deletedDetalleIds = [];

      for (const detalle of this.detalles) {
        if (detalle.isTemporary)
          await this.crearDetalleLiquidacion(liquidacionId, detalle);
        else if (detalle.id)
          await this.actualizarDetalleLiquidacion(detalle);
      }
    } catch (error) {
      throw error;
    }
  }

  private async crearDetalleLiquidacion(liquidacionId: number, detalle: DetalleLiquidacionTemp): Promise<void> {
    try {
      const detalleRequest: DetalleLiquidacionRequest = {
        viajeroId: detalle.viajero?.id || undefined,
        productoId: detalle.producto?.id || undefined,
        proveedorId: detalle.proveedor?.id || undefined,
        operadorId: detalle.operador?.id || undefined,
        ticket: detalle.ticket || '',
        costoTicket: detalle.costoTicket || 0,
        cargoServicio: detalle.cargoServicio || 0,
        valorVenta: detalle.valorVenta || 0,
        facturaCompra: detalle.facturaCompra || '',
        boletaPasajero: detalle.boletaPasajero || '',
        montoDescuento: detalle.montoDescuento || 0,
        pagoPaxUSD: detalle.pagoPaxUSD || 0,
        pagoPaxPEN: detalle.pagoPaxPEN || 0
      };
      await this.detalleLiquidacionService.createDetalleLiquidacion(liquidacionId, detalleRequest).toPromise();
    } catch (error) {
      throw error;
    }
  }

  private async actualizarDetalleLiquidacion(detalle: DetalleLiquidacionTemp): Promise<void> {
    try {
      if (!detalle.id) return;

      const detalleRequest: DetalleLiquidacionRequest = {
        costoTicket: detalle.costoTicket || 0,
        cargoServicio: detalle.cargoServicio || 0,
        valorVenta: detalle.valorVenta || 0,
        facturaCompra: detalle.facturaCompra || '',
        boletaPasajero: detalle.boletaPasajero || '',
        montoDescuento: detalle.montoDescuento || 0,
        pagoPaxUSD: detalle.pagoPaxUSD || 0,
        pagoPaxPEN: detalle.pagoPaxPEN || 0,
        viajeroId: detalle.viajero?.id || undefined,
        productoId: detalle.producto?.id || undefined,
        proveedorId: detalle.proveedor?.id || undefined,
        operadorId: detalle.operador?.id || undefined,
        ticket: detalle.ticket || ''
      };
      await this.detalleLiquidacionService.updateDetalleLiquidacion(detalle.id, detalleRequest).toPromise();
    } catch (error) {
      throw error;
    }
  }

  // ===== COTIZACIONES METHODS =====
  async loadCotizaciones(): Promise<void> {
    try {
      // Siempre bypassear cache para obtener datos frescos de cotizaciones disponibles
      this.cotizaciones = await this.cotizacionService.getCotizacionSinLiquidacion(true).toPromise() || [];
      this.cotizacionesFiltradas = [...this.cotizaciones];
    } catch (error) {
      console.error('Error en loadCotizaciones:', error);
      this.showError('Error al cargar las cotizaciones');
      this.cotizaciones = [];
      this.cotizacionesFiltradas = [];
    }
  }

  filtrarCotizaciones(): void {
    const term = this.searchCotizacion.toLowerCase().trim();

    if (!term) {
      this.cotizacionesFiltradas = [...this.cotizaciones];
      return;
    }
    this.cotizacionesFiltradas = this.cotizaciones.filter(cotizacion =>
      cotizacion.codigoCotizacion?.toLowerCase().includes(term) ||
      cotizacion.origenDestino?.toLowerCase().includes(term)
    );
  }

  async seleccionarCotizacion(cotizacion: CotizacionResponse): Promise<void> {
    try {
      this.isLoading = true;
      this.cotizacionSeleccionada = cotizacion;

      await this.crearLiquidacionDesdeCotizacion(cotizacion);
    } catch (error) {
      this.showError('Error al procesar la cotización seleccionada: ' + (error as any)?.message || 'Error desconocido');
    } finally {
      this.isLoading = false;
    }
  }

  async crearLiquidacionDesdeCotizacion(cotizacion: CotizacionResponse): Promise<void> {
    try { 
      // Mapear datos de cotización a liquidación
      const liquidacionRequest: LiquidacionRequest = {
        cotizacionId: cotizacion.id,
        fechaCompra: cotizacion.fechaEmision ? this.formatDateForInput(new Date(cotizacion.fechaEmision)) : undefined,
        destino: cotizacion.origenDestino,
        numeroPasajeros: (cotizacion.cantAdultos || 0) + (cotizacion.cantNinos || 0),
        formaPagoId: cotizacion.formaPago?.id   };

      // Crear la liquidación
      const nuevaLiquidacion = await this.liquidacionService.createLiquidacionConCotizacion(cotizacion.id, liquidacionRequest).toPromise();

      if (!nuevaLiquidacion) throw new Error('Error al crear la liquidación'); 

      this.mostrarModalCotizaciones = false;
      this.cotizacionSeleccionada = null;

      await this.loadLiquidaciones();
      await this.mostrarFormularioEditar(nuevaLiquidacion);

      this.showSuccess('Liquidación creada exitosamente desde la cotización');
    } catch (error) {
      this.showError('Error al crear la liquidación desde la cotización: ' + (error as any)?.message || 'Error desconocido');
      throw error;
    }
  }

  cancelarSeleccionCotizacion(): void {
    this.mostrarModalCotizaciones = false;
    this.cotizacionSeleccionada = null;
    this.searchCotizacion = '';
    this.cotizacionesFiltradas = [];
  }
}
