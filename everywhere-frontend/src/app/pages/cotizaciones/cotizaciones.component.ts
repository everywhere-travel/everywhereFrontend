import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
import { CategoriaService } from '../../core/service/Categoria/categoria.service';

// Models
import { CotizacionRequest, CotizacionResponse } from '../../shared/models/Cotizacion/cotizacion.model';
import { DetalleCotizacionRequest, DetalleCotizacionResponse } from '../../shared/models/Cotizacion/detalleCotizacion.model';
import { PersonaResponse } from '../../shared/models/Persona/persona.model';
import { PersonaNaturalResponse } from '../../shared/models/Persona/personaNatural.model';
import { PersonaJuridicaResponse } from '../../shared/models/Persona/personaJuridica.models';
import { FormaPagoResponse } from '../../shared/models/FormaPago/formaPago.model';
import { EstadoCotizacionResponse } from '../../shared/models/Cotizacion/estadoCotizacion.model';
import { SucursalResponse } from '../../shared/models/Sucursal/sucursal.model';
import { ProductoResponse } from '../../shared/models/Producto/producto.model';
import { ProveedorResponse } from '../../shared/models/Proveedor/proveedor.model';
import { CategoriaResponse } from '../../shared/models/Categoria/categoria.model';

// Components
import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';

interface DetalleCotizacionTemp {
  id?: number;
  proveedor?: ProveedorResponse | null;
  producto?: ProductoResponse;
  descripcion: string;
  precioHistorico: number;
  comision: number;
  cantidad: number;
  unidad: number;
  total: number;
  isTemporary?: boolean;
}

interface GrupoHotelTemp {
  categoria: CategoriaResponse;
  detalles: DetalleCotizacionTemp[];
  total: number;
  isTemporary?: boolean;
}

@Component({
  selector: 'app-cotizaciones',
  standalone: true,
  templateUrl: './cotizaciones.component.html',
  styleUrls: ['./cotizaciones.component.css'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SidebarComponent]
})
export class CotizacionesComponent implements OnInit, OnDestroy {
  
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

  // State variables
  isLoading = false;
  mostrarFormulario = false;
  editandoCotizacion = false;
  cotizacionEditandoId: number | null = null;

  // Sidebar
  sidebarCollapsed = false;
  sidebarMenuItems: SidebarMenuItem[] = [
    {
      id: 'cotizaciones',
      title: 'Cotizaciones',
      icon: 'fas fa-file-invoice-dollar',
      route: '/cotizaciones',
      active: true
    },
    {
      id: 'personas',
      title: 'Personas',
      icon: 'fas fa-users',
      route: '/personas'
    },
    {
      id: 'liquidaciones',
      title: 'Liquidaciones',
      icon: 'fas fa-calculator',
      route: '/liquidaciones'
    },
    {
      id: 'reportes',
      title: 'Reportes',
      icon: 'fas fa-chart-bar',
      route: '/reportes'
    }
  ];

  // Forms
  searchForm!: FormGroup;
  cotizacionForm!: FormGroup;
  detalleForm!: FormGroup;
  grupoHotelForm!: FormGroup;

  // Data arrays
  cotizaciones: CotizacionResponse[] = [];
  personas: any[] = [];
  formasPago: FormaPagoResponse[] = [];
  estadosCotizacion: EstadoCotizacionResponse[] = [];
  sucursales: SucursalResponse[] = [];
  productos: ProductoResponse[] = [];
  proveedores: ProveedorResponse[] = [];
  categorias: CategoriaResponse[] = [];

  // Detalle cotización arrays
  detallesFijos: DetalleCotizacionTemp[] = [];
  gruposHoteles: GrupoHotelTemp[] = [];
  deletedDetalleIds: number[] = [];

  // Search and pagination
  searchTerm = '';
  filteredCotizaciones: CotizacionResponse[] = [];

  // Client selection variables (only the ones not in FormGroup)
  personasEncontradas: (PersonaNaturalResponse | PersonaJuridicaResponse)[] = [];
  buscandoClientes = false;
  clienteSeleccionado: PersonaNaturalResponse | PersonaJuridicaResponse | null = null;

  constructor() {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadInitialData();
  }

  private initializeForms(): void {
    // Search form
    this.searchForm = this.fb.group({
      searchTerm: ['']
    });

    // Cotización form
    this.cotizacionForm = this.fb.group({
      codigoCotizacion: [{ value: '', disabled: true }],
      personaId: ['', [Validators.required]],
      fechaEmision: [{ value: '', disabled: true }],
      fechaVencimiento: [{ value: '', disabled: true }],
      estadoCotizacionId: ['', [Validators.required]],
      sucursalId: ['', [Validators.required]],
      origenDestino: ['', [Validators.required]],
      fechaSalida: ['', [Validators.required]],
      fechaRegreso: ['', [Validators.required]],
      formaPagoId: ['', [Validators.required]],
      cantAdultos: [1, [Validators.required, Validators.min(1)]],
      cantNinos: [0, [Validators.min(0)]],
      moneda: ['USD', [Validators.required]],
      observacion: [''],
      // Client selection fields
      tipoClienteSeleccionado: [''],
      criterioBusquedaNatural: ['nombres'],
      criterioBusquedaJuridica: ['ruc'],
      terminoBusquedaCliente: ['']
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
  }

  private loadInitialData(): void {
    this.isLoading = true;
    
    // Load all required data in parallel
    Promise.all([
      this.loadCotizaciones(),
      this.loadPersonas(),
      this.loadFormasPago(),
      this.loadEstadosCotizacion(),
      this.loadSucursales(),
      this.loadProductos(),
      this.loadProveedores(),
      this.loadCategorias()
    ]).finally(() => {
      this.isLoading = false;
    });
  }

  private async loadCotizaciones(): Promise<void> {
    try {
      console.log('📋 Cargando cotizaciones...');
      this.cotizaciones = await this.cotizacionService.getAllCotizaciones().toPromise() || [];
      console.log('📋 Cotizaciones cargadas:', this.cotizaciones.length, this.cotizaciones);
      this.filterCotizaciones();
      console.log('📋 Cotizaciones filtradas:', this.filteredCotizaciones.length, this.filteredCotizaciones);
    } catch (error) {
      console.error('❌ Error loading cotizaciones:', error);
      this.cotizaciones = [];
    }
  }

  private async loadPersonas(): Promise<void> {
    try {
      const personasResult = await this.personaService.findAll().toPromise();
      this.personas = personasResult || [];
    } catch (error) {
      console.error('Error loading personas:', error);
      this.personas = [];
    }
  }

  private async loadFormasPago(): Promise<void> {
    try {
      this.formasPago = await this.formaPagoService.getAllFormasPago().toPromise() || [];
    } catch (error) {
      console.error('Error loading formas pago:', error);
      this.formasPago = [];
    }
  }

  private async loadEstadosCotizacion(): Promise<void> {
    try {
      this.estadosCotizacion = await this.estadoCotizacionService.getAllEstadosCotizacion().toPromise() || [];
    } catch (error) {
      console.error('Error loading estados cotización:', error);
      this.estadosCotizacion = [];
    }
  }

  private async loadSucursales(): Promise<void> {
    try {
      this.sucursales = await this.sucursalService.findAllSucursal().toPromise() || [];
    } catch (error) {
      console.error('Error loading sucursales:', error);
      this.sucursales = [];
    }
  }

  private async loadProductos(): Promise<void> {
    try {
      this.productos = await this.productoService.getAllProductos().toPromise() || [];
    } catch (error) {
      console.error('Error loading productos:', error);
      this.productos = [];
    }
  }

  private async loadProveedores(): Promise<void> {
    try {
      this.proveedores = await this.proveedorService.findAllProveedor().toPromise() || [];
    } catch (error) {
      console.error('Error loading proveedores:', error);
      this.proveedores = [];
    }
  }

  private async loadCategorias(): Promise<void> {
    try {
      console.log('🔍 Iniciando carga de categorías...');
      console.log('🌐 Base URL:', environment.baseURL);
      console.log('📡 Llamando al servicio de categorías...');
      
      // 🔄 Limpiar array antes de cargar nuevos datos
      this.categorias = [];
      
      const response = await this.categoriaService.findAll().toPromise();
      console.log('📥 Respuesta del servicio:', response);
      
      this.categorias = response || [];
      console.log('✅ Categorías cargadas:', this.categorias.length, this.categorias);
      
      // 🔍 Verificar que tenemos categorías válidas
      if (this.categorias.length === 0) {
        console.warn('⚠️ ADVERTENCIA: No se cargaron categorías. Verificar conexión con backend.');
      } else {
        console.log('🎉 Categorías disponibles:');
        this.categorias.forEach(cat => console.log(`   - ID: ${cat.id}, Nombre: ${cat.nombre}`));
      }
      
    } catch (error) {
      console.error('❌ Error loading categorías:', error);
      console.error('❌ Detalles del error:', JSON.stringify(error, null, 2));
      
      // 🔍 Información adicional de debugging
      if (error && typeof error === 'object') {
        console.error('❌ Error status:', (error as any).status);
        console.error('❌ Error message:', (error as any).message);
        console.error('❌ Error URL:', (error as any).url);
      }
      
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

  // Search and filter methods
  private filterCotizaciones(): void {
    if (!this.searchTerm.trim()) {
      this.filteredCotizaciones = [...this.cotizaciones];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredCotizaciones = this.cotizaciones.filter(cotizacion =>
        cotizacion.codigoCotizacion?.toLowerCase().includes(term) ||
        this.getPersonaDisplayName(cotizacion.persona?.id || 0).toLowerCase().includes(term) ||
        cotizacion.origenDestino?.toLowerCase().includes(term)
      );
    }
  }

  // Form methods
  async mostrarFormularioCrear(): Promise<void> {
    this.resetForm();
    this.mostrarFormulario = true;
    this.editandoCotizacion = false;
    this.setupDatesForNew();
    
    // 🔄 Cargar categorías cada vez que se abre el formulario de creación
    console.log('🔄 Cargando categorías para nuevo formulario...');
    await this.loadCategorias();
  }

  async mostrarFormularioEditar(cotizacion: CotizacionResponse): Promise<void> {
    this.editandoCotizacion = true;
    this.cotizacionEditandoId = cotizacion.id;
    this.mostrarFormulario = true;
    
    // 🔄 Cargar categorías cada vez que se abre el formulario de edición
    console.log('🔄 Cargando categorías para edición...');
    await this.loadCategorias();
    
    this.loadCotizacionForEdit(cotizacion);
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.editandoCotizacion = false;
    this.cotizacionEditandoId = null;
    this.resetForm();
  }

  private resetForm(): void {
    this.cotizacionForm.reset({
      cantAdultos: 1,
      cantNinos: 0,
      moneda: 'USD',
      tipoClienteSeleccionado: '',
      criterioBusquedaNatural: 'nombres',
      criterioBusquedaJuridica: 'ruc',
      terminoBusquedaCliente: ''
    });
    this.detallesFijos = [];
    this.gruposHoteles = [];
    this.deletedDetalleIds = [];
    
    // Reset client selection variables
    this.personasEncontradas = [];
    this.clienteSeleccionado = null;
    this.buscandoClientes = false;
  }

  private setupDatesForNew(): void {
    const now = new Date();
    const vencimiento = new Date(now.getTime() + (20 * 60 * 60 * 1000)); // 20 horas después

    this.cotizacionForm.patchValue({
      fechaEmision: this.formatDateTimeLocal(now),
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

  private generateNextCode(): string {
    const maxCotizacion = this.cotizaciones.reduce((max, cotizacion) => {
      const codigo = cotizacion.codigoCotizacion || '';
      const numero = parseInt(codigo.replace(/[^0-9]/g, '')) || 0;
      return Math.max(max, numero);
    }, 0);
    
    return `COT-${String(maxCotizacion + 1).padStart(3, '0')}`;
  }

  private async loadCotizacionForEdit(cotizacion: CotizacionResponse): Promise<void> {
    // Set form values
    this.cotizacionForm.patchValue({
      codigoCotizacion: cotizacion.codigoCotizacion,
      personaId: cotizacion.persona?.id,
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

    // Load client information for the new selector
    if (cotizacion.persona?.id) {
      await this.loadClienteForEdit(cotizacion.persona.id);
    }

    // Load detalles
    try {
      const detalles = await this.detalleCotizacionService.getByCotizacionId(cotizacion.id).toPromise() || [];
      this.loadDetallesIntoForm(detalles);
    } catch (error) {
      console.error('Error loading detalles:', error);
    }
  }

  private async loadClienteForEdit(personaId: number): Promise<void> {
    // First try to find in personas naturales
    try {
      const personasNaturales = await this.personaNaturalService.findAll().toPromise() || [];
      const personaNatural = personasNaturales.find(p => p.id === personaId);
      
      if (personaNatural) {
        this.cotizacionForm.patchValue({ tipoClienteSeleccionado: 'natural' });
        this.clienteSeleccionado = personaNatural;
        return;
      }
    } catch (error) {
      console.error('Error loading persona natural:', error);
    }

    // If not found, try personas juridicas
    try {
      const personasJuridicas = await this.personaJuridicaService.findAll().toPromise() || [];
      const personaJuridica = personasJuridicas.find(p => p.id === personaId);
      
      if (personaJuridica) {
        this.cotizacionForm.patchValue({ tipoClienteSeleccionado: 'juridica' });
        this.clienteSeleccionado = personaJuridica;
        return;
      }
    } catch (error) {
      console.error('Error loading persona juridica:', error);
    }

    // If not found in either, reset
    this.cotizacionForm.patchValue({ tipoClienteSeleccionado: '' });
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

    // Separate detalles by category
    detalles.forEach(detalle => {
      if (detalle.categoria === 1) {
        // Productos fijos
        this.detallesFijos.push(this.convertDetalleToTemp(detalle));
      } else {
        // Grupos de hoteles
        this.addDetalleToGrupoHotel(detalle);
      }
    });
  }

  private convertDetalleToTemp(detalle: DetalleCotizacionResponse): DetalleCotizacionTemp {
    return {
      id: detalle.id,
      proveedor: detalle.proveedor,
      producto: detalle.producto,
      descripcion: detalle.descripcion || 'Sin descripción',
      precioHistorico: detalle.precioHistorico || 0,
      comision: detalle.comision || 0,
      cantidad: detalle.cantidad || 1,
      unidad: detalle.unidad || 1,
      total: (detalle.precioHistorico || 0) + (detalle.comision || 0),
      isTemporary: false
    };
  }

  private addDetalleToGrupoHotel(detalle: DetalleCotizacionResponse): void {
    const categoria = detalle.categoria;
    let grupo = this.gruposHoteles.find(g => g.categoria.id === categoria);
    
    if (!grupo) {
      const categoriaObj = this.categorias.find(c => c.id === categoria);
      if (categoriaObj) {
        grupo = {
          categoria: categoriaObj,
          detalles: [],
          total: 0,
          isTemporary: false
        };
        this.gruposHoteles.push(grupo);
      }
    }

    if (grupo) {
      grupo.detalles.push(this.convertDetalleToTemp(detalle));
      grupo.total = grupo.detalles.reduce((sum, d) => sum + d.total, 0);
    }
  }

  // Detalle cotización methods (Productos Fijos)
  agregarDetalleFijo(): void {
    if (this.detalleForm.invalid) {
      this.markFormGroupTouched(this.detalleForm);
      return;
    }

    const formValue = this.detalleForm.value;
    console.log('🔍 DEBUG Form Value:', formValue);
    
    let proveedor = null;

    // Handle proveedor
    if (formValue.proveedorId) {
      const proveedorId = Number(formValue.proveedorId);
      proveedor = this.proveedores.find(p => p.id === proveedorId) || null;
      console.log('🔍 DEBUG Proveedor encontrado por ID:', proveedor);
      console.log('🔍 DEBUG proveedorId convertido:', proveedorId, 'original:', formValue.proveedorId);
    } else if (formValue.nuevoProveedor?.trim()) {
      // This would create a new proveedor, for now we'll simulate it
      proveedor = {
        id: 0, // temporary ID
        nombre: formValue.nuevoProveedor.trim(),
        creado: new Date().toISOString(),
        actualizado: new Date().toISOString()
      } as ProveedorResponse;
      console.log('🔍 DEBUG Nuevo proveedor creado:', proveedor);
    }

    const producto = this.productos.find(p => p.id === Number(formValue.productoId));
    console.log('🔍 DEBUG productoId del form:', formValue.productoId, 'convertido:', Number(formValue.productoId));
    console.log('🔍 DEBUG producto encontrado:', producto);
    console.log('🔍 DEBUG todos los productos disponibles:', this.productos.map(p => ({id: p.id, producto: p})));
    
    const descripcion = formValue.descripcion?.trim() || 'Sin descripción';
    const precioHistorico = formValue.precioHistorico || 0;
    const comision = formValue.comision || 0;
    const cantidad = formValue.cantidad || 1;
    const unidad = formValue.unidad || 1;

    const nuevoDetalle: DetalleCotizacionTemp = {
      proveedor,
      producto,
      descripcion,
      precioHistorico,
      comision,
      cantidad,
      unidad,
      total: precioHistorico + comision,
      isTemporary: true
    };

    this.detallesFijos.push(nuevoDetalle);
    this.detalleForm.reset({
      cantidad: 1,
      unidad: 1,
      comision: 0,
      precioHistorico: 0
    });
  }

  eliminarDetalleFijo(index: number): void {
    const detalle = this.detallesFijos[index];
    if (detalle.id && !detalle.isTemporary) {
      this.deletedDetalleIds.push(detalle.id);
    }
    this.detallesFijos.splice(index, 1);
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

    // 🔄 Asegurar que las categorías estén cargadas
    if (this.categorias.length === 0) {
      console.log('🔄 Categorías vacías, recargando...');
      await this.loadCategorias();
    }

    const categoria = this.grupoHotelForm.value.categoria;
    const categoriaObj = this.categorias.find(c => c.id === categoria);
    
    if (categoriaObj && !this.gruposHoteles.find(g => g.categoria.id === categoria)) {
      const nuevoGrupo: GrupoHotelTemp = {
        categoria: categoriaObj,
        detalles: [],
        total: 0,
        isTemporary: true
      };
      
      this.gruposHoteles.push(nuevoGrupo);
      this.grupoHotelForm.reset();
      console.log('✅ Grupo de hotel creado para categoría:', categoriaObj.nombre);
    } else if (!categoriaObj) {
      console.error('❌ Categoría no encontrada:', categoria);
      console.error('❌ Categorías disponibles:', this.categorias);
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

  agregarDetalleAGrupo(grupoIndex: number): void {
    if (this.detalleForm.invalid) {
      this.markFormGroupTouched(this.detalleForm);
      return;
    }

    const grupo = this.gruposHoteles[grupoIndex];
    const formValue = this.detalleForm.value;
    console.log('🔍 DEBUG Form Value (Grupo):', formValue);
    
    let proveedor: ProveedorResponse | null = null;
    if (formValue.proveedorId) {
      const proveedorId = Number(formValue.proveedorId);
      proveedor = this.proveedores.find(p => p.id === proveedorId) || null;
      console.log('🔍 DEBUG Proveedor encontrado por ID (Grupo):', proveedor);
      console.log('🔍 DEBUG proveedorId convertido (Grupo):', proveedorId, 'original:', formValue.proveedorId);
    } else if (formValue.nuevoProveedor?.trim()) {
      proveedor = {
        id: 0,
        nombre: formValue.nuevoProveedor.trim(),
        creado: new Date().toISOString(),
        actualizado: new Date().toISOString()
      } as ProveedorResponse;
      console.log('🔍 DEBUG Nuevo proveedor creado (Grupo):', proveedor);
    }

    const producto = this.productos.find(p => p.id === Number(formValue.productoId));
    console.log('🔍 DEBUG productoId del form (Grupo):', formValue.productoId, 'convertido:', Number(formValue.productoId));
    console.log('🔍 DEBUG producto encontrado (Grupo):', producto);
    
    const descripcion = formValue.descripcion?.trim() || 'Sin descripción';
    const precioHistorico = formValue.precioHistorico || 0;
    const comision = formValue.comision || 0;
    const cantidad = formValue.cantidad || 1;
    const unidad = formValue.unidad || 1;

    const nuevoDetalle: DetalleCotizacionTemp = {
      proveedor,
      producto,
      descripcion,
      precioHistorico,
      comision,
      cantidad,
      unidad,
      total: precioHistorico + comision,
      isTemporary: true
    };

    grupo.detalles.push(nuevoDetalle);
    grupo.total = grupo.detalles.reduce((sum, d) => sum + d.total, 0);
    
    this.detalleForm.reset({
      cantidad: 1,
      unidad: 1,
      comision: 0,
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

    this.isLoading = true;
    console.log('🚀 Iniciando flujo de cotización secuencial...');

    try {
      const formValue = this.cotizacionForm.value;
      
      // Prepare cotización request
      const cotizacionRequest: CotizacionRequest = {
        cantAdultos: formValue.cantAdultos,
        cantNinos: formValue.cantNinos,
        fechaVencimiento: formValue.fechaVencimiento,
        origenDestino: formValue.origenDestino,
        fechaSalida: formValue.fechaSalida,
        fechaRegreso: formValue.fechaRegreso,
        moneda: formValue.moneda,
        observacion: formValue.observacion || ''
      };

      let cotizacionResponse: CotizacionResponse;

      if (this.editandoCotizacion && this.cotizacionEditandoId) {
        console.log('📝 Actualizando cotización existente...');
        // Update existing cotización
        const updateResult = await this.cotizacionService.updateCotizacion(this.cotizacionEditandoId, cotizacionRequest).toPromise();
        if (!updateResult) throw new Error('Failed to update cotización');
        cotizacionResponse = updateResult;
        console.log('✅ Cotización actualizada:', cotizacionResponse.id);
        
        // Set relationships
        console.log('🔗 Asignando relaciones secuencialmente...');
        await this.setRelacionesCotizacion(cotizacionResponse.id, formValue);
        
        // Handle deleted detalles
        await this.eliminarDetallesEliminados();
        
      } else {
        console.log('🆕 Creando nueva cotización...');
        // Create new cotización
        const createResult = await this.cotizacionService.createCotizacion(cotizacionRequest).toPromise();
        if (!createResult) throw new Error('Failed to create cotización');
        cotizacionResponse = createResult;
        console.log('✅ Cotización creada con ID:', cotizacionResponse.id);
        
        // Set relationships
        console.log('🔗 Asignando relaciones secuencialmente...');
        await this.setRelacionesCotizacion(cotizacionResponse.id, formValue);
      }

      // Create/update detalles
      console.log('📋 Procesando detalles de cotización...');
      await this.procesarDetalles(cotizacionResponse.id);
      console.log('✅ Detalles procesados correctamente');

      // Reload data and close form
      console.log('🔄 Recargando lista de cotizaciones...');
      await this.loadCotizaciones();
      this.cerrarFormulario();
      console.log('🎉 Flujo completado exitosamente');
      
    } catch (error) {
      console.error('❌ Error en flujo de cotización:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async setRelacionesCotizacion(cotizacionId: number, formValue: any): Promise<void> {
    // 🔹 Ejecutar secuencialmente para evitar conflictos con IDs
    
    if (formValue.personaId) {
      await this.cotizacionService.setPersona(cotizacionId, formValue.personaId).toPromise();
      console.log('✅ Persona asignada a cotización:', cotizacionId);
    }
    
    if (formValue.formaPagoId) {
      await this.cotizacionService.setFormaPago(cotizacionId, formValue.formaPagoId).toPromise();
      console.log('✅ Forma de pago asignada a cotización:', cotizacionId);
    }
    
    if (formValue.estadoCotizacionId) {
      await this.cotizacionService.setEstadoCotizacion(cotizacionId, formValue.estadoCotizacionId).toPromise();
      console.log('✅ Estado asignado a cotización:', cotizacionId);
    }
    
    if (formValue.sucursalId) {
      await this.cotizacionService.setSucursal(cotizacionId, formValue.sucursalId).toPromise();
      console.log('✅ Sucursal asignada a cotización:', cotizacionId);
    }
    
    console.log('🎉 Todas las relaciones asignadas secuencialmente para cotización:', cotizacionId);
  }

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
    console.log('🔍 DEBUGGING - Creando detalle:');
    console.log('  cotizacionId:', cotizacionId);
    console.log('  categoria RECIBIDA:', categoria);
    console.log('  detalle completo:', detalle);
    
    // 🔍 Verificar que la categoría existe en el array local
    const categoriaExiste = this.categorias.find(c => c.id === categoria);
    console.log('🔍 Categoría encontrada en array local:', categoriaExiste);
    console.log('🔍 Todas las categorías disponibles:', this.categorias.map(c => ({id: c.id, nombre: c.nombre})));
    
    if (!categoriaExiste) {
      console.error('❌ FATAL: La categoría con ID', categoria, 'no existe en el frontend');
      console.error('❌ Categorías disponibles:', this.categorias);
      throw new Error(`Categoría con ID ${categoria} no encontrada en el frontend`);
    }
    
    // 🔍 Verificar que el producto existe (advertencia, no error fatal)
    if (!detalle.producto) {
      console.warn('⚠️ ADVERTENCIA: No se ha seleccionado un producto para este detalle');
      console.warn('⚠️ Detalle sin producto:', detalle);
    }
    
    // Validar datos críticos
    if (!cotizacionId) {
      console.error('❌ ERROR: cotizacionId es null/undefined');
      throw new Error('cotizacionId no puede ser null');
    }
    if (!categoria) {
      console.error('❌ ERROR: categoria es null/undefined');
      throw new Error('categoria no puede ser null');
    }
    
    // Create proveedor if needed
    let proveedorId = detalle.proveedor?.id;
    if (detalle.proveedor && detalle.proveedor.id === 0) {
      console.log('📝 Creando nuevo proveedor:', detalle.proveedor.nombre);
      const nuevoProveedor = await this.proveedorService.createProveedor({ 
        nombre: detalle.proveedor.nombre 
      }).toPromise();
      proveedorId = nuevoProveedor?.id;
      console.log('✅ Proveedor creado con ID:', proveedorId);
    }

    const request: DetalleCotizacionRequest = {
      cantidad: detalle.cantidad || 1,                    // ✅ Default 1
      unidad: detalle.unidad || 1,                       // ✅ Default 1  
      descripcion: detalle.descripcion || '',            // ✅ Default empty
      categoria: categoria,                              // ✅ Cambio: categoriaId → categoria
      comision: detalle.comision || 0,                   // ✅ Default 0
      precioHistorico: detalle.precioHistorico || 0      // ✅ Default 0
    };
    
    // ✅ Validación final antes de enviar
    if (!request.categoria) {
      console.error('❌ FATAL: categoria sigue siendo null después de validación');
      throw new Error('categoria es requerido para crear detalle');
    }
    
    console.log('📤 Request que se enviará al backend:', request);

    const detalleCreado = await this.detalleCotizacionService.createDetalleCotizacion(cotizacionId, request).toPromise();
    console.log('✅ Detalle creado exitosamente:', detalleCreado);
    
    if (detalleCreado && detalle.producto) {
      console.log('🔗 Asignando producto al detalle:', detalle.producto.id);
      await this.detalleCotizacionService.setProducto(detalleCreado.id, detalle.producto.id).toPromise();
      console.log('✅ Producto asignado al detalle');
    } else if (detalleCreado && !detalle.producto) {
      console.warn('⚠️ Detalle creado sin producto asociado. ID:', detalleCreado.id);
    }
    
    if (detalleCreado && proveedorId) {
      console.log('🔗 Asignando proveedor al detalle:', proveedorId);
      await this.detalleCotizacionService.setProveedor(detalleCreado.id, proveedorId).toPromise();
      console.log('✅ Proveedor asignado al detalle');
    }
  }

  private async actualizarDetalle(detalle: DetalleCotizacionTemp): Promise<void> {
    if (!detalle.id) return;

    console.log('📝 Actualizando detalle existente:', detalle.id);

    const request: DetalleCotizacionRequest = {
      cantidad: detalle.cantidad || 1,
      unidad: detalle.unidad || 1,
      descripcion: detalle.descripcion || '',
      comision: detalle.comision || 0,
      precioHistorico: detalle.precioHistorico || 0
      // ✅ No incluimos categoriaId en updates, solo en creación
    };

    console.log('📤 Request para actualizar detalle:', request);
    await this.detalleCotizacionService.updateDetalleCotizacion(detalle.id, request).toPromise();
    console.log('✅ Detalle actualizado exitosamente');
  }

  // Variables para el sistema de presionar y mantener
  cotizacionAEliminar: CotizacionResponse | null = null;
  presionandoEliminar = false;
  tiempoPresionado = 0;
  intervaloPulsacion: any = null;

  // Iniciar proceso de eliminación por presión mantenida
  iniciarEliminacion(cotizacion: CotizacionResponse): void {
    console.log('🗑️ Iniciando eliminación por presión:', cotizacion.codigoCotizacion);
    
    this.cotizacionAEliminar = cotizacion;
    this.presionandoEliminar = true;
    this.tiempoPresionado = 0;
    
    // Intervalo que cuenta cada 100ms
    this.intervaloPulsacion = setInterval(() => {
      this.tiempoPresionado += 100;
      
      // Mostrar progreso en consola cada segundo
      if (this.tiempoPresionado % 1000 === 0) {
        console.log(`⏱️ Presionando: ${this.tiempoPresionado / 1000}s / 3s`);
      }
      
      // Después de 3 segundos (3000ms), proceder con eliminación
      if (this.tiempoPresionado >= 3000) {
        this.completarEliminacion();
      }
    }, 100);
  }

  // Cancelar proceso de eliminación
  cancelarEliminacion(): void {
    console.log('❌ Eliminación cancelada - se soltó el botón');
    
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
    console.log('✅ Eliminación completada - 3 segundos mantenidos');
    
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

  ngOnDestroy(): void {
    // Limpiar intervalo si existe
    if (this.intervaloPulsacion) {
      clearInterval(this.intervaloPulsacion);
      this.intervaloPulsacion = null;
    }
  }
  
  private async eliminarCotizacionDirectamente(id: number): Promise<void> {
    console.log('🗑️ Ejecutando eliminación directa de cotización ID:', id);
    
    this.isLoading = true;

    try {
      console.log('📡 Llamando al servicio de eliminación...');
      await this.cotizacionService.deleteByIdCotizacion(id).toPromise();
      console.log('✅ Cotización eliminada exitosamente');
      
      console.log('� Recargando lista de cotizaciones...');
      await this.loadCotizaciones();
      console.log('✅ Lista recargada');
      
      console.log('🎉 Proceso de eliminación completado');
      alert('Cotización eliminada exitosamente.');
      
    } catch (error) {
      console.error('❌ Error eliminando cotización:', error);
      console.error('❌ Detalles del error:', JSON.stringify(error, null, 2));
      
      alert('Error al eliminar la cotización. Por favor, inténtelo de nuevo.');
    } finally {
      this.isLoading = false;
      console.log('🏁 Proceso finalizado. isLoading:', this.isLoading);
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
    const persona = this.personas.find(p => p.id === personaId);
    if (!persona) return 'Sin asignar';
    
    // Check if it's PersonaNaturalResponse
    if ('nombres' in persona && 'apellidos' in persona) {
      return `${persona.nombres || ''} ${persona.apellidos || ''}`.trim();
    }
    
    // Check if it's PersonaJuridicaResponse  
    if ('razonSocial' in persona) {
      return persona.razonSocial || 'Empresa';
    }
    
    return `Persona #${personaId}`;
  }

  getEstadoBadgeClass(estado: EstadoCotizacionResponse | null | undefined): string {
    // 🔹 Validar si estado existe
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
    // 🔍 Verificar si hay categorías cargadas
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

  // Client selection methods
  onSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value as 'natural' | 'juridica' | '';
    this.onTipoClienteChange(value);
  }

  onTipoClienteChange(tipo: 'natural' | 'juridica' | ''): void {
    this.cotizacionForm.patchValue({ 
      tipoClienteSeleccionado: tipo,
      terminoBusquedaCliente: '',
      personaId: ''
    });
    this.personasEncontradas = [];
    this.clienteSeleccionado = null;
  }

  resetClienteSeleccionado(): void {
    const currentTipo = this.cotizacionForm.get('tipoClienteSeleccionado')?.value;
    this.onTipoClienteChange(currentTipo);
  }

  onCriterioBusquedaChange(criterio: string): void {
    const tipoCliente = this.cotizacionForm.get('tipoClienteSeleccionado')?.value;
    if (tipoCliente === 'natural') {
      this.cotizacionForm.patchValue({ criterioBusquedaNatural: criterio });
    } else if (tipoCliente === 'juridica') {
      this.cotizacionForm.patchValue({ criterioBusquedaJuridica: criterio });
    }
    this.cotizacionForm.patchValue({ terminoBusquedaCliente: '' });
    this.personasEncontradas = [];
  }

  async buscarClientes(): Promise<void> {
    const terminoBusqueda = this.cotizacionForm.get('terminoBusquedaCliente')?.value?.trim();
    const tipoCliente = this.cotizacionForm.get('tipoClienteSeleccionado')?.value;
    
    if (!terminoBusqueda || !tipoCliente) {
      return;
    }

    this.buscandoClientes = true;
    this.personasEncontradas = [];

    try {
      if (tipoCliente === 'natural') {
        await this.buscarPersonasNaturales();
      } else if (tipoCliente === 'juridica') {
        await this.buscarPersonasJuridicas();
      }
    } catch (error) {
      console.error('Error searching clients:', error);
      this.personasEncontradas = [];
    } finally {
      this.buscandoClientes = false;
    }
  }

  private async buscarPersonasNaturales(): Promise<void> {
    const termino = this.cotizacionForm.get('terminoBusquedaCliente')?.value?.trim().toLowerCase();
    const criterio = this.cotizacionForm.get('criterioBusquedaNatural')?.value;
    
    try {
      const todasLasPersonas = await this.personaNaturalService.findAll().toPromise() || [];
      let resultado: PersonaNaturalResponse[] = [];

      switch (criterio) {
        case 'nombres':
          resultado = todasLasPersonas.filter(p => 
            p.nombres?.toLowerCase().includes(termino)
          );
          break;
        case 'apellidos':
          resultado = todasLasPersonas.filter(p => 
            p.apellidos?.toLowerCase().includes(termino)
          );
          break;
        case 'documento':
          resultado = todasLasPersonas.filter(p => 
            p.documento === termino.toUpperCase()
          );
          break;
      }

      this.personasEncontradas = resultado.slice(0, 10); // Limitar a 10 resultados
    } catch (error) {
      console.error('Error loading personas naturales:', error);
      this.personasEncontradas = [];
    }
  }

  private async buscarPersonasJuridicas(): Promise<void> {
    const termino = this.cotizacionForm.get('terminoBusquedaCliente')?.value?.trim().toLowerCase();
    const criterio = this.cotizacionForm.get('criterioBusquedaJuridica')?.value;
    
    try {
      const todasLasPersonas = await this.personaJuridicaService.findAll().toPromise() || [];
      let resultado: PersonaJuridicaResponse[] = [];

      switch (criterio) {
        case 'ruc':
          resultado = todasLasPersonas.filter(p => 
            p.ruc === termino.toUpperCase()
          );
          break;
        case 'razonSocial':
          resultado = todasLasPersonas.filter(p => 
            p.razonSocial?.toLowerCase().includes(termino)
          );
          break;
      }

      this.personasEncontradas = resultado.slice(0, 10); // Limitar a 10 resultados
    } catch (error) {
      console.error('Error loading personas juridicas:', error);
      this.personasEncontradas = [];
    }
  }

  seleccionarCliente(persona: PersonaNaturalResponse | PersonaJuridicaResponse): void {
    this.clienteSeleccionado = persona;
    this.cotizacionForm.patchValue({ 
      personaId: persona.id,
      terminoBusquedaCliente: ''
    });
    this.personasEncontradas = [];
  }

  getClienteDisplayName(persona: PersonaNaturalResponse | PersonaJuridicaResponse): string {
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

  getSelectedClienteName(): string {
    if (!this.clienteSeleccionado) return '';
    return this.getClienteDisplayName(this.clienteSeleccionado);
  }

  // Getters for template access
  get tipoClienteSeleccionado(): string {
    return this.cotizacionForm.get('tipoClienteSeleccionado')?.value || '';
  }

  get criterioBusquedaNatural(): string {
    return this.cotizacionForm.get('criterioBusquedaNatural')?.value || 'nombres';
  }

  get criterioBusquedaJuridica(): string {
    return this.cotizacionForm.get('criterioBusquedaJuridica')?.value || 'ruc';
  }

  get terminoBusquedaCliente(): string {
    return this.cotizacionForm.get('terminoBusquedaCliente')?.value || '';
  }
}
