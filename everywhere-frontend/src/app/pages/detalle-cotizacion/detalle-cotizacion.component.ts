import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, tap, catchError, finalize, of, debounceTime, distinctUntilChanged, switchMap, firstValueFrom } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';

// Services
import { CotizacionService } from '../../core/service/Cotizacion/cotizacion.service';
import { LoadingService } from '../../core/service/loading.service';
import { DetalleCotizacionService } from '../../core/service/DetalleCotizacion/detalle-cotizacion.service';
import { PersonaService } from '../../core/service/persona/persona.service';
import { PersonaNaturalService } from '../../core/service/natural/persona-natural.service';
import { PersonaJuridicaService } from '../../core/service/juridica/persona-juridica.service';
import { FormaPagoService } from '../../core/service/FormaPago/forma-pago.service';
import { EstadoCotizacionService } from '../../core/service/EstadoCotizacion/estado-cotizacion.service';
import { HistorialCotizacionService } from '../../core/service/HistorialCotizacion/historial-cotizacion.service';
import { SucursalService } from '../../core/service/Sucursal/sucursal.service';
import { ProductoService } from '../../core/service/Producto/producto.service';
import { ProveedorService } from '../../core/service/Proveedor/proveedor.service';
import { CategoriaService } from '../../core/service/Categoria/categoria.service';
import { OperadorService } from '../../core/service/Operador/operador.service';

import { personaDisplay } from '../../shared/models/Persona/persona.model';

import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';

// Models
import {
    CotizacionRequest,
    CotizacionResponse,
    CotizacionConDetallesResponseDTO,
    CotizacionPatchRequest
} from '../../shared/models/Cotizacion/cotizacion.model';
import { DetalleCotizacionRequest } from '../../shared/models/Cotizacion/detalleCotizacion.model';
import { PersonaNaturalResponse } from '../../shared/models/Persona/personaNatural.model';
import { PersonaJuridicaResponse } from '../../shared/models/Persona/personaJuridica.models';
import { FormaPagoResponse } from '../../shared/models/FormaPago/formaPago.model';
import { EstadoCotizacionResponse } from '../../shared/models/Cotizacion/estadoCotizacion.model';
import { HistorialCotizacionSimple } from '../../shared/models/Cotizacion/historialCotizacion.model';
import { SucursalResponse } from '../../shared/models/Sucursal/sucursal.model';
import { ProductoResponse } from '../../shared/models/Producto/producto.model';
import { ProveedorResponse } from '../../shared/models/Proveedor/proveedor.model';
import { CategoriaResponse } from '../../shared/models/Categoria/categoria.model';
import { CategoriaRequest } from '../../shared/models/Categoria/categoria.model';
import { OperadorResponse } from '../../shared/models/Operador/operador.model';

import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';

interface DetalleCotizacionTemp {
    id?: number;
    proveedor?: ProveedorResponse | null;
    producto?: ProductoResponse;
    operador?: OperadorResponse | null;
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

export interface SidebarMenuItem {
    id: string;
    title: string;
    icon: string;
    route?: string;
    badge?: string;
    badgeColor?: string;
    children?: SidebarMenuItem[];
    active?: boolean;
}

@Component({
    selector: 'app-detalle-cotizacion',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, SidebarComponent, LucideAngularModule],
    templateUrl: './detalle-cotizacion.component.html',
    styleUrls: ['./detalle-cotizacion.component.css']
})
export class DetalleCotizacionComponent implements OnInit, OnDestroy {

    // ===== SERVICES =====
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private loadingService = inject(LoadingService);
    private menuConfigService = inject(MenuConfigService);
    private fb = inject(FormBuilder);
    private cotizacionService = inject(CotizacionService);
    private detalleCotizacionService = inject(DetalleCotizacionService);
    private personaService = inject(PersonaService);
    private personaNaturalService = inject(PersonaNaturalService);
    private personaJuridicaService = inject(PersonaJuridicaService);
    private formaPagoService = inject(FormaPagoService);
    private estadoCotizacionService = inject(EstadoCotizacionService);
    private historialCotizacionService = inject(HistorialCotizacionService);
    private sucursalService = inject(SucursalService);
    private productoService = inject(ProductoService);
    private proveedorService = inject(ProveedorService);
    private categoriaService = inject(CategoriaService);
    private operadorService = inject(OperadorService);

    // ===== DATA =====
    detallesFijos: DetalleCotizacionTemp[] = [];
    gruposHoteles: GrupoHotelTemp[] = [];
    categorias: CategoriaResponse[] = [];
    cotizacion: CotizacionConDetallesResponseDTO | null = null;
    cotizacionId: number | null = null;
    estadosCotizacion: EstadoCotizacionResponse[] = [];
    sucursales: SucursalResponse[] = [];
    personas: (PersonaNaturalResponse | PersonaJuridicaResponse)[] = [];
    formasPago: FormaPagoResponse[] = [];
    productos: ProductoResponse[] = [];
    proveedores: ProveedorResponse[] = [];
    operadores: OperadorResponse[] = [];
    historialCotizacion: HistorialCotizacionSimple[] = [];
    historialCotizacionLoading = false;

    // ===== FORMS =====
    nuevaCategoriaForm!: FormGroup;
    cotizacionForm!: FormGroup;
    clienteSearchControl: FormControl = new FormControl('');
    detalleForm!: FormGroup;
    grupoHotelForm!: FormGroup;
    detalleGrupoForm!: FormGroup;

    // ===== UI STATE =====
    mostrarGestionGrupos = false;
    creandoCategoria = false;
    categoriaEditandose: number | null = null;
    categoriaDatosOriginales: any = null;
    isLoading = false;
    error: string | null = null;
    modoEdicion = false;
    grupoSeleccionadoId: number | null = null;
    editandoCotizacion = false;
    seccionDestino: string | null = null;
    mostrarPanelHistorial = false;

    // ===== MESSAGES =====
    errorMessage: string = '';
    successMessage: string = '';
    showErrorMessage: boolean = false;
    showSuccessMessage: boolean = false;

    // ===== SELECTION STATE =====
    cotizacionEditandoId: number | null = null;
    cotizacionOriginal: CotizacionResponse | null = null;
    buscandoClientes = false;
    clienteSeleccionado: PersonaNaturalResponse | PersonaJuridicaResponse | personaDisplay | null = null;
    personasEncontradas: (PersonaNaturalResponse | PersonaJuridicaResponse | personaDisplay)[] = [];
    todosLosClientes: (PersonaNaturalResponse | PersonaJuridicaResponse | personaDisplay)[] = [];

    sidebarCollapsed = false;
    sidebarMenuItems: ExtendedSidebarMenuItem[] = [];

    // Cache for personas
    personasCache: { [id: number]: any } = {};
    personasDisplayMap: { [id: number]: string } = {};

    // Array para rastrear IDs de detalles eliminados que deben ser eliminados de la BD
    deletedDetalleIds: number[] = [];

    // Control de guardado
    private saveDebounceTimer: any;

    private subscriptions = new Subscription();

    // ===== CONSTRUCTOR =====
    constructor() {
        // Constructor vacío - se usa inject() en vez de DI tradicional
    }

    private clienteSearchSubscription?: Subscription;

    // ===== LIFECYCLE HOOKS =====
    ngOnInit(): void {
        this.sidebarMenuItems = this.menuConfigService.getMenuItems('/cotizaciones');
        this.initializeForms();
        this.loadCotizacionFromRoute();
        this.loadInitialData();
        this.setupClienteSearch();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
        this.clienteSearchSubscription?.unsubscribe();
        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
        }
    }

    private loadCotizacionFromRoute(): void {
        const idParam = this.route.snapshot.paramMap.get('id');

        if (!idParam || isNaN(Number(idParam))) {
            this.error = 'ID de cotización inválido';
            return;
        }

        // Verificar si viene en modo edición
        const modoParam = this.route.snapshot.queryParamMap.get('modo');
        this.seccionDestino = this.route.snapshot.queryParamMap.get('seccion');
        this.modoEdicion = modoParam === 'editar';
        this.mostrarPanelHistorial = this.seccionDestino === 'historial';

        this.cotizacionId = Number(idParam);
        this.editandoCotizacion = this.modoEdicion;
        this.cotizacionEditandoId = this.cotizacionId;
        this.loadCotizacion(this.cotizacionId);
    }

    private initializeForms(): void {
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
        });

        // Nueva categoría form
        this.nuevaCategoriaForm = this.fb.group({
            nombre: ['', [Validators.required, Validators.minLength(3)]],
            descripcion: [''],
        });

        // Detalle form para productos fijos
        this.detalleForm = this.fb.group({
            proveedorId: [''],
            operadorId: [''],
            nuevoProveedor: [''],
            productoId: ['', [Validators.required]],
            descripcion: [''],
            precioHistorico: [0, [Validators.required, Validators.min(0)]],
            comision: [0, [Validators.min(0)]],
            cantidad: [1, [Validators.required, Validators.min(1)]],
            unidad: [1, [Validators.required, Validators.min(1)]],
        });

        // Detalle form para grupos de hoteles
        this.detalleGrupoForm = this.fb.group({
            proveedorId: [''],
            operadorId: [''],
            nuevoProveedor: [''],
            productoId: ['', [Validators.required]],
            descripcion: [''],
            precioHistorico: [0, [Validators.required, Validators.min(0)]],
            comision: [0, [Validators.min(0)]],
            cantidad: [1, [Validators.required, Validators.min(1)]],
            unidad: [1, [Validators.required, Validators.min(1)]],
        });

        // Grupo hotel form
        this.grupoHotelForm = this.fb.group({
            categoria: ['', [Validators.required]],
        });
    }

    private loadInitialData(): void {
        Promise.all([
            this.loadPersonas(),
            this.loadFormasPago(),
            this.loadEstadosCotizacion(),
            this.loadSucursales(),
            this.loadProductos(),
            this.loadProveedores(),
            this.loadCategorias(),
            this.loadOperadores(),
        ]).catch(() => {
            // Los errores individuales ya se manejan en cada método
        });
    }

    private async loadPersonas(): Promise<void> {
        try {
            const personasNaturales = (await this.personaNaturalService.findAll().toPromise()) || [];
            const personasJuridicas = (await this.personaJuridicaService.findAll().toPromise()) || [];

            this.personas = [...personasNaturales, ...personasJuridicas];
            this.todosLosClientes = [...this.personas];
            this.personasEncontradas = [...this.todosLosClientes];

            // Poblar cache
            this.personas.forEach((persona) => {
                const personaId = persona.persona?.id || persona.id;
                if (!personaId) return;

                if ('ruc' in persona) {
                    const pj = persona as PersonaJuridicaResponse;
                    this.personasCache[personaId] = {
                        id: personaId,
                        identificador: pj.ruc || '',
                        nombre: pj.razonSocial || 'Sin nombre',
                        tipo: 'JURIDICA',
                    };
                } else {
                    const pn = persona as PersonaNaturalResponse;
                    const apellidos = `${pn.apellidosPaterno || ''} ${pn.apellidosMaterno || ''}`.trim();
                    this.personasCache[personaId] = {
                        id: personaId,
                        identificador: pn.documento || '',
                        nombre: `${pn.nombres || ''} ${apellidos}`.trim() || 'Sin nombre',
                        tipo: 'NATURAL',
                    };
                }

                const cached = this.personasCache[personaId];
                this.personasDisplayMap[personaId] = cached.nombre;
            });
        } catch (error) {
            this.personas = [];
            this.todosLosClientes = [];
            this.personasEncontradas = [];
        }
    }

    private async loadFormasPago(): Promise<void> {
        try {
            this.formasPago = (await this.formaPagoService.getAllFormasPago().toPromise()) || [];
        } catch (error) {
            this.formasPago = [];
        }
    }

    private async loadEstadosCotizacion(): Promise<void> {
        try {
            this.estadosCotizacion = (await this.estadoCotizacionService.getAllEstadosCotizacion().toPromise()) || [];
        } catch (error) {
            this.estadosCotizacion = [];
        }
    }

    private async loadSucursales(): Promise<void> {
        try {
            this.sucursales = (await this.sucursalService.findAllSucursal().toPromise()) || [];
        } catch (error) {
            this.sucursales = [];
        }
    }

    private async loadProductos(): Promise<void> {
        try {
            this.productos = (await this.productoService.getAllProductos().toPromise()) || [];
        } catch (error) {
            this.productos = [];
        }
    }

    private async loadProveedores(): Promise<void> {
        try {
            this.proveedores = (await this.proveedorService.findAllProveedor().toPromise()) || [];
        } catch (error) {
            this.proveedores = [];
        }
    }

    private async loadOperadores(): Promise<void> {
        try {
            this.operadores = (await this.operadorService.findAllOperador().toPromise()) || [];
        } catch (error) {
            this.operadores = [];
        }
    }

    private setupClienteSearch(): void {
        if (this.personas.length > 0) {
            this.todosLosClientes = [...this.personas];
        }

        this.personasEncontradas = [...this.todosLosClientes];
        this.buscandoClientes = false;

        this.clienteSearchSubscription?.unsubscribe();

        this.clienteSearchSubscription = this.clienteSearchControl.valueChanges
            .pipe(
                debounceTime(300),
                distinctUntilChanged(),
                switchMap((searchTerm) => {
                    this.buscandoClientes = true;
                    const termino = searchTerm?.trim().toLowerCase() || '';

                    const resultados = this.todosLosClientes.filter((persona) =>
                        this.getClienteDisplayName(persona).toLowerCase().includes(termino),
                    );
                    this.personasEncontradas = resultados;
                    this.buscandoClientes = false;
                    return of(null);
                }),
            )
            .subscribe({
                error: () => {
                    this.buscandoClientes = false;
                },
            });
    }

    // ===== SIDEBAR METHODS =====
    onToggleSidebar(): void {
        this.sidebarCollapsed = !this.sidebarCollapsed;
    }

    onSidebarItemClick(item: SidebarMenuItem): void {
        if (item.route) {
            this.router.navigate([item.route]);
        }
    }

    // ===== PUBLIC METHODS - UI ACTIONS =====

    cerrarVistaGestionGrupos(): void {
        this.mostrarGestionGrupos = false;
    }

    recargarDatos(): void {
        // Recargar los datos actualizados después de un breve delay
        setTimeout(() => {
            this.loadCotizacion(this.cotizacionId!);
            // Salir del modo edición
            this.salirModoEdicion();
        }, 1000);
    }

    salirModoEdicion(): void {
        this.modoEdicion = false;
        // Limpiar estado temporal al salir del modo edición
        this.limpiarEstadoTemporal();
        // Remover el parámetro de modo edición de la URL
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { modo: null },
            queryParamsHandling: 'merge'
        });
    }

    navegarADetalle(cotizacionId: number | undefined, modoEdicion: boolean = false): void {
        if (!cotizacionId) {
            this.showError('ID de cotización no válido');
            return;
        }

        if (modoEdicion) {
            this.modoEdicion = true;
            this.editandoCotizacion = true;
            this.initializeForm();
            this.router.navigate(['/cotizaciones/detalle', cotizacionId], {
                queryParams: { modo: 'editar' }
            });
        } else {
            this.router.navigate(['/cotizaciones/detalle', cotizacionId]);
        }
    }


    // ===== NAVIGATION METHODS =====
    volverACotizaciones(): void {
        this.router.navigate(['/cotizaciones']);
    }

    irAEditarCotizacion(): void {
        if (this.cotizacionId) {
            // Cambiar a modo edición sin navegación adicional
            this.modoEdicion = true;
            this.editandoCotizacion = true;
            this.initializeForm();

            // Actualizar la URL para reflejar el modo edición
            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: { modo: 'editar' },
                queryParamsHandling: 'merge'
            });
        }
    }

    // ===== AUTOSAVE METHODS =====
    private getEstadoTemporalKey(): string {
        return `detalle-cotizacion-${this.cotizacionId}-temporal`;
    }

    private guardarEstadoTemporal(): void {
        if (!this.modoEdicion || !this.cotizacionId) {
            return; // Solo guardar en modo edición
        }

        const estadoTemporal = {
            detallesFijos: this.detallesFijos,
            gruposHoteles: this.gruposHoteles,
            deletedDetalleIds: this.deletedDetalleIds,
            grupoSeleccionadoId: this.grupoSeleccionadoId,
            timestamp: new Date().getTime()
        };

        try {
            const key = this.getEstadoTemporalKey();
            sessionStorage.setItem(key, JSON.stringify(estadoTemporal));
        } catch (error) {
            console.warn('No se pudo guardar el estado temporal:', error);
        }
    }

    private guardarEstadoTemporalDebounced(): void {
        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
        }
        this.saveDebounceTimer = setTimeout(() => {
            this.guardarEstadoTemporal();
        }, 500); // 500ms sin cambios antes de guardar
    }

    private cargarEstadoTemporal(): boolean {
        if (!this.modoEdicion || !this.cotizacionId) {
            return false;
        }

        try {
            const key = this.getEstadoTemporalKey();
            const estadoGuardado = sessionStorage.getItem(key);

            if (!estadoGuardado) {
                return false;
            }

            const estado = JSON.parse(estadoGuardado);
            const tiempoTranscurrido = new Date().getTime() - estado.timestamp;

            if (tiempoTranscurrido > 1800000) { // 30 minutos
                this.limpiarEstadoTemporal();
                return false;
            }

            // Restaurar arrays de detalles
            if (estado.detallesFijos) {
                this.detallesFijos = estado.detallesFijos;
            }
            if (estado.gruposHoteles) {
                this.gruposHoteles = estado.gruposHoteles;
            }
            if (estado.deletedDetalleIds) {
                this.deletedDetalleIds = estado.deletedDetalleIds;
            }
            if (estado.grupoSeleccionadoId) {
                this.grupoSeleccionadoId = estado.grupoSeleccionadoId;
            }

            return true;
        } catch (error) {
            console.warn('Error al cargar estado temporal:', error);
            this.limpiarEstadoTemporal();
            return false;
        }
    }

    private limpiarEstadoTemporal(): void {
        try {
            sessionStorage.removeItem(this.getEstadoTemporalKey());
            this.deletedDetalleIds = [];
        } catch (error) {
            console.warn('Error al limpiar estado temporal:', error);
        }
    }

    private configurarAutoguardado(): void {
        if (!this.modoEdicion) {
            return;
        }

        // Guardar antes de cerrar ventana/pestaña
        window.addEventListener('beforeunload', () => {
            this.guardarEstadoTemporal();
        });
    }

    // ===== FORM INITIALIZATION =====

    private initializeForm(): void {
        // Configurar autoguardado si estamos en modo edición
        this.configurarAutoguardado();
    }

    /**
     * Pobla el formulario con los datos de la cotización cargada.
     * Replica la lógica de populateFormFromCotizacionCompleta de cotizaciones.component.ts.
     */
    private async populateFormFromCotizacion(cotizacion: CotizacionConDetallesResponseDTO): Promise<void> {
        this.cotizacionForm.patchValue({
            codigoCotizacion: cotizacion.codigoCotizacion,
            personaId: cotizacion.personas?.id,
            fechaEmision: cotizacion.fechaEmision
                ? this.formatDateTimeLocal(new Date(cotizacion.fechaEmision))
                : '',
            fechaVencimiento: cotizacion.fechaVencimiento
                ? this.formatDateTimeLocal(new Date(cotizacion.fechaVencimiento))
                : '',
            estadoCotizacionId: cotizacion.estadoCotizacion?.id,
            sucursalId: cotizacion.sucursal?.id,
            origenDestino: cotizacion.origenDestino,
            fechaSalida: cotizacion.fechaSalida
                ? this.formatDateForInput(new Date(cotizacion.fechaSalida))
                : '',
            fechaRegreso: cotizacion.fechaRegreso
                ? this.formatDateForInput(new Date(cotizacion.fechaRegreso))
                : '',
            formaPagoId: cotizacion.formaPago?.id,
            cantAdultos: cotizacion.cantAdultos || 1,
            cantNinos: cotizacion.cantNinos || 0,
            moneda: cotizacion.moneda || 'USD',
            observacion: cotizacion.observacion || '',
        });

        // Guardar referencia original para el PATCH
        this.cotizacionOriginal = cotizacion as any;

        // Cargar cliente seleccionado si existe
        if (cotizacion.personas?.id) {
            await this.loadClienteForEdit(cotizacion.personas.id);
        }
    }

    /**
     * Carga el cliente para edición, configurando clienteSeleccionado.
     */
    private async loadClienteForEdit(personaId: number): Promise<void> {
        try {
            const persona = await firstValueFrom(
                this.personaService.findPersonaNaturalOrJuridicaById(personaId),
            );
            if (persona) {
                this.clienteSeleccionado = persona;
                if (!this.personasCache[personaId]) {
                    this.personasCache[personaId] = persona;
                    this.personasDisplayMap[personaId] = persona.nombre || 'Sin nombre';
                }
            }
        } catch (error) {
            console.warn('Error al cargar cliente para edición:', error);
            this.clienteSeleccionado = null;
        }
    }

    /**
     * Formatea una fecha para input type="datetime-local" (YYYY-MM-DDTHH:mm)
     */
    private formatDateTimeLocal(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    /**
     * Formatea una fecha para input type="date" (YYYY-MM-DD)
     */
    private formatDateForInput(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    async onSubmitCotizacion(): Promise<void> {
        if (this.cotizacionForm.invalid) {
            this.markFormGroupTouched(this.cotizacionForm);
            return;
        }

        this.isLoading = true;

        try {
            const formValue = this.cotizacionForm.getRawValue();
            let cotizacionResponse: CotizacionResponse;

            // Validar personaId: debe existir y ser el ID real retornado por el backend
            if (!formValue.personaId || formValue.personaId === 0) {
                this.showError('Debes seleccionar o registrar un cliente antes de guardar la cotización.');
                return;
            }

            if (this.editandoCotizacion && this.cotizacionEditandoId) {
                // ===== UPDATE con PATCH (actualización parcial) =====
                const patchPayload = this.buildPatchPayload(formValue);

                // Incluir relaciones (ids) en el PATCH si están presentes o cambiaron
                const relationFields: (keyof CotizacionPatchRequest)[] = [
                    'counterId',
                    'formaPagoId',
                    'estadoCotizacionId',
                    'sucursalId',
                    'carpetaId',
                ];

                relationFields.forEach((field) => {
                    const val = (formValue as any)[field as string];
                    const originalVal = this.cotizacionOriginal
                        ? (this.cotizacionOriginal as any)[field as string]
                        : undefined;
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

                const updateResult = await this.cotizacionService
                    .updateCotizacion(this.cotizacionEditandoId, sanitized)
                    .toPromise();

                if (!updateResult) throw new Error('Failed to update cotización');
                cotizacionResponse = updateResult;

                // Handle deleted detalles
                await this.eliminardeletedDetalleIds();

                this.showSuccess('Cotización actualizada exitosamente!');
            } else {
                // ===== CREATE con POST (creación completa) =====
                const cantAdultos = this.normalizeCount(formValue.cantAdultos, 1);
                const cantNinos = this.normalizeCount(formValue.cantNinos, 0);

                const cotizacionRequest: CotizacionRequest = {
                    cantAdultos: cantAdultos,
                    cantNinos: cantNinos,
                    fechaVencimiento: formValue.fechaVencimiento,
                    origenDestino: formValue.origenDestino,
                    fechaSalida: formValue.fechaSalida,
                    fechaRegreso: formValue.fechaRegreso,
                    moneda: formValue.moneda ?? 'USD',
                    observacion: formValue.observacion || '',
                    // Incluir relaciones en el create si vienen del formulario
                    counterId: formValue.counterId,
                    formaPagoId: formValue.formaPagoId,
                    estadoCotizacionId: formValue.estadoCotizacionId,
                    sucursalId: formValue.sucursalId,
                    carpetaId: formValue.carpetaId,
                };

                let createResult: CotizacionResponse | undefined = undefined;
                if (formValue.personaId) {
                    // Si se seleccionó una persona, usar el endpoint que crea la cotización vinculada a la persona
                    createResult = await this.cotizacionService
                        .createCotizacionWithPersona(formValue.personaId, cotizacionRequest)
                        .toPromise();
                } else {
                    createResult = await this.cotizacionService
                        .createCotizacion(cotizacionRequest)
                        .toPromise();
                }
                if (!createResult) throw new Error('Failed to create cotización');
                cotizacionResponse = createResult;

                // Ya incluimos las relaciones en el payload de creación (si vienen)

                this.showSuccess('Cotización creada exitosamente!');
            }

            // Create/update detalles
            await this.procesarDetalles(cotizacionResponse.id);

            // Recargar la cotización para reflejar los datos guardados
            this.limpiarEstadoTemporal();
            this.recargarDatos();
        } catch (error) {
            console.error('Error al guardar cotización:', error);
            this.showError(
                'Error al guardar la cotización. Por favor, verifique los datos e intente nuevamente.',
            );
        } finally {
            this.isLoading = false;
        }
    }

    private sanitizePatchPayload(patch: CotizacionPatchRequest): CotizacionPatchRequest {
        const sanitized: CotizacionPatchRequest = {};

        Object.keys(patch).forEach((key) => {
            let value: any = patch[key as keyof CotizacionPatchRequest];

            // Convertir Date objects a string ISO
            if (value instanceof Date) {
                value = (value as Date).toISOString().split('T')[0]; // YYYY-MM-DD
            }

            sanitized[key as keyof CotizacionPatchRequest] = value;
        });

        return sanitized;
    }

    private buildPatchPayload(formValue: any): CotizacionPatchRequest {
        const patch: CotizacionPatchRequest = {};

        if (!this.cotizacionOriginal) {
            return patch;
        }

        // Aplicar defaults a los valores del formulario ANTES de comparar
        const cantAdultos = this.normalizeCount(formValue.cantAdultos, 1);
        const cantNinos = this.normalizeCount(formValue.cantNinos, 0);

        // Campos a comparar para el PATCH
        const fieldsToCheck: (keyof CotizacionRequest)[] = [
            'origenDestino',
            'fechaSalida',
            'fechaRegreso',
            'moneda',
            'observacion',
            'fechaVencimiento',
        ];

        // Manejar cantAdultos y cantNinos juntos - si alguno cambia, incluir ambos
        const originalAdultos = this.cotizacionOriginal.cantAdultos ?? 1;
        const originalNinos = this.cotizacionOriginal.cantNinos ?? 0;

        if (cantAdultos !== originalAdultos || cantNinos !== originalNinos) {
            patch.cantAdultos = cantAdultos;
            patch.cantNinos = cantNinos;
        }

        // Comparar resto de campos
        fieldsToCheck.forEach((field) => {
            const newValue = formValue[field];
            const originalValue = this.cotizacionOriginal![field as keyof CotizacionResponse];

            // Si el valor cambió, agregarlo al patch
            if (newValue !== undefined && newValue !== null && newValue !== originalValue) {
                patch[field] = newValue;
            }
        });

        return patch;
    }

    private normalizeCount(value: unknown, fallback: number): number {
        if (value === null || value === undefined || value === '') {
            return fallback;
        }

        const parsed = typeof value === 'string' ? Number(value) : (value as number);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    private async eliminardeletedDetalleIds(): Promise<void> {
        const deletePromises = this.deletedDetalleIds.map((id) =>
            this.detalleCotizacionService.deleteDetalleCotizacion(id).toPromise(),
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

    private async crearDetalle(
        cotizacionId: number,
        detalle: DetalleCotizacionTemp,
        categoria: number,
    ): Promise<void> {
        const categoriaExiste = this.categorias.find((c) => c.id === categoria);

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
            const nuevoProveedor = await this.proveedorService
                .createProveedor({
                    nombre: detalle.proveedor.nombre,
                })
                .toPromise();
            proveedorId = nuevoProveedor?.id;
        }

        const productoId = detalle.producto?.id;
        const operadorId = detalle.operador?.id;
        const request: DetalleCotizacionRequest = {
            cantidad: detalle.cantidad || 1, // Default 1
            unidad: detalle.unidad || 1, // Default 1
            descripcion: detalle.descripcion || '', // Default empty
            categoria: categoria, // Mantener para compatibilidad local
            categoriaId: categoria, // Enviar categoriaId al backend
            productoId: productoId, // Enviar productoId si existe
            proveedorId: proveedorId, // Enviar proveedorId si existe
            operadorId: operadorId, // Enviar operadorId si existe
            comision: detalle.comision || 0, // Default 0
            precioHistorico: detalle.precioHistorico || 0, // Default 0
            seleccionado: detalle.seleccionado || false, // Campo de selección
        };

        // Validación final antes de enviar
        if (!request.categoria) {
            throw new Error('categoria es requerido para crear detalle');
        }

        const detalleCreado = await this.detalleCotizacionService
            .createDetalleCotizacion(cotizacionId, request)
            .toPromise();
    }

    private async actualizarDetalle(detalle: DetalleCotizacionTemp): Promise<void> {
        if (!detalle.id) return;

        // Enviamos también la categoría
        let categoriaId: number;
        if (
            typeof detalle.categoria === 'object' &&
            detalle.categoria !== null &&
            'id' in detalle.categoria
        ) {
            categoriaId = (detalle.categoria as any).id;
        } else {
            categoriaId = detalle.categoria as number;
        }
        const productoId = detalle.producto?.id;
        const proveedorId = detalle.proveedor?.id;
        const operadorId = detalle.operador?.id;

        const request: DetalleCotizacionRequest = {
            cantidad: detalle.cantidad || 1,
            unidad: detalle.unidad !== undefined && detalle.unidad !== null ? detalle.unidad : 0,
            descripcion: detalle.descripcion || '',
            categoria: categoriaId,
            categoriaId: categoriaId,
            productoId: productoId,
            proveedorId: proveedorId,
            operadorId: operadorId,
            comision: detalle.comision || 0,
            precioHistorico: detalle.precioHistorico || 0,
            seleccionado: detalle.seleccionado || false, // Campo de selección
        };

        await this.detalleCotizacionService.updateDetalleCotizacion(detalle.id, request).toPromise();
    }

    // ===== DATA LOADING METHODS =====
    private loadCotizacion(id: number): void {
        this.isLoading = true;
        this.error = null;
        this.historialCotizacion = [];

        this.loadHistorialCotizacion(id);

        // Mostrar loading global
        this.loadingService.setLoading(true);

        const subscription = this.cotizacionService.getCotizacionConDetalles(id)
            .pipe(
                tap(cotizacionConDetalles => {
                    if (!cotizacionConDetalles) {
                        throw new Error('Cotización no encontrada');
                    }
                }),
                catchError(error => {
                    console.error('Error al cargar cotización:', error);
                    this.error = 'Error al cargar la cotización. Por favor, intente nuevamente.';
                    return of(null);
                }),
                finalize(() => {
                    this.isLoading = false;
                    this.loadingService.setLoading(false);
                })
            )
            .subscribe(async cotizacion => {
                if (cotizacion) {
                    this.cotizacion = cotizacion;

                    // Cargar detalles y agruparlos por categoría
                    if (cotizacion.detalles && cotizacion.detalles.length > 0) {
                        this.loadDetallesFromCotizacionCompleta(cotizacion.detalles);
                    }

                    // Poblar formulario con datos existentes (tanto vista como edición)
                    await this.populateFormFromCotizacion(cotizacion);

                    // Inicializar formulario (autoguardado, etc.)
                    this.initializeForm();
                }
            });


        this.subscriptions.add(subscription);
    }

    openHistorialDrawer(): void {
        this.mostrarPanelHistorial = true;
    }

    closeHistorialDrawer(): void {
        this.mostrarPanelHistorial = false;
    }

    private loadHistorialCotizacion(cotizacionId: number): void {
        this.historialCotizacionLoading = true;

        const subscription = this.historialCotizacionService
            .findByCotizacionId(cotizacionId)
            .pipe(
                catchError((error) => {
                    console.error('Error al cargar historial de cotización:', error);
                    return of([] as HistorialCotizacionSimple[]);
                }),
                finalize(() => {
                    this.historialCotizacionLoading = false;
                }),
            )
            .subscribe((historial) => {
                this.historialCotizacion = historial || [];
            });

        this.subscriptions.add(subscription);
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
                operador: detalle.operador || null,
                categoria: detalle.categoria?.id || 1,
                descripcion: detalle.descripcion || 'Sin descripción',
                precioHistorico: detalle.precioHistorico || 0,
                comision: detalle.comision || 0,
                cantidad: detalle.cantidad || 1,
                unidad: detalle.unidad || 1,
                total: (detalle.precioHistorico || 0) + (detalle.comision || 0),
                isTemporary: false,
                seleccionado: detalle.seleccionado || false, // Incluir el estado de selección real de BD
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

    private addDetalleToGrupoHotelFromCompleta(detalle: any, categoria: any): void {
        const categoriaId = categoria?.id;
        let grupo = this.gruposHoteles.find((g) => g.categoria.id === categoriaId);

        if (!grupo && categoria) {
            grupo = {
                categoria: categoria,
                detalles: [],
                total: 0,
                isTemporary: false,
                seleccionado: false, // Inicializar como no seleccionado
            };
            this.gruposHoteles.push(grupo);
        }

        if (grupo) {
            grupo.detalles.push(detalle);
            grupo.total = grupo.detalles.reduce((sum, d) => sum + d.total, 0);
        }
    }

    private inferirGrupoSeleccionado(): void {
        // Reset: ningún grupo seleccionado inicialmente
        this.grupoSeleccionadoId = null;
        this.gruposHoteles.forEach((grupo) => (grupo.seleccionado = false));

        // Buscar un grupo que tenga al menos un detalle seleccionado
        for (const grupo of this.gruposHoteles) {
            const tieneDetallesSeleccionados = grupo.detalles.some(
                (detalle) => detalle.seleccionado === true,
            );

            if (tieneDetallesSeleccionados && grupo.categoria.id) {
                this.grupoSeleccionadoId = grupo.categoria.id;
                grupo.seleccionado = true;

                break; // Solo un grupo puede estar seleccionado
            }
        }
    }

    loadClienteInfo(personaId: number): void {
        if (!personaId || this.personasCache[personaId]) {
            return;
        }

        // Cargar datos desde PersonaService usando personaDisplay
        this.personaService.findPersonaNaturalOrJuridicaById(personaId).subscribe({
            next: (cached: personaDisplay) => {
                this.personasCache[personaId] = cached;
                this.personasDisplayMap[personaId] = `${cached.tipo === 'JURIDICA' ? 'RUC' : 'DNI'}: ${cached.identificador} - ${cached.nombre}`;
            },
            error: (error: any) => {
                console.error('Error al cargar información del cliente:', error);
                this.personasDisplayMap[personaId] = 'Cliente no encontrado';
            }
        });
    }

    getSelectedClienteName(): string {
        if (!this.clienteSeleccionado) return '';
        // Usar método que devuelve SOLO EL NOMBRE, sin formato de documento
        return this.getClienteDisplayName(this.clienteSeleccionado);
    }

    getClienteType(
        persona: PersonaNaturalResponse | PersonaJuridicaResponse | personaDisplay,
    ): string {
        if (!persona) {
            return 'Cliente';
        }

        // Si es personaDisplay (nuevo modelo unificado)
        if ('tipo' in persona && 'identificador' in persona) {
            const tipo = persona.tipo.toUpperCase();
            return tipo === 'JURIDICA' ? 'Empresa' : 'Cliente';
        }

        // Compatibilidad con modelos antiguos
        if ('ruc' in persona && persona.ruc) {
            return 'Empresa';
        }

        return 'Cliente';
    }

    // ===== CATEGORY MANAGEMENT =====

    crearNuevaCategoria(): void {
        if (this.nuevaCategoriaForm.invalid) {
            this.markFormGroupTouched(this.nuevaCategoriaForm);
            return;
        }

        this.creandoCategoria = true;
        const formValue = this.nuevaCategoriaForm.value;

        // Crear nueva categoría
        const nuevaCategoria: CategoriaRequest = {
            nombre: formValue.nombre,
        };

        // Llamar al servicio para crear la categoría
        this.categoriaService.create(nuevaCategoria).subscribe({
            next: (response) => {
                // Agregar a la lista local
                this.categorias.push(response);
                this.cleanFormNewCategory();
                this.creandoCategoria = false;
                this.showSuccess(`Categoría "${formValue.nombre}" creada exitosamente!`);
            },
            error: (error) => {
                this.showError('Error al crear la categoría. Por favor, intente nuevamente.');
                this.creandoCategoria = false;
            },
        });
    }

    editarCategoria(index: number): void {
        if (index >= 0 && index < this.categorias.length) {
            this.categoriaEditandose = index;
            // Guardar datos originales para poder cancelar
            this.categoriaDatosOriginales = {
                nombre: this.categorias[index].nombre,
            };
        }
    }

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
                nombre: categoria.nombre,
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
                },
            });
        }
    }

    cancelarEdicionCategoria(index: number): void {
        if (index >= 0 && index < this.categorias.length && this.categoriaDatosOriginales) {
            // Restaurar datos originales
            this.categorias[index].nombre = this.categoriaDatosOriginales.nombre;
            this.categoriaEditandose = null;
            this.categoriaDatosOriginales = null;
        }
    }

    confirmarEliminarCategoria(index: number): void {
        if (index >= 0 && index < this.categorias.length) {
            const categoria = this.categorias[index];
            const mensaje =
                `¿Estás seguro de que quieres eliminar la categoría "${categoria.nombre}"?\n\n` +
                `Esta acción no se puede deshacer y podría afectar grupos existentes.`;

            if (confirm(mensaje)) {
                this.eliminarCategoria(index);
            }
        }
    }

    eliminarCategoria(index: number): void {
        if (index >= 0 && index < this.categorias.length) {
            const categoria = this.categorias[index];

            this.categoriaService.delete(categoria.id!).subscribe({
                next: () => {
                    this.categorias.splice(index, 1);
                    this.showSuccess('Categoría eliminada exitosamente');
                },
                error: (error) => {
                    this.showError(
                        'Error al eliminar la categoría. Puede estar en uso por grupos existentes.',
                    );
                },
            });
        }
    }

    cleanFormNewCategory(): void {
        this.nuevaCategoriaForm.reset();
        this.markFormGroupUntouched(this.nuevaCategoriaForm);
    }

    getDetallesByCategoria(categoriaId: number): any[] {
        if (!this.cotizacion?.detalles) return [];
        return this.cotizacion.detalles.filter(
            (detalle) => detalle.categoria?.id === categoriaId,
        );
    }

    getCategoriasNoFijas(): any[] {
        return this.getCategoriasConDetalles().filter((c) => c.id !== 1);
    }

    hasCategoriasNoFijas(): boolean {
        return this.getCategoriasNoFijas().length > 0;
    }

    getCategoriasConDetalles(): any[] {
        if (!this.cotizacion?.detalles) return [];

        const categoriasMap = new Map();

        this.cotizacion.detalles.forEach((detalle) => {
            const categoriaId = detalle.categoria?.id || 1;
            const categoriaNombre = detalle.categoria?.nombre || 'Productos Fijos';

            if (!categoriasMap.has(categoriaId)) {
                categoriasMap.set(categoriaId, {
                    id: categoriaId,
                    nombre: categoriaNombre,
                    detalles: [],
                });
            }

            categoriasMap.get(categoriaId).detalles.push(detalle);
        });

        return Array.from(categoriasMap.values());
    }

    getTotalCategoria(detalles: any[]): number {
        return detalles.reduce(
            (sum, d) => sum + ((d.precioHistorico || 0) + (d.comision || 0)) * (d.cantidad || 1),
            0,
        );
    }

    getTotalProductosFijos(): number {
        const fijos = this.getDetallesByCategoria(1);
        return fijos.reduce(
            (sum, d) => sum + ((d.precioHistorico || 0) + (d.comision || 0)) * (d.cantidad || 1),
            0,
        );
    }

    hasProductosFijos(): boolean {
        return this.getDetallesByCategoria(1).length > 0;
    }

    getTotalCotizacionCompleta(): number {
        if (!this.cotizacion?.detalles) return 0;

        const totalFijos = this.getTotalProductosFijos();

        // Obtener las categorías no fijas (excluyendo categoría 1)
        const categoriasNoFijas = this.getCategoriasNoFijas();

        if (categoriasNoFijas.length === 0) {
            return totalFijos;
        }

        // Calcular el total de cada categoría y obtener el más económico
        const totalesPorCategoria = categoriasNoFijas.map((categoria) =>
            this.getTotalCategoria(this.getDetallesByCategoria(categoria.id)),
        );

        const grupoMasEconomico = Math.min(...totalesPorCategoria);

        return totalFijos + grupoMasEconomico;
    }

    // ===== PRIVATE HELPER METHODS =====

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

    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((key) => {
            const control = formGroup.get(key);
            control?.markAsTouched();
        });
    }

    private markFormGroupUntouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((key) => {
            const control = formGroup.get(key);
            control?.markAsUntouched();
            control?.markAsPristine();
        });
    }

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

    getGrupoSeleccionadoEnVisualizacion(): GrupoHotelTemp | null {
        // NO re-inferir aquí para evitar bucle infinito
        // La inferencia ya se hizo al cargar los detalles

        // Devolver el grupo que está marcado como seleccionado
        if (this.grupoSeleccionadoId) {
            const grupoSeleccionado = this.gruposHoteles.find(
                (g) => g.categoria.id === this.grupoSeleccionadoId,
            );
            if (grupoSeleccionado) {
                return grupoSeleccionado;
            }
        }

        return null;
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

    resetClienteSeleccionado(): void {
        this.clienteSeleccionado = null;
        this.cotizacionForm.patchValue({ personaId: '' });
        this.clearClienteSearch();
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

    // ===== UTILITY METHODS =====

    formatearFecha(fecha: any): string {
        if (!fecha) return 'N/A';
        const date = new Date(fecha);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    formatDateTime(dateString: string | undefined): string {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString('es-ES');
    }

    getEstadoBadgeClass(estado: EstadoCotizacionResponse | null | undefined): string {
        if (!estado) {
            return 'bg-gray-100 text-gray-800';
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

    getHistorialEstadoBadgeClass(estadoDescripcion: string | undefined): string {
        if (!estadoDescripcion) {
            return 'bg-gray-100 text-gray-800';
        }

        const descripcion = estadoDescripcion.toLowerCase();
        if (descripcion.includes('aprob')) {
            return 'bg-green-100 text-green-800';
        }

        if (descripcion.includes('pend')) {
            return 'bg-yellow-100 text-yellow-800';
        }

        if (descripcion.includes('rechaz') || descripcion.includes('anulad')) {
            return 'bg-red-100 text-red-800';
        }

        if (descripcion.includes('cerrad') || descripcion.includes('ganad') || descripcion.includes('venta')) {
            return 'bg-blue-100 text-blue-800';
        }

        return 'bg-gray-100 text-gray-800';
    }

    getHistorialUsuario(item: HistorialCotizacionSimple): string {
        if (item.usuarioNombre && item.usuarioNombre.trim()) {
            return item.usuarioNombre;
        }

        if (item.usuarioEmail && item.usuarioEmail.trim()) {
            return item.usuarioEmail;
        }

        return 'Usuario no identificado';
    }

    getPersonaDisplayName(personaId: number): string {
        if (!personaId || personaId === 0) {
            return 'Sin cliente';
        }

        if (this.personasDisplayMap[personaId]) {
            return this.personasDisplayMap[personaId];
        }
        return 'Cliente no encontrado';
    }

    seleccionarCliente(
        persona: PersonaNaturalResponse | PersonaJuridicaResponse | personaDisplay,
    ): void {
        // Obtener el ID del cliente para el formulario
        let personaId: number;

        // Si es personaDisplay (tipo unificado)
        if ('tipo' in persona && 'identificador' in persona) {
            personaId = persona.id;
        } else {
            // Para tipos originales, usar el FK de la tabla persona base si existe, si no el id propio
            personaId =
                typeof (persona as any).persona === 'object'
                    ? (persona as any).persona.id
                    : (persona as any).persona || persona.id;
        }

        this.clienteSeleccionado = persona;
        this.cotizacionForm.patchValue({ personaId: personaId });
        this.clearClienteSearch();
    }

    getClienteDisplayName(
        persona: PersonaNaturalResponse | PersonaJuridicaResponse | personaDisplay,
    ): string {
        // Soporta personaDisplay, PersonaNaturalResponse y PersonaJuridicaResponse
        if (!persona) {
            return 'Cliente';
        }
        // Si es personaDisplay
        if ('tipo' in persona && 'nombre' in persona) {
            return persona.nombre;
        }
        // Compatibilidad con modelos antiguos (soporta apellidosPaterno/apellidosMaterno)
        if ('nombres' in persona) {
            const nombres = (persona as any).nombres || '';
            const apellidoPaterno = (persona as any).apellidosPaterno || '';
            const apellidoMaterno = (persona as any).apellidosMaterno || '';

            const partesNombre = [nombres, apellidoPaterno, apellidoMaterno].filter(
                (parte) => parte && parte !== 'null',
            );
            return partesNombre.join(' ').trim() || 'Sin nombre';
        }
        // Si es PersonaJuridica
        if ('razonSocial' in persona) {
            return (persona as any).razonSocial || 'Empresa';
        }
        return 'Cliente';
    }

    onProductoChange(index: number, field: string, value: any): void {
        if (index >= 0 && index < this.detallesFijos.length) {
            const detalle = this.detallesFijos[index];

            switch (field) {
                case 'proveedorId':
                    detalle.proveedor = value
                        ? this.proveedores.find((p) => p.id === Number(value)) || null
                        : null;
                    break;
                case 'operadorId':
                    detalle.operador = value
                        ? this.operadores.find((o) => o.id === Number(value)) || null
                        : null;
                    break;
                case 'productoId':
                    detalle.producto = value ? this.productos.find((p) => p.id === Number(value)) : undefined;
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

    recalcularTotalDetalle(index: number): void {
        if (index >= 0 && index < this.detallesFijos.length) {
            const detalle = this.detallesFijos[index];
            detalle.total = (detalle.precioHistorico + detalle.comision) * detalle.cantidad;
        }
    }

    eliminarDetalleFijo(index: number): void {
        const detalle = this.detallesFijos[index];
        if (detalle.id && !detalle.isTemporary) {
            this.deletedDetalleIds.push(detalle.id);
        }
        this.detallesFijos.splice(index, 1);
    }

    calcularTotalDetalle(): number {
        const cantidad = this.detalleForm.get('cantidad')?.value || 0;
        const precioUnitario = this.detalleForm.get('precioHistorico')?.value || 0;
        const comision = this.detalleForm.get('comision')?.value || 0;
        return (precioUnitario + comision) * cantidad;
    }

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
            proveedor = this.proveedores.find((p) => p.id === proveedorId) || null;
        } else if (formValue.nuevoProveedor?.trim()) {
            // This would create a new proveedor, for now we'll simulate it
            proveedor = {
                id: 0, // temporary ID
                nombre: formValue.nuevoProveedor.trim(),
                creado: this.getCurrentLimaISOString(),
                actualizado: this.getCurrentLimaISOString(),
            } as ProveedorResponse;
        }

        let producto = null;
        if (formValue.productoId) {
            const productoId = Number(formValue.productoId);
            producto = this.productos.find((p) => p.id === productoId) || null;
        }

        let operador = null;
        if (formValue.operadorId) {
            const operadorId = Number(formValue.operadorId);
            operador = this.operadores.find((o) => o.id === operadorId) || null;
        }

        // Validar que tengamos al menos un producto
        if (!producto) {
            this.errorMessage = 'Error: No se pudo encontrar el producto seleccionado';
            setTimeout(() => (this.errorMessage = ''), 3000);
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
            operador,
            categoria: 1, // Productos fijos siempre categoria 1
            descripcion,
            precioHistorico,
            comision,
            cantidad,
            unidad,
            total: (precioHistorico + comision) * cantidad, // Correcto: (precio + comisión) * cantidad
            isTemporary: true,
            seleccionado: true, // PRODUCTOS FIJOS siempre seleccionados
        };

        this.detallesFijos.push(nuevoDetalle); // Agregar al final de la lista

        // Limpiar TODOS los campos del formulario después de agregar
        this.detalleForm.patchValue({
            proveedorId: '', // Limpiar proveedor
            operadorId: '', // Limpiar operador
            productoId: '', // Limpiar producto
            descripcion: '', // Limpiar descripción
            precioHistorico: 0, // Limpiar precio
            comision: 0, // Limpiar comisión
            cantidad: 1, // Resetear cantidad a 1
        });

        // Mensaje de éxito
        this.successMessage = 'Producto agregado correctamente';
        setTimeout(() => (this.successMessage = ''), 3000);
    }

    private getCurrentLimaISOString(): string {
        return this.getCurrentLimaTime().toISOString();
    }

    private getCurrentLimaTime(): Date {
        const now = new Date();
        return new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    }

    calcularTotalFijos(): number {
        return this.detallesFijos.reduce((sum, detalle) => sum + detalle.total, 0);
    }

    mostrarVistaGestionGrupos(): void {
        this.mostrarGestionGrupos = true;
    }

    getCategoriasDisponibles(): CategoriaResponse[] {
        if (this.categorias.length === 0) {
            return [];
        }

        const categoriasUsadas = this.gruposHoteles.map((g) => g.categoria.id);
        const disponibles = this.categorias.filter(
            (c) => c.id !== 1 && !categoriasUsadas.includes(c.id),
        );

        return disponibles;
    }

    async crearGrupoHotel(): Promise<void> {
        if (this.grupoHotelForm.invalid) {
            this.markFormGroupTouched(this.grupoHotelForm);
            return;
        }

        if (this.categorias.length === 0) {
            await this.loadCategorias();
        }

        const categoriaValue = this.grupoHotelForm.value.categoria;
        const categoriaId =
            typeof categoriaValue === 'object' && categoriaValue !== null
                ? categoriaValue.id
                : Number(categoriaValue);

        if (!categoriaId || isNaN(categoriaId)) {
            return;
        }

        const categoriaObj = this.categorias.find((c) => c.id === categoriaId);

        if (categoriaObj && !this.gruposHoteles.find((g) => g.categoria.id === categoriaId)) {
            const nuevoGrupo: GrupoHotelTemp = {
                categoria: categoriaObj,
                detalles: [],
                total: 0,
                isTemporary: true,
                seleccionado: false, // Inicializar como no seleccionado
            };
            this.gruposHoteles.push(nuevoGrupo);
            this.grupoHotelForm.reset();
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

    seleccionarGrupoUnico(grupoIndex: number): void {
        if (grupoIndex >= 0 && grupoIndex < this.gruposHoteles.length) {
            const grupoSeleccionado = this.gruposHoteles[grupoIndex];
            const categoriaId = grupoSeleccionado.categoria.id;

            // Si ya está seleccionado, lo deseleccionamos
            if (this.grupoSeleccionadoId === categoriaId) {
                this.grupoSeleccionadoId = null;
                grupoSeleccionado.seleccionado = false;
                // NUEVO: Marcar todos los detalles como NO seleccionados
                grupoSeleccionado.detalles.forEach((detalle) => {
                    detalle.seleccionado = false;
                });
            } else {
                // Deseleccionar todos los grupos primero
                this.gruposHoteles.forEach((grupo) => {
                    grupo.seleccionado = false;
                    // NUEVO: Marcar todos los detalles como NO seleccionados
                    grupo.detalles.forEach((detalle) => {
                        detalle.seleccionado = false;
                    });
                });

                // Seleccionar solo el grupo actual si tiene ID válido
                if (categoriaId !== undefined) {
                    this.grupoSeleccionadoId = categoriaId;
                    grupoSeleccionado.seleccionado = true;
                    // NUEVO: Marcar todos los detalles del grupo seleccionado como seleccionados
                    grupoSeleccionado.detalles.forEach((detalle) => {
                        detalle.seleccionado = true;
                    });
                }
            }
        }
    }

    isGrupoSeleccionado(grupoIndex: number): boolean {
        if (grupoIndex >= 0 && grupoIndex < this.gruposHoteles.length) {
            const grupo = this.gruposHoteles[grupoIndex];
            const categoriaId = grupo.categoria.id;
            return categoriaId !== undefined && this.grupoSeleccionadoId === categoriaId;
        }
        return false;
    }

    eliminarGrupoHotel(index: number): void {
        const grupo = this.gruposHoteles[index];

        // Add all detalle IDs to deleted array
        grupo.detalles.forEach((detalle) => {
            if (detalle.id && !detalle.isTemporary) {
                this.deletedDetalleIds.push(detalle.id);
            }
        });

        this.gruposHoteles.splice(index, 1);
    }

    onGrupoProductoChange(groupIndex: number, detailIndex: number, field: string, value: any): void {
        if (groupIndex >= 0 && groupIndex < this.gruposHoteles.length) {
            const grupo = this.gruposHoteles[groupIndex];
            if (detailIndex >= 0 && detailIndex < grupo.detalles.length) {
                const detalle = grupo.detalles[detailIndex];

                switch (field) {
                    case 'proveedorId':
                        detalle.proveedor = value
                            ? this.proveedores.find((p) => p.id === Number(value)) || null
                            : null;
                        break;
                    case 'operadorId':
                        detalle.operador = value
                            ? this.operadores.find((o) => o.id === Number(value)) || null
                            : null;
                        break;
                    case 'productoId':
                        detalle.producto = value
                            ? this.productos.find((p) => p.id === Number(value))
                            : undefined;
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

    recalcularTotalDetalleGrupo(groupIndex: number, detailIndex: number): void {
        if (groupIndex >= 0 && groupIndex < this.gruposHoteles.length) {
            const grupo = this.gruposHoteles[groupIndex];
            if (detailIndex >= 0 && detailIndex < grupo.detalles.length) {
                const detalle = grupo.detalles[detailIndex];
                detalle.total = (detalle.precioHistorico + (detalle.comision || 0)) * detalle.cantidad;
            }
        }
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

    calcularTotalDetalleGrupo(): number {
        const cantidad = this.detalleGrupoForm.get('cantidad')?.value || 0;
        const precioUnitario = this.detalleGrupoForm.get('precioHistorico')?.value || 0;
        const comision = this.detalleGrupoForm.get('comision')?.value || 0;
        return (precioUnitario + comision) * cantidad;
    }

    agregarDetalleAGrupo(grupoIndex: number): void {
        if (this.detalleGrupoForm.invalid) {
            this.markFormGroupTouched(this.detalleGrupoForm);
            return;
        }

        const grupo = this.gruposHoteles[grupoIndex];
        const formValue = this.detalleGrupoForm.value;

        let proveedor: ProveedorResponse | null = null;
        if (formValue.proveedorId) {
            const proveedorId = Number(formValue.proveedorId);
            proveedor = this.proveedores.find((p) => p.id === proveedorId) || null;
        } else if (formValue.nuevoProveedor?.trim()) {
            proveedor = {
                id: 0,
                nombre: formValue.nuevoProveedor.trim(),
                creado: this.getCurrentLimaISOString(),
                actualizado: this.getCurrentLimaISOString(),
            } as ProveedorResponse;
        }

        let operador: OperadorResponse | null = null;
        if (formValue.operadorId) {
            const operadorId = Number(formValue.operadorId);
            operador = this.operadores.find((o) => o.id === operadorId) || null;
        }

        const producto = this.productos.find((p) => p.id === Number(formValue.productoId));
        const descripcion = formValue.descripcion?.trim() || 'Sin descripción';
        const precioHistorico = formValue.precioHistorico || 0;
        const comision = formValue.comision || 0; // Leer comisión del formulario
        const cantidad = formValue.cantidad || 1;
        const unidad = formValue.unidad || 1;

        const nuevoDetalle: DetalleCotizacionTemp = {
            proveedor,
            producto,
            operador,
            categoria: grupo.categoria.id ?? 1,
            descripcion,
            precioHistorico,
            comision,
            cantidad,
            unidad,
            total: (precioHistorico + comision) * cantidad, // Calcular correctamente: (precio + comisión) * cantidad
            isTemporary: true,
            seleccionado: false, // Inicializar como no seleccionado
        };

        grupo.detalles.push(nuevoDetalle);
        grupo.total = grupo.detalles.reduce(
            (sum, d) => sum + (d.precioHistorico + d.comision) * d.cantidad,
            0,
        );
        this.detalleGrupoForm.reset({
            cantidad: 1,
            unidad: 1,
            precioHistorico: 0,
            comision: 0, // Resetear comisión también
            operadorId: '',
        });
    }

    calcularCotizacionEconomica(): number {
        const totalFijos = this.calcularTotalFijos();

        if (this.gruposHoteles.length === 0) {
            return totalFijos;
        }

        const grupoMasEconomico = Math.min(...this.gruposHoteles.map((g) => g.total));
        return totalFijos + grupoMasEconomico;
    }
}
