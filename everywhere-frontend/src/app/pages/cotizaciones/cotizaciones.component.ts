import { Component, OnInit, OnDestroy, inject, importProvidersFrom } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subscription, of } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { environment } from '../../../environments/environment';

// Services
import { CotizacionService } from '../../core/service/Cotizacion/cotizacion.service';
import { DetalleCotizacionService } from '../../core/service/DetalleCotizacion/detalle-cotizacion.service';
import { PersonaService } from '../../core/service/persona/persona.service';
import { PersonaNaturalService } from '../../core/service/natural/persona-natural.service';
import { PersonaJuridicaService } from '../../core/service/juridica/persona-juridica.service';
import { FormaPagoService } from '../../core/service/FormaPago/forma-pago.service';
import { EstadoCotizacionService } from '../../core/service/EstadoCotizacion/estado-cotizacion.service';
import { SucursalService } from '../../core/service/Sucursal/sucursal.service';
import { ProductoService } from '../../core/service/Producto/producto.service';
import { ProveedorService } from '../../core/service/Proveedor/proveedor.service';
import { AuthServiceService } from '../../core/service/auth/auth.service';
import { CategoriaService } from '../../core/service/Categoria/categoria.service';

import { personaDisplay } from '../../shared/models/Persona/persona.model';
// Models
import { CotizacionRequest, CotizacionResponse, CotizacionConDetallesResponseDTO, CotizacionPatchRequest } from '../../shared/models/Cotizacion/cotizacion.model';
import { DetalleCotizacionRequest, DetalleCotizacionResponse } from '../../shared/models/Cotizacion/detalleCotizacion.model';
import { PersonaNaturalResponse } from '../../shared/models/Persona/personaNatural.model';
import { PersonaJuridicaResponse } from '../../shared/models/Persona/personaJuridica.models';
import { FormaPagoResponse } from '../../shared/models/FormaPago/formaPago.model';
import { EstadoCotizacionResponse } from '../../shared/models/Cotizacion/estadoCotizacion.model';
import { SucursalResponse } from '../../shared/models/Sucursal/sucursal.model';
import { ProductoResponse } from '../../shared/models/Producto/producto.model';
import { ProveedorResponse } from '../../shared/models/Proveedor/proveedor.model';
import { CategoriaResponse } from '../../shared/models/Categoria/categoria.model';
import { CategoriaRequest } from '../../shared/models/Categoria/categoria.model';

// Components
import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';

// Extender la interfaz para agregar moduleKey
interface ExtendedSidebarMenuItem extends SidebarMenuItem {
  moduleKey?: string;
  children?: ExtendedSidebarMenuItem[];
}

interface DetalleCotizacionTemp {
  id?: number;
  proveedor?: ProveedorResponse | null;
  producto?: ProductoResponse;
  categoria: CategoriaResponse | number; // Puede ser objeto o id
  descripcion: string;
  precioHistorico: number;
  comision: number;
  cantidad: number;
  unidad: number;
  total: number;
  isTemporary?: boolean;
  seleccionado?: boolean; // Campo para marcar si el detalle está seleccionado
}

interface GrupoHotelTemp {
  categoria: CategoriaResponse;
  detalles: DetalleCotizacionTemp[];
  total: number;
  isTemporary?: boolean;
  seleccionado?: boolean; // Campo para marcar si el grupo está seleccionado
}

@Component({
  selector: 'app-cotizaciones',
  standalone: true,
  templateUrl: './cotizaciones.component.html',
  styleUrls: ['./cotizaciones.component.css'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SidebarComponent, LucideAngularModule]
})
export class CotizacionesComponent implements OnInit, OnDestroy {
  // ===== CACHE AND MAPPING =====
  personasCache: { [id: number]: any } = {};
  personasDisplayMap: { [id: number]: string } = {};
  loadingPersonas: Set<number> = new Set(); // Para evitar cargas duplicadas

  // Services injection
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private cotizacionService = inject(CotizacionService);
  private detalleCotizacionService = inject(DetalleCotizacionService);
  private personaService = inject(PersonaService);
  private personaNaturalService = inject(PersonaNaturalService);
  private personaJuridicaService = inject(PersonaJuridicaService);
  private formaPagoService = inject(FormaPagoService);
  private estadoCotizacionService = inject(EstadoCotizacionService);
  private sucursalService = inject(SucursalService);
  private productoService = inject(ProductoService);
  private proveedorService = inject(ProveedorService);
  private categoriaService = inject(CategoriaService);
  private clienteSearchSubscription: Subscription | null = null;

  // ===== UI STATE =====
  isLoading = false;
  loading: boolean = false;
  mostrarModalCrear = false;
  mostrarFormulario = false;
  editandoCotizacion = false;
  mostrarGestionGrupos = false;
  mostrarModalVer = false;
  sidebarCollapsed = false;
  currentView: 'table' | 'cards' | 'list' = 'table';

  // Selección única de grupo de hoteles
  grupoSeleccionadoId: number | null = null;

  // Estadísticas
  totalCotizaciones = 0;

  // ===== MESSAGES =====
  errorMessage: string = '';
  successMessage: string = '';
  showErrorMessage: boolean = false;
  showSuccessMessage: boolean = false;

  // ===== SELECTION STATE =====
  cotizacionSeleccionada: CotizacionResponse | null = null;
  cotizacionCompleta: CotizacionConDetallesResponseDTO | null = null;
  cotizacionEditandoId: number | null = null;
  cotizacionOriginal: CotizacionResponse | null = null; // Para comparar cambios en PATCH

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
          moduleKey: 'PERSONAS'
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
      active: true,
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
      id: 'documentos',
      title: 'Documentos de clientes',
      icon: 'fas fa-file-alt',
      route: '/documentos',
      moduleKey: 'DOCUMENTOS'
    },
    {
      id: 'documentos-cobranza',
      title: 'Documentos de Cobranza',
      icon: 'fas fa-file-contract',
      route: '/documentos-cobranza',
      moduleKey: 'DOCUMENTOS_COBRANZA'
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
          route: '/counters',
          moduleKey: 'COUNTERS'
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

  // ===== FORMS =====
  searchForm!: FormGroup;
  cotizacionForm!: FormGroup;
  detalleForm!: FormGroup;
  grupoHotelForm!: FormGroup;
  nuevaCategoriaForm!: FormGroup;
  clienteSearchControl: FormControl = new FormControl('');

  // ===== DATA ARRAYS =====
  cotizaciones: CotizacionResponse[] = [];
  personas: any[] = [];
  formasPago: FormaPagoResponse[] = [];
  estadosCotizacion: EstadoCotizacionResponse[] = [];
  sucursales: SucursalResponse[] = [];
  productos: ProductoResponse[] = [];
  proveedores: ProveedorResponse[] = [];
  categorias: CategoriaResponse[] = [];

  // ===== DETALLE COTIZACIÓN ARRAYS =====
  detallesFijos: DetalleCotizacionTemp[] = [];
  gruposHoteles: GrupoHotelTemp[] = [];
  deletedDetalleIds: number[] = [];

  // ===== SEARCH AND FILTERS =====
  searchTerm = '';
  filteredCotizaciones: CotizacionResponse[] = [];
  cotizacionesFiltradas: CotizacionConDetallesResponseDTO[] = [];

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
  cotizacionAEliminar: CotizacionResponse | null = null;
  presionandoEliminar = false;
  tiempoPresionado = 0;
  intervaloPulsacion: any = null;

  constructor(private authService: AuthServiceService) { }

  ngOnInit(): void {
    this.initializeSidebar();
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

    // Nueva categoría form
    this.nuevaCategoriaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['']
    });

    // Cotización form
    this.cotizacionForm = this.fb.group({
      codigoCotizacion: [{ value: '', disabled: true }],
      personaId: ['', [Validators.required]],
      fechaEmision: ['', [Validators.required]],
      fechaVencimiento: ['', [Validators.required]],
      estadoCotizacionId: [''],
      sucursalId: [''],
      origenDestino: [''],
      fechaSalida: [''],
      fechaRegreso: [''],
      formaPagoId: [''],
      cantAdultos: [1, [Validators.min(1)]],
      cantNinos: [0, [Validators.min(0)]],
      moneda: ['USD', [Validators.required]],
      observacion: [''],
      // Eliminados los campos complejos de búsqueda de cliente
    });

    // Detalle form para productos fijos
    this.detalleForm = this.fb.group({
      proveedorId: [''],
      nuevoProveedor: [''],
      productoId: ['', [Validators.required]],
      descripcion: [''],
      precioHistorico: [0, [Validators.required, Validators.min(0)]],
      comision: [0, [Validators.min(0)]],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      unidad: [1, [Validators.required, Validators.min(1)]]
    });

    // Grupo hotel form
    this.grupoHotelForm = this.fb.group({
      categoria: ['', [Validators.required]]
    });

    // Subscribe to search changes
    this.searchForm.get('searchTerm')?.valueChanges.subscribe(term => {
      this.searchTerm = term;
      this.filterCotizaciones();
    });

    // Setup real-time client search DESPUÉS de cargar datos iniciales
    // this.setupClienteSearch(); // Movido a loadInitialData
  }

  /**
   * Relaja los validadores de cotizacionForm para modo EDICIÓN
   * Permite actualizar solo los campos que cambien (PATCH)
   */
  private relaxCotizacionFormValidators(): void {
    const fieldsToRelax = [
      'personaId',
      'fechaEmision',
      'fechaVencimiento',
      'moneda',
      'cantAdultos',
      'cantNinos'
    ];

    fieldsToRelax.forEach(fieldName => {
      const control = this.cotizacionForm.get(fieldName);
      if (control) {
        control.clearAsyncValidators();
        control.setValidators([Validators.nullValidator]);
        control.updateValueAndValidity({ emitEvent: false });
      }
    });
  }

  /**
   * Restaura validadores estrictos para modo CREACIÓN
   */
  private strictCotizacionFormValidators(): void {
    // Re-crear el formulario con validadores originales
    this.cotizacionForm = this.fb.group({
      codigoCotizacion: [{ value: '', disabled: true }],
      personaId: ['', [Validators.required]],
      fechaEmision: ['', [Validators.required]],
      fechaVencimiento: ['', [Validators.required]],
      estadoCotizacionId: [''],
      sucursalId: [''],
      origenDestino: [''],
      fechaSalida: [''],
      fechaRegreso: [''],
      formaPagoId: [''],
      cantAdultos: [1, [Validators.min(1)]],
      cantNinos: [0, [Validators.min(0)]],
      moneda: ['USD', [Validators.required]],
      observacion: ['']
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
            this.getClienteDisplayName(persona).toLowerCase().includes(termino)
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

    // Usar el MISMO orden que liquidaciones: personas PRIMERO
    Promise.all([
      this.loadPersonas(),
      this.loadFormasPago(),
      this.loadEstadosCotizacion(),
      this.loadSucursales(),
      this.loadProductos(),
      this.loadProveedores(),
      this.loadCategorias()
    ]).then(() => {
      // Cargar cotizaciones AL FINAL
      return this.loadCotizaciones();
    }).then(() => {
      // Después de cargar cotizaciones, verificar y cargar clientes faltantes
      return this.findAndLoadMissingClients();
    }).finally(() => {
      this.isLoading = false;
    });
  }

  private async loadCotizaciones(): Promise<void> {
    try {
      this.loading = true;
      this.isLoading = true;

      this.cotizaciones = await this.cotizacionService.getAllCotizaciones().toPromise() || [];
      this.filterCotizaciones();
    } catch (error) {
      this.showError('Error al cargar las cotizaciones. Por favor, recargue la página.');
      this.cotizaciones = [];
    } finally {
      this.loading = false;
      this.isLoading = false;
    }
  }

  private async loadPersonas(): Promise<void> {
    try {
      // Usar el mismo enfoque que funciona en liquidaciones
      // Cargar personas naturales
      const personasNaturales = await this.personaNaturalService.findAll().toPromise() || [];
      // Cargar personas jurídicas
      const personasJuridicas = await this.personaJuridicaService.findAll().toPromise() || [];



      // Combinar ambas listas
      this.personas = [...personasNaturales, ...personasJuridicas];
      // Almacenar todos los clientes para el filtrado inicial
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
            nombre: persona.razonSocial || `${persona.nombres || ''} ${persona.apellidos || ''}`.trim() || 'Sin nombre',
            tipo: persona.ruc ? 'JURIDICA' : 'NATURAL'
          };
          const cached = this.personasCache[personaId];

          // Mejorar el formato del display para asegurar que se muestre el documento
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
   * Busca y carga clientes que aparecen en cotizaciones pero no están en el cache
   */
  private async findAndLoadMissingClients(): Promise<void> {
    try {
      // Obtener IDs únicos de personas desde las cotizaciones cargadas
      const personaIdsEnCotizaciones = new Set<number>();
      this.cotizaciones.forEach(cotizacion => {
        if (cotizacion.personas?.id) {
          personaIdsEnCotizaciones.add(cotizacion.personas.id);
        }
      });

      // Encontrar IDs que están en cotizaciones pero NO en cache
      const idsEnCache = new Set(Object.keys(this.personasCache).map(id => parseInt(id)));
      const idsFaltantes = Array.from(personaIdsEnCotizaciones).filter(id => !idsEnCache.has(id));

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
      // Error silencioso para no saturar la consola
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

  private async loadEstadosCotizacion(): Promise<void> {
    try {
      this.estadosCotizacion = await this.estadoCotizacionService.getAllEstadosCotizacion().toPromise() || [];
    } catch (error) {
      this.estadosCotizacion = [];
    }
  }

  private async loadSucursales(): Promise<void> {
    try {
      this.sucursales = await this.sucursalService.findAllSucursal().toPromise() || [];
    } catch (error) {
      this.sucursales = [];
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

  private async loadCategorias(): Promise<void> {
    try {
      this.categorias = [];
      const response = await this.categoriaService.findAll().toPromise();
      this.categorias = response || [];
    } catch (error) {
      this.categorias = [];
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
    this.filterCotizaciones();
  }

  private filterCotizaciones(): void {
    if (!this.searchTerm.trim()) {
      this.filteredCotizaciones = [...this.cotizaciones];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredCotizaciones = this.cotizaciones.filter(cotizacion => {
        return cotizacion.codigoCotizacion?.toLowerCase().includes(term) ||
          this.getPersonaDisplayName(cotizacion.personas?.id || 0).toLowerCase().includes(term) ||
          cotizacion.origenDestino?.toLowerCase().includes(term);
      });
    }
    // Update totalItems after filtering
    this.totalItems = this.filteredCotizaciones.length;
    this.updateSelectionState();
  }

  // Form methods
  async mostrarFormularioCrear(): Promise<void> {
    try {
      this.isLoading = true; // Inicia la carga, igual que en 'editar'

      // Asegura que los clientes estén cargados antes de continuar
      if (this.todosLosClientes.length === 0) {
        await this.loadPersonas();
      }

      this.resetForm(); // Prepara el formulario y la lista de clientes
      this.strictCotizacionFormValidators(); // Aplicar validadores estrictos para creación
      this.editandoCotizacion = false;
      this.cotizacionEditandoId = null;
      this.setupDatesForNew();
      this.mostrarFormulario = true; // Abre el modal al final

    } catch (error) {

      this.showError('Error al preparar el formulario de cotización');
    } finally {
      // Se asegura de que el indicador de carga se oculte siempre
      this.isLoading = false;
    }
  }

  async mostrarFormularioEditar(cotizacion: CotizacionResponse): Promise<void> {
    try {
      this.isLoading = true; // Inicia la carga

      // Asegura que los datos base (clientes, categorías) estén disponibles
      if (this.todosLosClientes.length === 0) {
        await this.loadPersonas();
      }
      if (this.categorias.length === 0) {
        await this.loadCategorias();
      }

      this.resetForm(); // Limpia el estado del formulario anterior
      this.relaxCotizacionFormValidators(); // Relajar validadores para edición (PATCH)
      this.editandoCotizacion = true;
      this.cotizacionEditandoId = cotizacion.id;
      this.cotizacionOriginal = cotizacion; // Guardar datos originales para comparar PATCH

      // MEJORA: Usar getCotizacionConDetalles para obtener datos completos
      await this.loadCotizacionCompleta(cotizacion.id);

      this.mostrarFormulario = true; // Muestra el modal con los datos ya cargados

    } catch (error) {
      this.showError('Error al cargar el formulario de edición');
    } finally {
      // Se asegura de que el indicador de carga se oculte, incluso si hay un error
      this.isLoading = false;
    }
  }

  async mostrarModalVerCotizacion(cotizacion: CotizacionResponse): Promise<void> {
    try {
      this.isLoading = true;

      // Cargar datos completos de la cotización
      await this.loadCotizacionCompleta(cotizacion.id);

      this.mostrarModalVer = true;

    } catch (error) {
      this.showError('Error al cargar los detalles de la cotización');
    } finally {
      this.isLoading = false;
    }
  }

  cerrarModalVer(): void {
    this.mostrarModalVer = false;
    this.cotizacionCompleta = null;
    this.isLoading = false;
  }

  // Método para obtener subtotal de una categoría
  getSubtotalCategoria(detalles: any[]): number {
    return detalles.reduce((sum, d) => sum + ((d.precioHistorico || 0) + (d.comision || 0)) * (d.cantidad || 1), 0);
  }

  // Método para editar desde el modal
  editarDesdeModa(): void {
    if (this.cotizacionCompleta) {
      this.mostrarFormularioEditar({
        id: this.cotizacionCompleta.id,
        codigoCotizacion: this.cotizacionCompleta.codigoCotizacion
      } as any);
      this.cerrarModalVer();
    }
  }

  // Métodos auxiliares para la visualización
  getCategoriasNoFijas(): any[] {
    return this.getCategoriasConDetalles().filter(c => c.id !== 1);
  }

  hasCategoriasNoFijas(): boolean {
    return this.getCategoriasNoFijas().length > 0;
  }

  getTotalCategoria(detalles: any[]): number {
    return detalles.reduce((sum, d) => sum + ((d.precioHistorico || 0) + (d.comision || 0)) * (d.cantidad || 1), 0);
  }

  getTotalProductosFijos(): number {
    const fijos = this.getDetallesByCategoria(1);
    return fijos.reduce((sum, d) => sum + ((d.precioHistorico || 0) + (d.comision || 0)) * (d.cantidad || 1), 0);
  }

  hasProductosFijos(): boolean {
    return this.getDetallesByCategoria(1).length > 0;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.editandoCotizacion = false;
    this.cotizacionEditandoId = null;
    this.cotizacionCompleta = null;
    this.cotizacionOriginal = null; // Limpiar datos originales
    this.resetForm();
  }

  private resetForm(): void {
    // CORRECCIÓN: Damos valores iniciales a todos los campos del formulario
    this.cotizacionForm.reset({
      personaId: '',
      estadoCotizacionId: '',
      sucursalId: '',
      origenDestino: '',
      fechaSalida: '',
      fechaRegreso: '',
      formaPagoId: '',
      cantAdultos: 1,
      cantNinos: 0,
      moneda: 'USD',
      observacion: ''
    });

    // Limpieza de los detalles de la cotización
    this.detallesFijos = [];
    this.gruposHoteles = [];
    this.deletedDetalleIds = [];

    // Reset de selección única de grupo
    this.grupoSeleccionadoId = null;

    // Reseteo de la selección de cliente
    this.clienteSeleccionado = null;
    this.buscandoClientes = false;

    // LA LÍNEA CLAVE (que ya tenías): Rellena la lista de clientes para que se muestre
    this.personasEncontradas = [...this.todosLosClientes];

    // Limpia el campo de búsqueda visualmente
    this.clienteSearchControl.setValue('', { emitEvent: false });
  }

  private setupDatesForNew(): void {
    // Crear fecha actual en zona horaria de Lima (UTC-5)
    const now = new Date();

    // Obtener la fecha actual en zona horaria de Lima
    const limaTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Lima"}));

    // Crear fecha de vencimiento el mismo día a las 11pm en hora de Lima
    const vencimiento = new Date(limaTime);
    vencimiento.setHours(23, 0, 0, 0); // 11:00 PM, 0 minutos, 0 segundos, 0 milisegundos

    // Si ya pasaron las 11pm del día actual, mover al siguiente día a las 11pm
    if (limaTime.getHours() >= 23) {
      vencimiento.setDate(vencimiento.getDate() + 1);
    }

    this.cotizacionForm.patchValue({
      fechaEmision: this.formatDateTimeLocal(limaTime),
      fechaVencimiento: this.formatDateTimeLocal(vencimiento),
      codigoCotizacion: this.generateNextCode()
    });
  }

  private formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  /**
   * Obtiene la fecha y hora actual en zona horaria de Lima (UTC-5)
   */
  private getCurrentLimaTime(): Date {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", {timeZone: "America/Lima"}));
  }

  /**
   * Obtiene la fecha y hora actual en formato ISO string para Lima
   */
  private getCurrentLimaISOString(): string {
    return this.getCurrentLimaTime().toISOString();
  }

  private generateNextCode(): string {
    const maxCotizacion = this.cotizaciones.reduce((max, cotizacion) => {
      const codigo = cotizacion.codigoCotizacion || '';
      const numero = parseInt(codigo.replace(/[^0-9]/g, '')) || 0;
      return Math.max(max, numero);
    }, 0);

    return `COT-${String(maxCotizacion + 1).padStart(3, '0')}`;
  }

  private async loadCotizacionCompleta(cotizacionId: number): Promise<void> {
    try {
      this.cotizacionCompleta = await this.cotizacionService.getCotizacionConDetalles(cotizacionId).toPromise() || null;

      if (!this.cotizacionCompleta) {
        throw new Error('No se pudo cargar la cotización completa');
      }

      // Si estamos editando, poblar el formulario
      if (this.editandoCotizacion) {
        await this.populateFormFromCotizacionCompleta(this.cotizacionCompleta);
      } else {
        // Si estamos visualizando, también cargar los detalles para mostrar los grupos seleccionados
        if (this.cotizacionCompleta.detalles && this.cotizacionCompleta.detalles.length > 0) {
          this.loadDetallesFromCotizacionCompleta(this.cotizacionCompleta.detalles, this.cotizacionCompleta);
        }
      }

    } catch (error) {

      this.showError('Error al cargar los datos completos de la cotización.');
      throw error;
    }
  }

  private async populateFormFromCotizacionCompleta(cotizacion: CotizacionConDetallesResponseDTO): Promise<void> {

    // Poblar formulario principal
    this.cotizacionForm.patchValue({
      codigoCotizacion: cotizacion.codigoCotizacion,
      personaId: cotizacion.personas?.id,
      fechaEmision: cotizacion.fechaEmision ? this.formatDateTimeLocal(new Date(cotizacion.fechaEmision)) : '',
      fechaVencimiento: cotizacion.fechaVencimiento ? this.formatDateTimeLocal(new Date(cotizacion.fechaVencimiento)) : '',
      estadoCotizacionId: cotizacion.estadoCotizacion?.id,
      sucursalId: cotizacion.sucursal?.id,
      origenDestino: cotizacion.origenDestino,
      fechaSalida: cotizacion.fechaSalida ? this.formatDateForInput(new Date(cotizacion.fechaSalida)) : '',
      fechaRegreso: cotizacion.fechaRegreso ? this.formatDateForInput(new Date(cotizacion.fechaRegreso)) : '',
      formaPagoId: cotizacion.formaPago?.id,
      cantAdultos: cotizacion.cantAdultos || 1,
      cantNinos: cotizacion.cantNinos || 0,
      moneda: cotizacion.moneda || 'USD',
      observacion: cotizacion.observacion || ''
    });



    // Cargar cliente si existe
    if (cotizacion.personas?.id) {
      await this.loadClienteForEdit(cotizacion.personas.id);
    }

    // Cargar detalles desde la respuesta completa
    if (cotizacion.detalles && cotizacion.detalles.length > 0) {

      this.loadDetallesFromCotizacionCompleta(cotizacion.detalles, cotizacion);
    }
  }

  private loadDetallesFromCotizacionCompleta(detalles: any[], cotizacionCompleta?: any): void {


    // Reset arrays
    this.detallesFijos = [];
    this.gruposHoteles = [];

    // Convertir detalles del DTO a formato local
    detalles.forEach((detalle, index) => {


      const detalleConverted = {
        id: detalle.id,
        proveedor: detalle.proveedor,
        producto: detalle.producto,
        categoria: detalle.categoria?.id || 1,
        descripcion: detalle.descripcion || 'Sin descripción',
        precioHistorico: detalle.precioHistorico || 0,
        comision: detalle.comision || 0,
        cantidad: detalle.cantidad || 1,
        unidad: detalle.unidad || 1,
        total: (detalle.precioHistorico || 0) + (detalle.comision || 0),
        isTemporary: false,
        seleccionado: detalle.seleccionado || false // Incluir el estado de selección real de BD
      };



      if (detalle.categoria?.id === 1) {
        // Productos fijos

        this.detallesFijos.push(detalleConverted);
      } else {
        // Grupos de hoteles

        this.addDetalleToGrupoHotelFromCompleta(detalleConverted, detalle.categoria);
      }
    });



    // NUEVA LÓGICA: Inferir qué grupo está seleccionado basándose en los detalles
    this.inferirGrupoSeleccionado();
  }

  /**
   * NUEVA LÓGICA: Infiere qué grupo está seleccionado basándose en si alguno de sus detalles tiene seleccionado=true
   */
  private inferirGrupoSeleccionado(): void {


    // Reset: ningún grupo seleccionado inicialmente
    this.grupoSeleccionadoId = null;
    this.gruposHoteles.forEach(grupo => grupo.seleccionado = false);

    // Buscar un grupo que tenga al menos un detalle seleccionado
    for (const grupo of this.gruposHoteles) {
      const tieneDetallesSeleccionados = grupo.detalles.some(detalle => detalle.seleccionado === true);

      if (tieneDetallesSeleccionados && grupo.categoria.id) {
        this.grupoSeleccionadoId = grupo.categoria.id;
        grupo.seleccionado = true;

        break; // Solo un grupo puede estar seleccionado
      }
    }

    if (!this.grupoSeleccionadoId) {

    }
  }

  private addDetalleToGrupoHotelFromCompleta(detalle: any, categoria: any): void {
    const categoriaId = categoria?.id;
    let grupo = this.gruposHoteles.find(g => g.categoria.id === categoriaId);

    if (!grupo && categoria) {
      grupo = {
        categoria: categoria,
        detalles: [],
        total: 0,
        isTemporary: false,
        seleccionado: false     // Inicializar como no seleccionado
      };
      this.gruposHoteles.push(grupo);
    }

    if (grupo) {
      grupo.detalles.push(detalle);
      grupo.total = grupo.detalles.reduce((sum, d) => sum + d.total, 0);
    }
  }

  private async loadCotizacionForEdit(cotizacion: CotizacionResponse): Promise<void> {
    this.cotizacionForm.patchValue({
      codigoCotizacion: cotizacion.codigoCotizacion,
      personaId: cotizacion.personas?.id,
      fechaEmision: cotizacion.fechaEmision ? this.formatDateTimeLocal(new Date(cotizacion.fechaEmision)) : '',
      fechaVencimiento: cotizacion.fechaVencimiento ? this.formatDateTimeLocal(new Date(cotizacion.fechaVencimiento)) : '',
      estadoCotizacionId: cotizacion.estadoCotizacion?.id,
      sucursalId: cotizacion.sucursal?.id,
      origenDestino: cotizacion.origenDestino,
      fechaSalida: cotizacion.fechaSalida ? this.formatDateForInput(new Date(cotizacion.fechaSalida)) : '',
      fechaRegreso: cotizacion.fechaRegreso ? this.formatDateForInput(new Date(cotizacion.fechaRegreso)) : '',
      formaPagoId: cotizacion.formaPago?.id,
      cantAdultos: cotizacion.cantAdultos || 1,
      cantNinos: cotizacion.cantNinos || 0,
      moneda: cotizacion.moneda || 'USD',
      observacion: cotizacion.observacion || ''
    });

    if (cotizacion.personas?.id)
      await this.loadClienteForEdit(cotizacion.personas.id);

    if (this.categorias.length === 0)
      await this.loadCategorias();

    // Load detalles
    try {
      const detalles = await this.detalleCotizacionService.getByCotizacionId(cotizacion.id).toPromise() || [];
      this.loadDetallesIntoForm(detalles);
    } catch (error) {
      this.showError('Error al cargar los detalles de la cotización.');
    }
  }

  private async loadClienteForEdit(personaId: number): Promise<void> {
    try {
      const persona = await this.personaService.findPersonaNaturalOrJuridicaById(personaId).toPromise();
      if (persona) {
        this.clienteSeleccionado = persona;

        // Actualizar el personasDisplayMap para la tabla
        const displayName = this.getClienteDisplayName(persona);
        this.personasDisplayMap[personaId] = displayName;

        return;
      }
    } catch (error) {

      this.showError('Error al cargar los datos del cliente para edición.');
    }
    // Si no se encuentra, resetea
    this.clienteSeleccionado = null;
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private loadDetallesIntoForm(detalles: DetalleCotizacionResponse[]): void {
    // Reset arrays
    this.detallesFijos = [];
    this.gruposHoteles = [];
    this.grupoSeleccionadoId = null; // NUEVO: Reset grupo seleccionado

    // Separate detalles by category
    detalles.forEach(detalle => {
      if (detalle.categoria?.id === 1) { // Productos fijos
        const detalleTemp = this.convertDetalleToTemp(detalle);
        this.detallesFijos.push(detalleTemp);
      } else { // Grupos de hoteles
        this.addDetalleToGrupoHotel(detalle);
      }
    });

    // NUEVO: Determinar qué grupo está seleccionado basado en detalles seleccionados
    this.determinarGrupoSeleccionado();
  }

  // NUEVO: Método para determinar qué grupo está seleccionado al cargar datos
  private determinarGrupoSeleccionado(): void {
    // IMPORTANTE: No tocar los productos fijos, solo procesar grupos de hoteles
    for (const grupo of this.gruposHoteles) {
      const tieneDetallesSeleccionados = grupo.detalles.some(detalle => detalle.seleccionado);

      if (tieneDetallesSeleccionados && grupo.categoria.id !== undefined) {
        // Si encontramos un grupo con detalles seleccionados, ese es el grupo activo
        this.grupoSeleccionadoId = grupo.categoria.id;
        grupo.seleccionado = true;

        // Asegurar que TODOS los detalles del grupo estén seleccionados (consistencia)
        grupo.detalles.forEach(detalle => {
          detalle.seleccionado = true;
        });


        return; // Solo puede haber un grupo seleccionado
      }
    }



    // Verificar que todos los productos fijos mantengan seleccionado=true
    this.detallesFijos.forEach(detalle => {
      detalle.seleccionado = true;
    });

  }

  private convertDetalleToTemp(detalle: DetalleCotizacionResponse): DetalleCotizacionTemp {
    const categoriaId = detalle.categoria?.id ?? detalle.categoria ?? 1;

    return {
      id: detalle.id,
      proveedor: detalle.proveedor,
      producto: detalle.producto,
      categoria: categoriaId, // Nunca undefined
      descripcion: detalle.descripcion || 'Sin descripción',
      precioHistorico: detalle.precioHistorico || 0,
      comision: detalle.comision || 0,
      cantidad: detalle.cantidad || 1,
      unidad: detalle.unidad || 1,
      total: (detalle.precioHistorico || 0) + (detalle.comision || 0),
      isTemporary: false,
      seleccionado: categoriaId === 1 ? true : (detalle.seleccionado || false)
    };
  }

  private addDetalleToGrupoHotel(detalle: DetalleCotizacionResponse): void {
    const categoriaId = detalle.categoria?.id;
    let grupo = this.gruposHoteles.find(g => g.categoria.id === categoriaId);
    if (!grupo) {
      const categoriaObj = this.categorias.find(c => c.id === categoriaId);

      if (categoriaObj) {
        grupo = {
          categoria: categoriaObj,
          detalles: [],
          total: 0,
          isTemporary: false,
          seleccionado: false
        };
        this.gruposHoteles.push(grupo);

      } else {
        return;
      }
    }

    if (grupo) {
      const detalleTemp = this.convertDetalleToTemp(detalle);
      grupo.detalles.push(detalleTemp);
      grupo.total = grupo.detalles.reduce((sum, d) => sum + d.total, 0);
    }
  }

  // Función para calcular el total en tiempo real del formulario de detalle
  // Total = (cantidad × precioUnitario) + comision
  calcularTotalDetalle(): number {
    const cantidad = this.detalleForm.get('cantidad')?.value || 0;
    const precioUnitario = this.detalleForm.get('precioHistorico')?.value || 0;
    const comision = this.detalleForm.get('comision')?.value || 0;
    return (cantidad * precioUnitario) + comision;
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
    } else if (formValue.nuevoProveedor?.trim()) {
      // This would create a new proveedor, for now we'll simulate it
      proveedor = {
        id: 0, // temporary ID
        nombre: formValue.nuevoProveedor.trim(),
        creado: this.getCurrentLimaISOString(),
        actualizado: this.getCurrentLimaISOString()
      } as ProveedorResponse;
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

    const nuevoDetalle: DetalleCotizacionTemp = {
      proveedor,
      producto,
      categoria: 1, // Productos fijos siempre categoria 1
      descripcion,
      precioHistorico,
      comision,
      cantidad,
      unidad,
      total: (precioHistorico * cantidad) + comision,
      isTemporary: true,
      seleccionado: true     // PRODUCTOS FIJOS siempre seleccionados
    };

    this.detallesFijos.unshift(nuevoDetalle); // Agregar al inicio de la lista

    // Limpiar TODOS los campos del formulario después de agregar
    this.detalleForm.patchValue({
      proveedorId: '',        // Limpiar proveedor
      productoId: '',         // Limpiar producto
      descripcion: '',        // Limpiar descripción
      precioHistorico: 0,     // Limpiar precio
      comision: 0,           // Limpiar comisión
      cantidad: 1            // Resetear cantidad a 1
    });

    // Mensaje de éxito
    this.successMessage = 'Producto agregado correctamente';
    setTimeout(() => this.successMessage = '', 3000);

  } eliminarDetalleFijo(index: number): void {
    const detalle = this.detallesFijos[index];
    if (detalle.id && !detalle.isTemporary) {
      this.deletedDetalleIds.push(detalle.id);
    }
    this.detallesFijos.splice(index, 1);
  }

  // Métodos para manejar cambios directos en productos editables
  onProductoChange(index: number, field: string, value: any): void {
    if (index >= 0 && index < this.detallesFijos.length) {
      const detalle = this.detallesFijos[index];

      switch (field) {
        case 'proveedorId':
          detalle.proveedor = value ? this.proveedores.find(p => p.id === Number(value)) || null : null;
          break;
        case 'productoId':
          detalle.producto = value ? this.productos.find(p => p.id === Number(value)) : undefined;
          break;
        case 'descripcion':
          detalle.descripcion = value || '';
          break;
        case 'cantidad':
          detalle.cantidad = Number(value) || 1;
          this.recalcularTotalDetalle(index);
          break;
        case 'precioHistorico':
          detalle.precioHistorico = Number(value) || 0;
          this.recalcularTotalDetalle(index);
          break;
        case 'comision':
          detalle.comision = Number(value) || 0;
          this.recalcularTotalDetalle(index);
          break;
      }
    }
  }

  // Recalcular total de un detalle específico
  recalcularTotalDetalle(index: number): void {
    if (index >= 0 && index < this.detallesFijos.length) {
      const detalle = this.detallesFijos[index];
      detalle.total = (detalle.precioHistorico * detalle.cantidad) + detalle.comision;
    }
  }

  // Método para manejar cambios en productos de grupos de hoteles
  onGrupoProductoChange(groupIndex: number, detailIndex: number, field: string, value: any): void {
    if (groupIndex >= 0 && groupIndex < this.gruposHoteles.length) {
      const grupo = this.gruposHoteles[groupIndex];
      if (detailIndex >= 0 && detailIndex < grupo.detalles.length) {
        const detalle = grupo.detalles[detailIndex];

        switch (field) {
          case 'proveedorId':
            detalle.proveedor = value ? this.proveedores.find(p => p.id === Number(value)) || null : null;
            break;
          case 'productoId':
            detalle.producto = value ? this.productos.find(p => p.id === Number(value)) : undefined;
            break;
          case 'cantidad':
            detalle.cantidad = Number(value) || 1;
            this.recalcularTotalDetalleGrupo(groupIndex, detailIndex);
            break;
          case 'descripcion':
            detalle.descripcion = value || '';
            break;
          case 'precioHistorico':
            detalle.precioHistorico = Number(value) || 0;
            this.recalcularTotalDetalleGrupo(groupIndex, detailIndex);
            break;
          case 'comision':
            detalle.comision = Number(value) || 0;
            this.recalcularTotalDetalleGrupo(groupIndex, detailIndex);
            break;
        }

        // Recalcular total del grupo
        grupo.total = grupo.detalles.reduce((sum, d) => sum + d.total, 0);
      }
    }
  }

  // Recalcular total de un detalle específico en un grupo
  recalcularTotalDetalleGrupo(groupIndex: number, detailIndex: number): void {
    if (groupIndex >= 0 && groupIndex < this.gruposHoteles.length) {
      const grupo = this.gruposHoteles[groupIndex];
      if (detailIndex >= 0 && detailIndex < grupo.detalles.length) {
        const detalle = grupo.detalles[detailIndex];
        detalle.total = (detalle.precioHistorico * detalle.cantidad) + (detalle.comision || 0);
      }
    }
  }

  undoEliminarDetalle(): void {
    // This would restore the last deleted item - for now just remove from deleted array
    if (this.deletedDetalleIds.length > 0) {
      this.deletedDetalleIds.pop();
    }
  }

  // Grupo hoteles methods
  async crearGrupoHotel(): Promise<void> {
    if (this.grupoHotelForm.invalid) {
      this.markFormGroupTouched(this.grupoHotelForm);
      return;
    }

    if (this.categorias.length === 0) {
      await this.loadCategorias();
    }

    const categoriaValue = this.grupoHotelForm.value.categoria;
    const categoriaId = typeof categoriaValue === 'object' && categoriaValue !== null
      ? categoriaValue.id
      : Number(categoriaValue);

    if (!categoriaId || isNaN(categoriaId)) {
      return;
    }

    const categoriaObj = this.categorias.find(c => c.id === categoriaId);

    if (categoriaObj && !this.gruposHoteles.find(g => g.categoria.id === categoriaId)) {
      const nuevoGrupo: GrupoHotelTemp = {
        categoria: categoriaObj,
        detalles: [],
        total: 0,
        isTemporary: true,
        seleccionado: false     // Inicializar como no seleccionado
      };
      this.gruposHoteles.push(nuevoGrupo);
      this.grupoHotelForm.reset();
    } else if (!categoriaObj) {
    }
  }

  eliminarGrupoHotel(index: number): void {
    const grupo = this.gruposHoteles[index];

    // Add all detalle IDs to deleted array
    grupo.detalles.forEach(detalle => {
      if (detalle.id && !detalle.isTemporary) {
        this.deletedDetalleIds.push(detalle.id);
      }
    });

    this.gruposHoteles.splice(index, 1);
  }

  // Gestión de grupos de hoteles
  mostrarVistaGestionGrupos(): void {
    this.mostrarGestionGrupos = true;
  }

  cerrarVistaGestionGrupos(): void {
    this.mostrarGestionGrupos = false;
  }

  // ===== MÉTODOS DE SELECCIÓN DE GRUPOS =====

  /**
   * Selecciona UN SOLO grupo de hotel (selección única)
   * Deselecciona todos los otros grupos automáticamente
   */
  seleccionarGrupoUnico(grupoIndex: number): void {
    if (grupoIndex >= 0 && grupoIndex < this.gruposHoteles.length) {
      const grupoSeleccionado = this.gruposHoteles[grupoIndex];
      const categoriaId = grupoSeleccionado.categoria.id;


      // Si ya está seleccionado, lo deseleccionamos
      if (this.grupoSeleccionadoId === categoriaId) {
        this.grupoSeleccionadoId = null;
        grupoSeleccionado.seleccionado = false;
        // NUEVO: Marcar todos los detalles como NO seleccionados
        grupoSeleccionado.detalles.forEach(detalle => {
          detalle.seleccionado = false;
        });

      } else {
        // Deseleccionar todos los grupos primero
        this.gruposHoteles.forEach(grupo => {
          grupo.seleccionado = false;
          // NUEVO: Marcar todos los detalles como NO seleccionados
          grupo.detalles.forEach(detalle => {
            detalle.seleccionado = false;
          });
        });

        // Seleccionar solo el grupo actual si tiene ID válido
        if (categoriaId !== undefined) {
          this.grupoSeleccionadoId = categoriaId;
          grupoSeleccionado.seleccionado = true;
          // NUEVO: Marcar todos los detalles del grupo seleccionado como seleccionados
          grupoSeleccionado.detalles.forEach(detalle => {
            detalle.seleccionado = true;
          });

        }
      }
    } else {

    }
  }

  /**
   * Verifica si un grupo está seleccionado
   */
  isGrupoSeleccionado(grupoIndex: number): boolean {
    if (grupoIndex >= 0 && grupoIndex < this.gruposHoteles.length) {
      const grupo = this.gruposHoteles[grupoIndex];
      const categoriaId = grupo.categoria.id;
      return categoriaId !== undefined && this.grupoSeleccionadoId === categoriaId;
    }
    return false;
  }

  /**
   * Obtiene el grupo actualmente seleccionado
   */
  getGrupoSeleccionado(): GrupoHotelTemp | null {
    if (this.grupoSeleccionadoId === null) {
      return null;
    }

    return this.gruposHoteles.find(grupo =>
      grupo.categoria.id === this.grupoSeleccionadoId
    ) || null;
  }

  /**
   * Obtiene todos los detalles del grupo seleccionado
   */
  getDetallesGrupoSeleccionado(): DetalleCotizacionTemp[] {
    const grupoSeleccionado = this.getGrupoSeleccionado();
    return grupoSeleccionado ? grupoSeleccionado.detalles : [];
  }

  /**
   * Obtiene el grupo seleccionado para visualización (detecta automáticamente si hay múltiples grupos)
   * Si solo hay un grupo con detalles, se considera seleccionado para visualización
   */
  getGrupoSeleccionadoEnVisualizacion(): GrupoHotelTemp | null {

    // NO re-inferir aquí para evitar bucle infinito
    // La inferencia ya se hizo al cargar los detalles

    // Devolver el grupo que está marcado como seleccionado
    if (this.grupoSeleccionadoId) {
      const grupoSeleccionado = this.gruposHoteles.find(g => g.categoria.id === this.grupoSeleccionadoId);
      if (grupoSeleccionado) {

        return grupoSeleccionado;
      }
    }


    return null;
  }

  /**
   * Verifica si un grupo está seleccionado en modo visualización
   */
  isGrupoSeleccionadoEnVisualizacion(grupoIndex: number): boolean {
    if (grupoIndex >= 0 && grupoIndex < this.gruposHoteles.length) {
      const grupo = this.gruposHoteles[grupoIndex];
      const grupoSeleccionado = this.getGrupoSeleccionadoEnVisualizacion();

      if (grupoSeleccionado && grupo.categoria.id) {
        return grupo.categoria.id === grupoSeleccionado.categoria.id;
      }
    }
    return false;
  }

  /**
   * Selecciona o deselecciona un detalle individual
   * Actualiza el estado del grupo padre según los detalles seleccionados
   */
  seleccionarDetalleGrupo(grupoIndex: number, detalleIndex: number, seleccionado: boolean): void {
    if (grupoIndex >= 0 && grupoIndex < this.gruposHoteles.length) {
      const grupo = this.gruposHoteles[grupoIndex];
      if (detalleIndex >= 0 && detalleIndex < grupo.detalles.length) {
        grupo.detalles[detalleIndex].seleccionado = seleccionado;

        // Actualizar el estado del grupo basado en los detalles seleccionados
        const detallesSeleccionados = grupo.detalles.filter(d => d.seleccionado).length;
        const totalDetalles = grupo.detalles.length;

        if (detallesSeleccionados === 0) {
          grupo.seleccionado = false;
        } else if (detallesSeleccionados === totalDetalles) {
          grupo.seleccionado = true;
        } else {
          grupo.seleccionado = undefined; // Estado intermedio (algunos seleccionados)
        }
      }
    }
  }

  /**
   * Obtiene todos los detalles seleccionados de todos los grupos
   */
  obtenerDetallesSeleccionados(): DetalleCotizacionTemp[] {
    const detallesSeleccionados: DetalleCotizacionTemp[] = [];

    this.gruposHoteles.forEach(grupo => {
      grupo.detalles.forEach(detalle => {
        if (detalle.seleccionado) {
          detallesSeleccionados.push(detalle);
        }
      });
    });

    return detallesSeleccionados;
  }

  /**
   * Obtiene información de selección para mostrar al usuario (selección única)
   */
  obtenerEstadoSeleccion(): { gruposSeleccionados: number, detallesSeleccionados: number, totalGrupos: number, totalDetalles: number, grupoSeleccionado: GrupoHotelTemp | null } {
    const grupoSeleccionado = this.getGrupoSeleccionado();
    const gruposSeleccionados = grupoSeleccionado ? 1 : 0;
    const detallesSeleccionados = grupoSeleccionado ? grupoSeleccionado.detalles.length : 0;

    let totalDetalles = 0;
    this.gruposHoteles.forEach(grupo => {
      totalDetalles += grupo.detalles.length;
    });

    return {
      gruposSeleccionados,
      detallesSeleccionados,
      totalGrupos: this.gruposHoteles.length,
      totalDetalles,
      grupoSeleccionado
    };
  }

  /**
   * Deselecciona todos los grupos y detalles
   */
  deseleccionarTodos(): void {
    this.gruposHoteles.forEach(grupo => {
      grupo.seleccionado = false;
      grupo.detalles.forEach(detalle => {
        detalle.seleccionado = false;
      });
    });
  }

  /**
   * TrackBy function para optimizar *ngFor de grupos
   */
  trackByGrupoId(index: number, grupo: GrupoHotelTemp): any {
    return grupo.categoria.id;
  }

  /**
   * Cuenta los detalles seleccionados en un grupo específico
   */
  contarDetallesSeleccionados(grupo: GrupoHotelTemp): number {
    return grupo.detalles.filter(d => d.seleccionado).length;
  }

  /**
   * Guarda las selecciones actuales en el servidor
   * Solo guarda detalles que tienen ID (no temporales)
   */
  async guardarSelecciones(): Promise<void> {

    if (!this.editandoCotizacion || !this.cotizacionEditandoId) {
      this.showError('Debe estar editando una cotización para guardar selecciones');
      return;
    }

    try {
      this.isLoading = true;

      if (!this.grupoSeleccionadoId) {
        this.showError('Debe seleccionar un grupo de hotel antes de guardar selecciones');
        return;
      }

      // Recopilar solo las selecciones del grupo seleccionado
      const selecciones: {detalleId: number, seleccionado: boolean}[] = [];

      // Buscar el grupo seleccionado
      const grupoSeleccionado = this.gruposHoteles.find(g => g.categoria.id === this.grupoSeleccionadoId);

      if (!grupoSeleccionado) {
        this.showError('No se encontró el grupo seleccionado');
        return;
      }

      // Agregar solo los detalles del grupo seleccionado
      grupoSeleccionado.detalles.forEach(detalle => {
        if (detalle.id) {
          selecciones.push({
            detalleId: detalle.id,
            seleccionado: true // Los detalles del grupo seleccionado deben marcarse como seleccionados
          });
        }
      });

      // También incluir productos fijos (siempre seleccionados)
      this.detallesFijos.forEach(detalle => {
        if (detalle.id) {
          selecciones.push({
            detalleId: detalle.id,
            seleccionado: true // Los productos fijos siempre están seleccionados
          });
        }
      });

      // Marcar como NO seleccionados los detalles de otros grupos
      this.gruposHoteles.forEach(grupo => {
        if (grupo.categoria.id !== this.grupoSeleccionadoId) {
          grupo.detalles.forEach(detalle => {
            if (detalle.id) {
              selecciones.push({
                detalleId: detalle.id,
                seleccionado: false // Los detalles de otros grupos deben marcarse como NO seleccionados
              });
            }
          });
        }
      });

      if (selecciones.length === 0) {
        this.showError('No hay detalles para actualizar selecciones');
        return;
      }



      // Actualizar cada detalle con PATCH para cambiar solo el campo 'seleccionado'
      for (const seleccion of selecciones) {
        await this.detalleCotizacionService.updateDetalleCotizacion(seleccion.detalleId, { seleccionado: seleccion.seleccionado }).toPromise();
      }

      const detallesSeleccionados = selecciones.filter(s => s.seleccionado).length;
      this.showSuccess(`Selecciones guardadas exitosamente: ${detallesSeleccionados} detalles seleccionados del grupo "${grupoSeleccionado.categoria.nombre}"`);

    } catch (error) {

      this.showError('Error al guardar las selecciones. Por favor, intente nuevamente.');
    } finally {
      this.isLoading = false;
    }
  }

  // Obtener total de opciones en todos los grupos
  getTotalOpcionesGrupos(): number {
    return this.gruposHoteles.reduce((total, grupo) => total + grupo.detalles.length, 0);
  }

  // Duplicar un grupo completo
  duplicarGrupoHotel(index: number): void {
    if (index >= 0 && index < this.gruposHoteles.length) {
      const grupoOriginal = this.gruposHoteles[index];
      const grupoDuplicado: GrupoHotelTemp = {
        categoria: { ...grupoOriginal.categoria },
        detalles: grupoOriginal.detalles.map(detalle => ({
          ...detalle,
          proveedor: detalle.proveedor ? { ...detalle.proveedor } : undefined,
          producto: detalle.producto ? { ...detalle.producto } : undefined,
          isTemporary: true
        })),
        isTemporary: true,
        total: grupoOriginal.total
      };

      // Agregar "(Copia)" al nombre de la categoría
      if (grupoDuplicado.categoria.nombre) {
        grupoDuplicado.categoria.nombre = `${grupoOriginal.categoria.nombre} (Copia)`;
      }
      this.gruposHoteles.push(grupoDuplicado);
    }
  }

  // Duplicar una opción específica dentro de un grupo
  duplicarDetalleGrupo(grupoIndex: number, detalleIndex: number): void {
    if (grupoIndex >= 0 && grupoIndex < this.gruposHoteles.length) {
      const grupo = this.gruposHoteles[grupoIndex];
      if (detalleIndex >= 0 && detalleIndex < grupo.detalles.length) {
        const detalleOriginal = grupo.detalles[detalleIndex];
        const detalleDuplicado: DetalleCotizacionTemp = {
          ...detalleOriginal,
          proveedor: detalleOriginal.proveedor ? { ...detalleOriginal.proveedor } : undefined,
          producto: detalleOriginal.producto ? { ...detalleOriginal.producto } : undefined,
          isTemporary: true
        };

        grupo.detalles.push(detalleDuplicado);
        // Recalcular el total del grupo
        grupo.total = grupo.detalles.reduce((sum, det) => sum + det.total, 0);
      }
    }
  }

  // Limpiar todos los grupos
  limpiarTodosLosGrupos(): void {
    if (confirm('¿Estás seguro de que quieres eliminar todos los grupos? Esta acción no se puede deshacer.')) {
      this.gruposHoteles = [];
    }
  }

  // Exportar grupos a JSON
  exportarGrupos(): void {
    const datosExport = {
      fecha: this.getCurrentLimaISOString(),
      totalGrupos: this.gruposHoteles.length,
      totalOpciones: this.getTotalOpcionesGrupos(),
      valorTotal: this.calcularTotalGrupos(),
      grupos: this.gruposHoteles
    };

    const dataStr = JSON.stringify(datosExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `grupos-hoteles-${this.getCurrentLimaISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  // Crear nuevo grupo desde formulario
  crearNuevaCategoria(): void {
    if (this.nuevaCategoriaForm.invalid) {
      this.markFormGroupTouched(this.nuevaCategoriaForm);
      return;
    }

    this.creandoCategoria = true;
    const formValue = this.nuevaCategoriaForm.value;

    // Crear nueva categoría
    const nuevaCategoria: CategoriaRequest = {
      nombre: formValue.nombre
    };

    // Llamar al servicio para crear la categoría
    this.categoriaService.create(nuevaCategoria).subscribe({
      next: (response) => {
        // Agregar a la lista local
        this.categorias.push(response);
        this.limpiarFormularioNuevaCategoria();
        this.creandoCategoria = false;
        this.showSuccess(`Categoría "${formValue.nombre}" creada exitosamente!`);
      },
      error: (error) => {
        this.showError('Error al crear la categoría. Por favor, intente nuevamente.');
        this.creandoCategoria = false;
      }
    });
  }

  // Limpiar formulario de nueva categoría
  limpiarFormularioNuevaCategoria(): void {
    this.nuevaCategoriaForm.reset();
    this.markFormGroupUntouched(this.nuevaCategoriaForm);
  }

  // Editar categoría existente
  editarCategoria(index: number): void {
    if (index >= 0 && index < this.categorias.length) {
      this.categoriaEditandose = index;
      // Guardar datos originales para poder cancelar
      this.categoriaDatosOriginales = {
        nombre: this.categorias[index].nombre
      };
    }
  }

  // Guardar edición de categoría
  guardarEdicionCategoria(index: number): void {
    if (index >= 0 && index < this.categorias.length) {
      const categoria = this.categorias[index];

      // Validar que el nombre no esté vacío
      if (!categoria.nombre || categoria.nombre.trim().length < 3) {
        this.showError('El nombre de la categoría debe tener al menos 3 caracteres');
        return;
      }

      // Crear objeto para actualizar
      const categoriaActualizada: CategoriaRequest = {
        nombre: categoria.nombre
      };

      // Llamar al servicio para actualizar
      this.categoriaService.update(categoria.id!, categoriaActualizada).subscribe({
        next: (response) => {
          this.categorias[index] = response;
          this.categoriaEditandose = null;
          this.categoriaDatosOriginales = null;
          this.showSuccess('Categoría actualizada exitosamente!');
        },
        error: (error) => {
          this.showError('Error al actualizar la categoría. Por favor, intente nuevamente.');
          // Restaurar datos originales en caso de error
          this.cancelarEdicionCategoria(index);
        }
      });
    }
  }

  // Cancelar edición de categoría
  cancelarEdicionCategoria(index: number): void {
    if (index >= 0 && index < this.categorias.length && this.categoriaDatosOriginales) {
      // Restaurar datos originales
      this.categorias[index].nombre = this.categoriaDatosOriginales.nombre;
      this.categoriaEditandose = null;
      this.categoriaDatosOriginales = null;
    }
  }

  // Confirmar eliminación de categoría con diálogo
  confirmarEliminarCategoria(index: number): void {
    if (index >= 0 && index < this.categorias.length) {
      const categoria = this.categorias[index];
      const mensaje = `¿Estás seguro de que quieres eliminar la categoría "${categoria.nombre}"?\n\n` +
        `Esta acción no se puede deshacer y podría afectar grupos existentes.`;

      if (confirm(mensaje)) {
        this.eliminarCategoria(index);
      }
    }
  }

  // Eliminar categoría
  eliminarCategoria(index: number): void {
    if (index >= 0 && index < this.categorias.length) {
      const categoria = this.categorias[index];

      this.categoriaService.delete(categoria.id!).subscribe({
        next: () => {
          this.categorias.splice(index, 1);
          this.showSuccess('Categoría eliminada exitosamente');
        },
        error: (error) => {
          this.showError('Error al eliminar la categoría. Puede estar en uso por grupos existentes.');
        }
      });
    }
  }

  // Contar categorías (todas están activas ya que no hay campo activo/inactivo)
  contarCategoriasActivas(): number {
    return this.categorias.length;
  }

  // Verificar si una categoría está activa (todas lo están)
  esCategoriaActiva(categoria: any): boolean {
    return true; // Todas las categorías están activas
  }

  // Formatear fecha para mostrar
  formatearFecha(fecha: any): string {
    if (!fecha) return 'N/A';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Marcar todos los controles como untouched
  private markFormGroupUntouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsUntouched();
      control?.markAsPristine();
    });
  }

  agregarDetalleAGrupo(grupoIndex: number): void {
    if (this.detalleForm.invalid) {
      this.markFormGroupTouched(this.detalleForm);
      return;
    }

    const grupo = this.gruposHoteles[grupoIndex];
    const formValue = this.detalleForm.value;

    let proveedor: ProveedorResponse | null = null;
    if (formValue.proveedorId) {
      const proveedorId = Number(formValue.proveedorId);
      proveedor = this.proveedores.find(p => p.id === proveedorId) || null;


    } else if (formValue.nuevoProveedor?.trim()) {
      proveedor = {
        id: 0,
        nombre: formValue.nuevoProveedor.trim(),
        creado: this.getCurrentLimaISOString(),
        actualizado: this.getCurrentLimaISOString()
      } as ProveedorResponse;

    }

    const producto = this.productos.find(p => p.id === Number(formValue.productoId));
    const descripcion = formValue.descripcion?.trim() || 'Sin descripción';
    const precioHistorico = formValue.precioHistorico || 0;
    const comision = 0; // Siempre 0 para grupo hotel
    const cantidad = formValue.cantidad || 1;
    const unidad = formValue.unidad || 1;

    const nuevoDetalle: DetalleCotizacionTemp = {
      proveedor,
      producto,
      categoria: grupo.categoria.id ?? 1,
      descripcion,
      precioHistorico,
      comision,
      cantidad,
      unidad,
      total: precioHistorico + comision,
      isTemporary: true,
      seleccionado: false     // Inicializar como no seleccionado
    };

    grupo.detalles.push(nuevoDetalle);
    grupo.total = grupo.detalles.reduce((sum, d) => sum + d.total, 0);
    this.detalleForm.reset({
      cantidad: 1,
      unidad: 1,
      precioHistorico: 0
    });
  }

  eliminarDetalleDeGrupo(grupoIndex: number, detalleIndex: number): void {
    const grupo = this.gruposHoteles[grupoIndex];
    const detalle = grupo.detalles[detalleIndex];

    if (detalle.id && !detalle.isTemporary) {
      this.deletedDetalleIds.push(detalle.id);
    }

    grupo.detalles.splice(detalleIndex, 1);
    grupo.total = grupo.detalles.reduce((sum, d) => sum + d.total, 0);
  }

  // Calculate totals
  calcularTotalFijos(): number {
    return this.detallesFijos.reduce((sum, detalle) => sum + detalle.total, 0);
  }

  calcularTotalGrupos(): number {
    return this.gruposHoteles.reduce((sum, grupo) => sum + grupo.total, 0);
  }

  calcularCotizacionEconomica(): number {
    const totalFijos = this.calcularTotalFijos();

    if (this.gruposHoteles.length === 0) {
      return totalFijos;
    }

    const grupoMasEconomico = Math.min(...this.gruposHoteles.map(g => g.total));
    return totalFijos + grupoMasEconomico;
  }

  // Form submission
  async onSubmitCotizacion(): Promise<void> {
    if (this.cotizacionForm.invalid) {
      this.markFormGroupTouched(this.cotizacionForm);
      return;
    }

    // Validar personaId: debe existir y ser el ID real retornado por el backend
    let formValue = this.cotizacionForm.getRawValue();
    if (!formValue.personaId || formValue.personaId === 0) {
      this.showError('Debes seleccionar o registrar un cliente antes de guardar la cotización.');
      return;
    }

    this.isLoading = true;

    try {
      const formValue = this.cotizacionForm.value;
      let cotizacionResponse: CotizacionResponse;

      if (this.editandoCotizacion && this.cotizacionEditandoId) {
        // ===== UPDATE con PATCH (actualización parcial) =====
        const patchPayload = this.buildPatchPayload(formValue);

        // Incluir relaciones (ids) en el PATCH si están presentes o cambiaron
        const relationFields: (keyof CotizacionPatchRequest)[] = [
          'counterId',
          'formaPagoId',
          'estadoCotizacionId',
          'sucursalId',
          'carpetaId'
        ];

        relationFields.forEach(field => {
          const val = (formValue as any)[field as string];
          const originalVal = this.cotizacionOriginal ? (this.cotizacionOriginal as any)[field as string] : undefined;
          if (val !== undefined && val !== null && val !== '' && val !== originalVal) {
            (patchPayload as any)[field] = val;
          }
        });

        // Si hay cambios, enviar PATCH; si no, mostrar mensaje
        if (Object.keys(patchPayload).length === 0) {
          this.showSuccess('No hay cambios que guardar.');
          this.isLoading = false;
          return;
        }

        // Sanitizar fechas y formatos antes de enviar
        const sanitized = this.sanitizePatchPayload(patchPayload);

        console.log('🚀 PATCH Payload:', sanitized);

        const updateResult = await this.cotizacionService
          .updateCotizacion(this.cotizacionEditandoId, sanitized)
          .toPromise();

        if (!updateResult) throw new Error('Failed to update cotización');
        cotizacionResponse = updateResult;

        // Handle deleted detalles
        await this.eliminarDetallesEliminados();

        this.showSuccess('Cotización actualizada exitosamente!');
      } else {
        // ===== CREATE con POST (creación completa) =====
        const cotizacionRequest: CotizacionRequest = {
          cantAdultos: formValue.cantAdultos,
          cantNinos: formValue.cantNinos,
          fechaVencimiento: formValue.fechaVencimiento,
          origenDestino: formValue.origenDestino,
          fechaSalida: formValue.fechaSalida,
          fechaRegreso: formValue.fechaRegreso,
          moneda: formValue.moneda,
          observacion: formValue.observacion || '',
          // Incluir relaciones en el create si vienen del formulario
          counterId: formValue.counterId,
          formaPagoId: formValue.formaPagoId,
          estadoCotizacionId: formValue.estadoCotizacionId,
          sucursalId: formValue.sucursalId,
          carpetaId: formValue.carpetaId
        };

  let createResult: CotizacionResponse | undefined = undefined;
        if (formValue.personaId) {
          // Si se seleccionó una persona, usar el endpoint que crea la cotización vinculada a la persona
          createResult = await this.cotizacionService.createCotizacionWithPersona(formValue.personaId, cotizacionRequest).toPromise();
        } else {
          createResult = await this.cotizacionService.createCotizacion(cotizacionRequest).toPromise();
        }
        if (!createResult) throw new Error('Failed to create cotización');
        cotizacionResponse = createResult;

  // Ya incluimos las relaciones en el payload de creación (si vienen)

        this.showSuccess('Cotización creada exitosamente!');
      }

      // Create/update detalles
      await this.procesarDetalles(cotizacionResponse.id);

      // Reload data and close form
      await this.loadCotizaciones();
      this.cerrarFormulario();
    } catch (error) {
      console.error('Error al guardar cotización:', error);
      this.showError('Error al guardar la cotización. Por favor, verifique los datos e intente nuevamente.');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Construye un payload PATCH con solo los campos que han cambiado
   * Compara el formulario actual con los datos originales de la cotización
   */
  private buildPatchPayload(formValue: any): CotizacionPatchRequest {
    const patch: CotizacionPatchRequest = {};

    if (!this.cotizacionOriginal) {
      return patch;
    }

    // Campos a comparar para el PATCH
    const fieldsToCheck: (keyof CotizacionRequest)[] = [
      'cantAdultos',
      'cantNinos',
      'origenDestino',
      'fechaSalida',
      'fechaRegreso',
      'moneda',
      'observacion',
      'fechaVencimiento'
    ];

    fieldsToCheck.forEach(field => {
      const newValue = formValue[field];
      const originalValue = this.cotizacionOriginal![field as keyof CotizacionResponse];

      // Si el valor cambió, agregarlo al patch
      if (newValue !== undefined && newValue !== null && newValue !== originalValue) {
        patch[field] = newValue;
      }
    });

    return patch;
  }

  /**
   * Sanitiza el payload PATCH para asegurar que las fechas estén en formato ISO
   */
  private sanitizePatchPayload(patch: CotizacionPatchRequest): CotizacionPatchRequest {
    const sanitized: CotizacionPatchRequest = {};

    Object.keys(patch).forEach(key => {
      let value: any = patch[key as keyof CotizacionPatchRequest];

      // Convertir Date objects a string ISO
      if (value instanceof Date) {
        value = (value as Date).toISOString().split('T')[0]; // YYYY-MM-DD
      }

      sanitized[key as keyof CotizacionPatchRequest] = value;
    });

    return sanitized;
  }

  // Relaciones ahora se envían como parte del payload de creación/actualización (PATCH/POST)

  private async eliminarDetallesEliminados(): Promise<void> {
    const deletePromises = this.deletedDetalleIds.map(id =>
      this.detalleCotizacionService.deleteDetalleCotizacion(id).toPromise()
    );

    await Promise.all(deletePromises);
    this.deletedDetalleIds = [];
  }

  private async procesarDetalles(cotizacionId: number): Promise<void> {
    // Process productos fijos (categoria ID = 1)
    for (const detalle of this.detallesFijos) {
      if (detalle.isTemporary) {
        await this.crearDetalle(cotizacionId, detalle, 1);
      } else if (detalle.id) {
        await this.actualizarDetalle(detalle);
      }
    }

    // Process grupos de hoteles
    for (const grupo of this.gruposHoteles) {
      for (const detalle of grupo.detalles) {
        if (detalle.isTemporary) {
          const categoria = grupo.categoria.id;
          if (categoria) {
            await this.crearDetalle(cotizacionId, detalle, categoria);
          }
        } else if (detalle.id) {
          await this.actualizarDetalle(detalle);
        }
      }
    }
  }

  private async crearDetalle(cotizacionId: number, detalle: DetalleCotizacionTemp, categoria: number): Promise<void> {

    const categoriaExiste = this.categorias.find(c => c.id === categoria);

    if (!categoriaExiste) {
      throw new Error(`Categoría con ID ${categoria} no encontrada en el frontend`);
    }

    // Validar datos críticos
    if (!cotizacionId) {
      throw new Error('cotizacionId no puede ser null');
    }
    if (!categoria) {
      throw new Error('categoria no puede ser null');
    }

    // Create proveedor if needed
    let proveedorId = detalle.proveedor?.id;
    if (detalle.proveedor && detalle.proveedor.id === 0) {
      const nuevoProveedor = await this.proveedorService.createProveedor({
        nombre: detalle.proveedor.nombre
      }).toPromise();
      proveedorId = nuevoProveedor?.id;
    }

    const productoId = detalle.producto?.id;
    const request: DetalleCotizacionRequest = {
      cantidad: detalle.cantidad || 1,                   // Default 1
      unidad: detalle.unidad || 1,                       // Default 1
      descripcion: detalle.descripcion || '',            // Default empty
      categoria: categoria,                              // Mantener para compatibilidad local
      categoriaId: categoria,                            // Enviar categoriaId al backend
      productoId: productoId,                            // Enviar productoId si existe
      proveedorId: proveedorId,                          // Enviar proveedorId si existe
      comision: detalle.comision || 0,                   // Default 0
      precioHistorico: detalle.precioHistorico || 0,     // Default 0
      seleccionado: detalle.seleccionado || false        // Campo de selección
    };

    // Validación final antes de enviar
    if (!request.categoria) {
      throw new Error('categoria es requerido para crear detalle');
    }

    const detalleCreado = await this.detalleCotizacionService.createDetalleCotizacion(cotizacionId, request).toPromise();

    // NOTA: Los endpoints setProducto() y setProveedor() no existen en el backend actual.
    // El producto y proveedor deben incluirse en el payload al crear el detalle.
    // Si necesitas usar esos endpoints, debes implementarlos en el backend primero.

    // if (detalleCreado && detalle.producto) {
    //   await this.detalleCotizacionService.setProducto(detalleCreado.id, detalle.producto.id).toPromise();
    // }

    // if (detalleCreado && proveedorId) {
    //   await this.detalleCotizacionService.setProveedor(detalleCreado.id, proveedorId).toPromise();
    // }
  }

  private async actualizarDetalle(detalle: DetalleCotizacionTemp): Promise<void> {
    if (!detalle.id) return;

    // Enviamos también la categoría
    let categoriaId: number;
    if (typeof detalle.categoria === 'object' && detalle.categoria !== null && 'id' in detalle.categoria) {
      categoriaId = (detalle.categoria as any).id;
    } else {
      categoriaId = detalle.categoria as number;
    }
    const productoId = detalle.producto?.id;
    const proveedorId = detalle.proveedor?.id;

    const request: DetalleCotizacionRequest = {
      cantidad: detalle.cantidad || 1,
      unidad: (detalle.unidad !== undefined && detalle.unidad !== null) ? detalle.unidad : 0,
      descripcion: detalle.descripcion || '',
      categoria: categoriaId,
      categoriaId: categoriaId,
      productoId: productoId,
      proveedorId: proveedorId,
      comision: detalle.comision || 0,
      precioHistorico: detalle.precioHistorico || 0,
      seleccionado: detalle.seleccionado || false        // Campo de selección
    };

    await this.detalleCotizacionService.updateDetalleCotizacion(detalle.id, request).toPromise();
  }

  // Iniciar proceso de eliminación por presión mantenida
  iniciarEliminacion(cotizacion: CotizacionResponse): void {
    this.cotizacionAEliminar = cotizacion;
    this.presionandoEliminar = true;
    this.tiempoPresionado = 0;

    // Intervalo que cuenta cada 100ms
    this.intervaloPulsacion = setInterval(() => {
      this.tiempoPresionado += 100;

      // Mostrar progreso en consola cada segundo
      if (this.tiempoPresionado % 1000 === 0)

        // Después de 3 segundos (3000ms), proceder con eliminación
        if (this.tiempoPresionado >= 3000) {
          this.completarEliminacion();
        }
    }, 100);
  }

  // Cancelar proceso de eliminación
  cancelarEliminacion(): void {
    this.presionandoEliminar = false;
    this.tiempoPresionado = 0;
    this.cotizacionAEliminar = null;

    if (this.intervaloPulsacion) {
      clearInterval(this.intervaloPulsacion);
      this.intervaloPulsacion = null;
    }
  }

  // Completar eliminación después de 3 segundos
  completarEliminacion(): void {
    if (this.cotizacionAEliminar) {
      const cotizacion = this.cotizacionAEliminar;
      this.cancelarEliminacion(); // Limpiar estado
      this.eliminarCotizacionDirectamente(cotizacion.id);
    }
  }

  // Obtener porcentaje de progreso para mostrar visualmente
  getPorcentajeProgreso(): number {
    return Math.min((this.tiempoPresionado / 3000) * 100, 100);
  }

  // Función para acceder a Math en el template
  getMath() {
    return Math;
  }

  private async eliminarCotizacionDirectamente(id: number): Promise<void> {
    this.isLoading = true;

    try {
      await this.cotizacionService.deleteByIdCotizacion(id).toPromise();
      await this.loadCotizaciones();
      this.showSuccess('Cotización eliminada exitosamente.');
    } catch (error) {
      this.showError('Error al eliminar la cotización. Por favor, inténtelo de nuevo.');
    } finally {
      this.isLoading = false;
    }
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
    // Usar EXACTAMENTE el mismo código que liquidaciones
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

  /**
   * Obtiene solo el número de documento del cliente por su ID
   */
  getPersonaDocumento(personaId: number): string {
    if (!personaId || personaId === 0) {
      return 'Sin documento';
    }

    // Buscar en el cache
    if (this.personasCache[personaId]) {
      const cached = this.personasCache[personaId];
      if (cached.identificador) {
        return `${cached.tipo === 'JURIDICA' ? 'RUC' : 'DNI'}: ${cached.identificador}`;
      }
      return 'Sin documento';
    }


    return 'Documento no disponible';
  }

  /**
   * Agrega una persona al cache
   */
  private addPersonaToCache(persona: any): void {
    if (!persona.id) return;

    this.personasCache[persona.id] = {
      id: persona.id,
      identificador: persona.ruc || persona.documento || persona.cedula || '',
      nombre: persona.razonSocial || `${persona.nombres || ''} ${persona.apellidos || ''}`.trim() || 'Sin nombre',
      tipo: persona.ruc ? 'JURIDICA' : 'NATURAL'
    };

    const cached = this.personasCache[persona.id];
    if (cached.identificador) {
      this.personasDisplayMap[persona.id] = `${cached.tipo === 'JURIDICA' ? 'RUC' : 'DNI'}: ${cached.identificador} - ${cached.nombre}`;
    } else {
      this.personasDisplayMap[persona.id] = cached.nombre;
    }
  }

  /**
   * Carga una persona que falta en el cache de forma asíncrona
   */
  private loadMissingPersona(personaId: number): void {
    // Evitar cargas duplicadas
    if (this.loadingPersonas.has(personaId)) {
      return;
    }

    this.loadingPersonas.add(personaId);

    // Cargar persona de forma asíncrona
    this.personaService.findPersonaNaturalOrJuridicaById(personaId).toPromise()
      .then(persona => {
        if (persona) {
          this.todosLosClientes.push(persona);
          this.addPersonaToCache(persona);
          // Forzar actualización de la vista
          this.filterCotizaciones();
        }
      })
      .catch(error => {

      })
      .finally(() => {
        this.loadingPersonas.delete(personaId);
      });
  }

  getEstadoBadgeClass(estado: EstadoCotizacionResponse | null | undefined): string {
    if (!estado) {
      return 'bg-gray-100 text-gray-800'; // estilo por defecto para estados null/undefined
    }

    const descripcion = estado.descripcion?.toLowerCase();
    switch (descripcion) {
      case 'aprobada':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'rechazada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES');
  }

  formatDateTime(dateString: string | undefined): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('es-ES');
  }

  getCategoriasDisponibles(): CategoriaResponse[] {
    if (this.categorias.length === 0) {
      return [];
    }

    const categoriasUsadas = this.gruposHoteles.map(g => g.categoria.id);
    const disponibles = this.categorias.filter(c => c.id !== 1 && !categoriasUsadas.includes(c.id));

    return disponibles;
  }

  trackByCotizacion(index: number, cotizacion: CotizacionResponse): number {
    return cotizacion.id;
  }

  // ===== MÉTODOS PARA MODAL DE VISTA =====
  getTotalCotizacionCompleta(): number {
    if (!this.cotizacionCompleta?.detalles) return 0;

    const totalFijos = this.getTotalProductosFijos();

    // Obtener las categorías no fijas (excluyendo categoría 1)
    const categoriasNoFijas = this.getCategoriasNoFijas();

    if (categoriasNoFijas.length === 0) {
      return totalFijos;
    }

    // Calcular el total de cada categoría y obtener el más económico
    const totalesPorCategoria = categoriasNoFijas.map(categoria =>
      this.getTotalCategoria(this.getDetallesByCategoria(categoria.id))
    );

    const grupoMasEconomico = Math.min(...totalesPorCategoria);

    return totalFijos + grupoMasEconomico;
  }

  getDetallesByCategoria(categoriaId: number): any[] {
    if (!this.cotizacionCompleta?.detalles) return [];
    return this.cotizacionCompleta.detalles.filter(detalle => detalle.categoria?.id === categoriaId);
  }

  getCategoriasConDetalles(): any[] {
    if (!this.cotizacionCompleta?.detalles) return [];

    const categoriasMap = new Map();

    this.cotizacionCompleta.detalles.forEach(detalle => {
      const categoriaId = detalle.categoria?.id || 1;
      const categoriaNombre = detalle.categoria?.nombre || 'Productos Fijos';

      if (!categoriasMap.has(categoriaId)) {
        categoriasMap.set(categoriaId, {
          id: categoriaId,
          nombre: categoriaNombre,
          detalles: []
        });
      }

      categoriasMap.get(categoriaId).detalles.push(detalle);
    });

    return Array.from(categoriasMap.values());
  }

  // ============================================
  // CLIENT SEARCH METHODS (SIMPLIFIED)
  // ============================================

  private async buscarClientesEnTiempoReal(searchTerm: string): Promise<(PersonaNaturalResponse | PersonaJuridicaResponse)[]> {
    if (!searchTerm || searchTerm.length < 1) {
      // Si no hay término de búsqueda, mostrar todos los clientes (primeros 20)
      return this.todosLosClientes.slice(0, 20);
    }

    try {
      const term = searchTerm.toLowerCase();
      const resultados: (PersonaNaturalResponse | PersonaJuridicaResponse)[] = [];

      // Filtrar todos los clientes cargados
      const clientesFiltrados = this.todosLosClientes.filter(persona => {
        if ('nombres' in persona && 'apellidos' in persona) {
          // Persona Natural
          const nombres = (persona.nombres || '').toLowerCase();
          const apellidos = (persona.apellidos || '').toLowerCase();
          const documento = (persona.documento || '').toLowerCase();
          const nombreCompleto = `${nombres} ${apellidos}`.trim();

          return nombres.includes(term) ||
            apellidos.includes(term) ||
            documento.includes(term) ||
            nombreCompleto.includes(term);
        } else if ('razonSocial' in persona) {
          // Persona Jurídica
          const razonSocial = (persona.razonSocial || '').toLowerCase();
          const ruc = (persona.ruc || '').toLowerCase();

          return razonSocial.includes(term) || ruc.includes(term);
        }
        return false;
      });

      // Ordenar por relevancia (exactitud de coincidencia)
      clientesFiltrados.sort((a, b) => {
        const aText = this.getClienteDisplayName(a).toLowerCase();
        const bText = this.getClienteDisplayName(b).toLowerCase();

        const aStartsWith = aText.startsWith(term);
        const bStartsWith = bText.startsWith(term);

        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;

        return aText.length - bText.length; // Más corto = más relevante
      });

      return clientesFiltrados.slice(0, 20); // Máximo 20 resultados

    } catch (error) {
      return this.todosLosClientes.slice(0, 20); // Fallback a mostrar todos
    }
  }

  clearClienteSearch(): void {
    this.clienteSearchControl.setValue('', { emitEvent: false });
    // Al limpiar, asegurar que se muestren todos los clientes
    if (this.personas.length > 0) {
      this.todosLosClientes = [...this.personas];
      this.personasEncontradas = [...this.todosLosClientes];
    }
    this.buscandoClientes = false;
  }

  resetClienteSeleccionado(): void {
    this.clienteSeleccionado = null;
    this.cotizacionForm.patchValue({ personaId: '' });
    this.clearClienteSearch();
  }

  seleccionarCliente(persona: PersonaNaturalResponse | PersonaJuridicaResponse): void {
    // Usar el FK de la tabla persona base si existe, si no el id propio
    const personaId = typeof (persona as any).persona === 'object'
      ? (persona as any).persona.id
      : (persona as any).persona || persona.id;

    this.clienteSeleccionado = persona;
    this.cotizacionForm.patchValue({ personaId: personaId });
    this.clearClienteSearch();
  }

  getClienteType(persona: any): string {
    if (!persona) return 'Cliente';
    // Si es personaDisplay (nuevo modelo unificado)
    if ('tipo' in persona) return persona.tipo === 'JURIDICA' ? 'Persona Jurídica' : 'Persona Natural';
    // Compatibilidad con modelos antiguos
    if ('ruc' in persona && persona.ruc) return 'Persona Jurídica';

    return 'Persona Natural';
  }

  getClienteDocumento(persona: any): string {
    if (!persona) return '';
    // Si es persona jurídica, devolver RUC
    if ('ruc' in persona && persona.ruc) return persona.ruc;
    // Si es persona natural, devolver documento
    if ('documento' in persona && persona.documento) return persona.documento;

    return '';
  }

  hasDocumento(persona: any): boolean {
    if (!persona) return false;

    return ('documento' in persona && persona.documento) || ('ruc' in persona && persona.ruc);
  }

  getSelectedClienteName(): string {
    if (!this.clienteSeleccionado) return '';
    return this.getClienteDisplayName(this.clienteSeleccionado);
  }

  getClienteDisplayName(persona: any): string {
    // Soporta personaDisplay, PersonaNaturalResponse y PersonaJuridicaResponse
    if (!persona) return 'Cliente';
    // Si es personaDisplay (nuevo modelo unificado)
    if ('tipo' in persona && 'identificador' in persona && 'nombre' in persona) {
      if (persona.tipo === 'JURIDICA') {
        return `RUC: ${persona.identificador} - ${persona.nombre}`;
      } else {
        return `DNI: ${persona.identificador} - ${persona.nombre}`;
      }
    }
    // Compatibilidad con modelos antiguos
    if ('nombres' in persona && 'apellidos' in persona) {
      const doc = persona.documento ? ` - ${persona.documento}` : '';
      return `${persona.nombres || ''} ${persona.apellidos || ''}${doc}`.trim();
    }
    if ('razonSocial' in persona) {
      const ruc = persona.ruc ? ` - RUC: ${persona.ruc}` : '';
      return `${persona.razonSocial || 'Empresa'}${ruc}`.trim();
    }
    return 'Cliente';
  }

  // Métodos para estadísticas en el header
  getTotalCotizaciones(): number {
    return this.cotizaciones.length;
  }

  getCotizacionesPendientes(): number {
    return this.cotizaciones.filter(cot =>
      cot.estadoCotizacion?.descripcion?.toLowerCase() === 'pendiente'
    ).length;
  }

  getCotizacionesAprobadas(): number {
    return this.cotizaciones.filter(cot =>
      cot.estadoCotizacion?.descripcion?.toLowerCase() === 'aprobada'
    ).length;
  }

  getCotizacionesPorConfirmar(): number {
    return this.cotizaciones.filter(cot =>
      cot.estadoCotizacion?.descripcion?.toLowerCase() === 'pendiente'
    ).length;
  }

  // Modal management
  abrirModalCrear(): void {
    this.editandoCotizacion = false;
    this.cotizacionSeleccionada = null;
    this.cotizacionForm.reset();
    this.mostrarModalCrear = true;
  }

  refreshData(): void {
    this.loadCotizaciones();
  }

  editarSeleccionados(): void {
    if (this.selectedItems.length === 0) {
      this.showError('Debe seleccionar al menos una cotización para editar.');
      return;
    }

    if (this.selectedItems.length === 1) {
      const cotizacion = this.cotizaciones.find(c => c.id === this.selectedItems[0]);
      if (cotizacion) {
        this.mostrarFormularioEditar(cotizacion);
      } else {
        this.showError('No se encontró la cotización seleccionada.');
      }
    } else {
      this.showError('Solo puede editar una cotización a la vez. Seleccione únicamente una cotización.');
    }
  }

  updateSelectionState(): void {
    const totalItems = this.filteredCotizaciones.length;
    const selectedCount = this.selectedItems.length;
    this.allSelected = selectedCount === totalItems && totalItems > 0;
    this.someSelected = selectedCount > 0 && selectedCount < totalItems;
  }

  // Métodos para acciones masivas
  clearSelection(): void {
    this.selectedItems = [];
    this.updateSelectionState();
  }

  eliminarSeleccionados(): void {
    if (this.selectedItems.length === 0) return;

    const confirmMessage = `¿Está seguro de eliminar ${this.selectedItems.length} cotización${this.selectedItems.length > 1 ? 'es' : ''}?\n\nEsta acción no se puede deshacer.`;
    if (confirm(confirmMessage)) {
      this.isLoading = true;
      let eliminados = 0;
      const total = this.selectedItems.length;

      this.selectedItems.forEach(id => {
        const cotizacion = this.cotizaciones.find(c => c.id === id);
        if (cotizacion) {
          this.cotizacionService.deleteByIdCotizacion(id).subscribe({
            next: () => {
              eliminados++;
              if (eliminados === total) {
                this.loadCotizaciones();
                this.clearSelection();
                this.isLoading = false;
                this.showSuccess(`${total} cotización${total > 1 ? 'es' : ''} eliminada${total > 1 ? 's' : ''} exitosamente.`);
              }
            },
            error: (error: any) => {
              this.showError('Error al eliminar algunas cotizaciones. Por favor, revise e intente nuevamente.');
              eliminados++;
              if (eliminados === total) {
                this.loadCotizaciones();
                this.clearSelection();
                this.isLoading = false;
              }
            }
          });
        } else {
          eliminados++;
          if (eliminados === total) {
            this.loadCotizaciones();
            this.clearSelection();
            this.isLoading = false;
          }
        }
      });
    }
  }

  calcularEstadisticas(): void {
    this.totalCotizaciones = this.cotizaciones.length;
  }


  get totalPages(): number {
    const itemsPerPageNum = Number(this.itemsPerPage);
    return Math.ceil(this.totalItems / itemsPerPageNum);
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
      this.selectedItems = this.filteredCotizaciones.map(c => c.id!);
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

  // ===== SIDEBAR FILTERING =====
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
}
