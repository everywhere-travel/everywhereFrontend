import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Subscription, of } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';

// Services
import { LiquidacionService } from '../../core/service/Liquidacion/liquidacion.service';
import { DetalleLiquidacionService } from '../../core/service/DetalleLiquidacion/detalle-liquidacion.service';
import { CotizacionService } from '../../core/service/Cotizacion/cotizacion.service';
import { DetalleCotizacionService } from '../../core/service/DetalleCotizacion/detalle-cotizacion.service';

import { PersonaService } from '../../core/service/persona/persona.service';
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
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { DataTableConfig } from '../../shared/components/data-table/data-table.config';

// Services
import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';

// Interfaz para tabla de liquidaciones
export interface LiquidacionTabla {
  id: number;
  numeroLiquidacion?: string;
  numeroCotizacion?: string;
  personaNombre?: string;
  destino?: string;
  fechaCompra?: string;
  numeroPasajeros?: number;
  producto?: string;
  formaPago?: string;
}

interface DetalleLiquidacionTemp {
  id?: number;
  proveedor?: ProveedorResponse | null;
  producto?: ProductoResponse;
  operador?: OperadorResponse;
  viajero?: ViajeroConPersonaNatural;
  ticket?: string;
  documentoCobro?: string;
  costoTicket?: number;
  cargoServicio?: number;
  valorVenta?: number;
  feeEmision?: string;
  documentoFee?: string;
  comision?: string;
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
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SidebarComponent,
    LucideAngularModule,
    DataTableComponent
  ]
})
export class LiquidacionesComponent implements OnInit, OnDestroy {
  // ===== CACHE AND MAPPING =====

  // Services injection
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private liquidacionService = inject(LiquidacionService);
  private detalleLiquidacionService = inject(DetalleLiquidacionService);
  private cotizacionService = inject(CotizacionService);
  private detalleCotizacionService = inject(DetalleCotizacionService);
  private personaService = inject(PersonaService);
  private formaPagoService = inject(FormaPagoService);
  private productoService = inject(ProductoService);
  private proveedorService = inject(ProveedorService);
  private operadorService = inject(OperadorService);
  private viajeroService = inject(ViajeroService);
  private clienteSearchSubscription: Subscription | null = null;

  // ===== UI STATE =====
  isLoading = false;
  isGenerating = false;
  loading: boolean = false;
  mostrarModalCrear = false;
  mostrarFormulario = false;
  editandoLiquidacion = false;
  mostrarGestionGrupos = false;
  mostrarModalVer = false;
  mostrarModalCotizaciones = false;
  sidebarCollapsed = false;

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

  // ===== PAGINATION STATE =====
  currentPage = 1;
  pageSize = 10;
  sortColumn = 'id';
  sortDirection = 'desc';
  searchTerm = '';

  // ===== SELECTION STATE =====
  liquidacionSeleccionada: LiquidacionConDetallesResponse | null = null;
  liquidacionCompleta: LiquidacionConDetallesResponse | null = null;
  liquidacionEditandoId: number | null = null;

  // ===== SIDEBAR CONFIGURATION =====
  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];
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

  // ===== CLIENT SELECTION =====
  personasEncontradas: (PersonaNaturalResponse | PersonaJuridicaResponse)[] = [];
  buscandoClientes = false;
  clienteSeleccionado: PersonaNaturalResponse | PersonaJuridicaResponse | null = null;

  // Data arrays for table
  liquidacionesTabla: LiquidacionTabla[] = [];
  descargandoExcelIds: Set<number> = new Set();

  tableConfig: DataTableConfig<LiquidacionTabla> = {
    data: [],
    columns: [
      {
        key: 'numeroLiquidacion',
        header: 'N° Liquidación',
        icon: 'fa-hashtag',
        sortable: true,
        width: '140px',
        render: (item) => item.numeroLiquidacion || 'N/A'
      },
      {
        key: 'numeroCotizacion',
        header: 'N° Cotización',
        icon: 'fa-file-invoice',
        sortable: true,
        width: '140px',
        render: (item) => item.numeroCotizacion || 'No vinculada'
      },
      {
        key: 'personaNombre',
        header: 'Cliente',
        icon: 'fa-user',
        sortable: true,
        render: (item) => item.personaNombre || 'Sin cliente'
      },
      {
        key: 'destino',
        header: 'Destino',
        icon: 'fa-map-marker-alt',
        sortable: true,
        render: (item) => item.destino || 'Sin destino'
      },
      {
        key: 'fechaCompra',
        header: 'Fecha Compra',
        icon: 'fa-calendar-alt',
        sortable: true,
        width: '130px',
        render: (item) => this.formatDate(item.fechaCompra)
      },
      {
        key: 'numeroPasajeros',
        header: 'Pasajeros',
        icon: 'fa-users',
        sortable: true,
        width: '100px',
        render: (item) => item.numeroPasajeros?.toString() || '0'
      }
    ],
    enableSearch: true,
    searchPlaceholder: 'Buscar por número, cotización, cliente, destino...',
    enableSelection: false,
    enablePagination: true,
    enableViewSwitcher: true,
    enableSorting: true,
    serverSidePagination: true,
    totalServerItems: 0,
    itemsPerPage: 10,
    pageSizeOptions: [5, 10, 25, 50],
    actions: [
      {
        icon: 'fa-eye',
        label: 'Ver',
        color: 'green',
        handler: (item) => this.mostrarModalVerLiquidacion(this.getLiquidacionById(item.id)!)
      },
      {
        icon: 'fa-edit',
        label: 'Editar',
        color: 'blue',
        handler: (item) => this.mostrarFormularioEditar(this.getLiquidacionById(item.id)!)
      },
      {
        icon: 'fa-file-excel',
        label: 'Descargar Excel',
        color: 'indigo',
        handler: (item) => this.descargarLiquidacionExcel(item.id, item.numeroLiquidacion),
        disabled: (item) => this.descargandoExcelIds.has(item.id)
      },
      {
        icon: 'fa-trash',
        label: 'Eliminar',
        color: 'red',
        handler: (item) => this.eliminarLiquidacionDirectamente(item.id)
      }
    ],
    emptyMessage: 'No se encontraron liquidaciones',
    loadingMessage: 'Cargando liquidaciones...',
    defaultView: 'table',
    enableRowHover: true,
    trackByKey: 'id'
  };

  constructor(private menuConfigService: MenuConfigService) { }

  ngOnInit(): void {
    this.sidebarMenuItems = this.menuConfigService.getMenuItems('/settlements');
    this.initializeForms();
    this.loadInitialData();
    this.setupClienteSearch();
  }

  ngOnDestroy(): void {
    this.clienteSearchSubscription?.unsubscribe();
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

  private sanitizeText(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    const text = String(value).trim();
    if (text === 'undefined' || text === 'null') {
      return '';
    }
    return text;
  }

  hideMessages(): void {
    this.showErrorMessage = false;
    this.showSuccessMessage = false;
  }

  private initializeForms(): void {
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
      documentoCobro: [''],
      costoTicket: [0, [Validators.min(0)]],
      cargoServicio: [0, [Validators.min(0)]],
      valorVenta: [0, [Validators.min(0)]],
      feeEmision: [''],
      documentoFee: [''],
      comision: [''],
      facturaCompra: [''],
      boletaPasajero: [''],
      montoDescuento: [0, [Validators.min(0)]],
      pagoPaxUSD: [0, [Validators.min(0)]],
      pagoPaxPEN: [0, [Validators.min(0)]]
    });
  }

  private setupClienteSearch(): void {
    // Inicializar vacio y no mostrando carga
    this.personasEncontradas = [];
    this.buscandoClientes = false;

    this.clienteSearchSubscription?.unsubscribe();

    this.clienteSearchSubscription = this.clienteSearchControl.valueChanges
      .pipe(
        debounceTime(400), 
        distinctUntilChanged(),
        switchMap((searchTerm) => {
          this.buscandoClientes = true;
          const termino = searchTerm?.trim() || '';

          // Consultar a la BD (incluso si está vacío, trae los primeros 10)
          return this.personaService.getPersonasDropdownPage(0, 10, 'id', 'desc', termino ? termino : undefined).pipe(
            catchError((err: any) => {
              console.error('Error al buscar clientes:', err);
              return of({ content: [] });
            })
          );
        }),
      )
      .subscribe({
        next: (response: any) => {
          if (response && response.content) {
            this.personasEncontradas = response.content.map((dto: any) => ({
              id: dto.id,
              tipo: dto.tipo,
              identificador: dto.documento || '',
              nombre: dto.nombre || 'Sin nombre',
              ruc: dto.tipo === 'JURIDICA' ? dto.documento : undefined,
              documento: dto.tipo === 'NATURAL' ? dto.documento : undefined,
            }));
          }
          this.buscandoClientes = false;
        },
        error: (err) => {
          this.buscandoClientes = false;
        },
      });
  }

  private loadInitialData(): void {
    this.isLoading = true;


    Promise.all([
      this.loadLiquidaciones()
    ]).finally(() => {
      this.isLoading = false;
    });
  }

  // ===== EVENTOS DE TABLA SERVER-SIDE =====
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadLiquidaciones();
  }

  onSortChange(sort: { column: string, direction: 'asc' | 'desc' | null }): void {
    if (sort.direction) {
      this.sortColumn = sort.column;
      this.sortDirection = sort.direction;
    } else {
      this.sortColumn = 'id';
      this.sortDirection = 'desc';
    }
    this.loadLiquidaciones();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
    this.loadLiquidaciones();
  }

  private async loadLiquidaciones(): Promise<void> {
    try {
      this.loading = true;
      this.isLoading = true;

      // Restamos 1 porque Spring Boot page index es 0-based
      const response = await this.liquidacionService.getLiquidacionesPage(
        this.currentPage - 1, 
        this.pageSize, 
        this.sortColumn, 
        this.sortDirection
      ).toPromise();
      
      if (response) {
        this.liquidaciones = response.content || [];
        

        this.liquidacionesTabla = this.convertToLiquidacionTabla(this.liquidaciones);
        
        this.tableConfig = {
          ...this.tableConfig,
          data: this.liquidacionesTabla,
          totalServerItems: response.totalElements
        };
      }
    } catch (error) {
      this.showError('Error al cargar las liquidaciones. Por favor, recargue la página.');
      this.liquidaciones = [];
      this.liquidacionesTabla = [];
    } finally {
      this.loading = false;
      this.isLoading = false;
    }
  }

  private convertToLiquidacionTabla(liquidaciones: LiquidacionResponse[]): LiquidacionTabla[] {
    return liquidaciones.map(liq => ({
      id: liq.id,
      numeroLiquidacion: liq.numero,
      numeroCotizacion: liq.cotizacion?.codigoCotizacion,
      personaNombre: liq.cotizacion?.clienteNombre || 'Sin cliente',
      destino: liq.destino,
      fechaCompra: liq.fechaCompra,
      numeroPasajeros: liq.numeroPasajeros,
      producto: liq.producto?.descripcion,
      formaPago: liq.formaPago?.descripcion
    }));
  }

  getLiquidacionById(id: number): LiquidacionResponse | undefined {
    return this.liquidaciones.find(l => l.id === id);
  }



  private async loadFormasPago(): Promise<void> {
    try {
      this.formasPago = await this.formaPagoService.getDropdownFormasPago().toPromise() || [];
    } catch (error) {
      this.showError('Error al cargar las formas de pago.');
      this.formasPago = [];
    }
  }

  private async loadProductos(): Promise<void> {
    try {
      this.productos = await this.productoService.getDropdownProductos().toPromise() || [];
    } catch (error) {
      this.productos = [];
    }
  }

  private async loadProveedores(): Promise<void> {
    try {
      this.proveedores = await this.proveedorService.getDropdownProveedores().toPromise() || [];
    } catch (error) {
      this.proveedores = [];
    }
  }

  private async loadOperadores(): Promise<void> {
    try {
      this.operadores = await this.operadorService.getDropdownOperadores().toPromise() || [];
    } catch (error) {
      this.operadores = [];
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

  // Form methods
  async mostrarFormularioCrear(): Promise<void> {
    try {
      this.isGenerating = true;


      await this.loadCotizaciones();


      if (this.formasPago.length === 0) await this.loadFormasPago();
      if (this.productos.length === 0) await this.loadProductos();
      if (this.proveedores.length === 0) await this.loadProveedores();
      if (this.operadores.length === 0) await this.loadOperadores();

      // Mostrar modal de selección de cotizaciones
      this.mostrarModalCotizaciones = true;

    } catch (error) {
      console.error('Error en mostrarFormularioCrear:', error);
      this.showError('Error al cargar las cotizaciones');
    } finally {
      this.isGenerating = false;
    }
  }

  async mostrarFormularioEditar(liquidacion: LiquidacionResponse): Promise<void> {
    // Navegar al componente de detalle en modo edición
    this.router.navigate(['/settlements/detalle', liquidacion.id], {
      queryParams: { modo: 'editar' }
    });
  }

  async mostrarFormularioEditarOld(liquidacion: LiquidacionResponse): Promise<void> {
    try {
      this.isLoading = true;

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

    this.clienteSearchControl.setValue('', { emitEvent: false });

    this.precargarClientesIniciales();
  }


  private precargarClientesIniciales(): void {
    this.buscandoClientes = true;
    this.personaService.getPersonasDropdownPage(0, 10, 'id', 'desc', undefined)
      .pipe(
        catchError((err: any) => {
          console.error('Error al precargar clientes:', err);
          return of({ content: [] });
        })
      )
      .subscribe((response: any) => {
        this.personasEncontradas = (response?.content || []).map((dto: any) => ({
          id: dto.id,
          tipo: dto.tipo,
          identificador: dto.documento || '',
          nombre: dto.nombre || 'Sin nombre',
          ruc: dto.tipo === 'JURIDICA' ? dto.documento : undefined,
          documento: dto.tipo === 'NATURAL' ? dto.documento : undefined,
        }));
        this.buscandoClientes = false;
      });
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
        documentoCobro: detalle.documentoCobro,
        costoTicket: detalle.costoTicket,
        cargoServicio: detalle.cargoServicio,
        valorVenta: detalle.valorVenta,
        feeEmision: detalle.feeEmision,
        documentoFee: detalle.documentoFee,
        comision: detalle.comision,
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

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    // Extraer solo la parte de la fecha (YYYY-MM-DD) y formatear manualmente
    // para evitar problemas de zona horaria
    const dateOnly = dateString.split('T')[0]; // "2024-11-20"
    const [year, month, day] = dateOnly.split('-');
    return `${day}/${month}/${year}`;
  }

  // ===== MÉTODOS PARA LIQUIDACIONES =====

  getTotalLiquidaciones(): number {
    return this.tableConfig.totalServerItems || 0;
  }

  getLiquidacionesProcesadas(): number {
    return this.liquidaciones.filter(liq => liq.producto !== null && liq.formaPago !== null).length;
  }

  getLiquidacionesPendientes(): number {
    return this.liquidaciones.filter(liq => liq.producto === null || liq.formaPago === null).length;
  }

  trackByDetalle(index: number, detalle: DetalleLiquidacionResponse): number {
    return detalle.id;
  }

  private descargarLiquidacionExcel(liquidacionId: number, numeroLiquidacion?: string): void {
    if (this.descargandoExcelIds.has(liquidacionId)) {
      return;
    }

    this.descargandoExcelIds.add(liquidacionId);

    const nombreBase = (numeroLiquidacion || `Liquidacion_${liquidacionId}`)
      .toString()
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '_');

    this.liquidacionService.generarExcel(liquidacionId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${nombreBase || `Liquidacion_${liquidacionId}`}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.showError('No se pudo descargar el Excel de la liquidación');
        this.descargandoExcelIds.delete(liquidacionId);
      },
      complete: () => {
        this.descargandoExcelIds.delete(liquidacionId);
      }
    });
  }

  mostrarModalVerLiquidacion(liquidacion: LiquidacionResponse): void {
    this.router.navigate(['/settlements/detalle', liquidacion.id]);
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
        ticket: this.sanitizeText(detalle.ticket),
        documentoCobro: this.sanitizeText(detalle.documentoCobro),
        costoTicket: detalle.costoTicket || 0,
        cargoServicio: detalle.cargoServicio || 0,
        valorVenta: detalle.valorVenta || 0,
        feeEmision: this.sanitizeText(detalle.feeEmision),
        documentoFee: this.sanitizeText(detalle.documentoFee),
        comision: this.sanitizeText(detalle.comision),
        facturaCompra: this.sanitizeText(detalle.facturaCompra),
        boletaPasajero: this.sanitizeText(detalle.boletaPasajero),
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
        feeEmision: this.sanitizeText(detalle.feeEmision),
        documentoFee: this.sanitizeText(detalle.documentoFee),
        comision: this.sanitizeText(detalle.comision),
        facturaCompra: this.sanitizeText(detalle.facturaCompra),
        boletaPasajero: this.sanitizeText(detalle.boletaPasajero),
        montoDescuento: detalle.montoDescuento || 0,
        pagoPaxUSD: detalle.pagoPaxUSD || 0,
        pagoPaxPEN: detalle.pagoPaxPEN || 0,
        viajeroId: detalle.viajero?.id || undefined,
        productoId: detalle.producto?.id || undefined,
        proveedorId: detalle.proveedor?.id || undefined,
        operadorId: detalle.operador?.id || undefined,
        ticket: this.sanitizeText(detalle.ticket),
        documentoCobro: this.sanitizeText(detalle.documentoCobro)
      };
      await this.detalleLiquidacionService.updateDetalleLiquidacion(detalle.id, detalleRequest).toPromise();
    } catch (error) {
      throw error;
    }
  }

  // ===== COTIZACIONES METHODS =====
  async loadCotizaciones(): Promise<void> {
    try {

      const response = await this.cotizacionService
        .getCotizacionesPage(0, 200, 'id', 'desc')
        .toPromise();

      this.cotizaciones = response?.content || [];
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
      cotizacion.origenDestino?.toLowerCase().includes(term) ||
      cotizacion.clienteNombre?.toLowerCase().includes(term)
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
      // Cerrar modal PRIMERO
      this.mostrarModalCotizaciones = false;
      this.cotizacionSeleccionada = null;

      // Mapear datos de cotización a liquidación
      const liquidacionRequest: LiquidacionRequest = {
        cotizacionId: cotizacion.id,
        fechaCompra: cotizacion.fechaEmision ? this.formatDateForInput(new Date(cotizacion.fechaEmision)) : undefined,
        destino: cotizacion.origenDestino,
        numeroPasajeros: (cotizacion.cantAdultos || 0) + (cotizacion.cantNinos || 0),
        formaPagoId: cotizacion.formaPago?.id
      };

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
