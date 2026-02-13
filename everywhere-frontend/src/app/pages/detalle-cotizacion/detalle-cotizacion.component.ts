import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

// Services
import { CotizacionService } from '../../core/service/Cotizacion/cotizacion.service';
import { LoadingService } from '../../core/service/loading.service';
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

import { personaDisplay } from '../../shared/models/Persona/persona.model';

import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';

// Models
import {
    CotizacionRequest,
    CotizacionResponse,
    CotizacionConDetallesResponseDTO,
    CotizacionPatchRequest
} from '../../shared/models/Cotizacion/cotizacion.model';
import {
    DetalleCotizacionRequest,
    DetalleCotizacionResponse
} from '../../shared/models/Cotizacion/detalleCotizacion.model';
import { PersonaNaturalResponse } from '../../shared/models/Persona/personaNatural.model';
import { PersonaJuridicaResponse } from '../../shared/models/Persona/personaJuridica.models';
import { FormaPagoResponse } from '../../shared/models/FormaPago/formaPago.model';
import { EstadoCotizacionResponse } from '../../shared/models/Cotizacion/estadoCotizacion.model';
import { SucursalResponse } from '../../shared/models/Sucursal/sucursal.model';
import { ProductoResponse } from '../../shared/models/Producto/producto.model';
import { ProveedorResponse } from '../../shared/models/Proveedor/proveedor.model';
import { CategoriaResponse } from '../../shared/models/Categoria/categoria.model';
import { CategoriaRequest } from '../../shared/models/Categoria/categoria.model';

import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';

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
    selector: 'app-detalle-cotizacion',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, SidebarComponent],
    templateUrl: './detalle-cotizacion.component.html',
    styleUrls: ['./detalle-cotizacion.component.css']
})
export class DetalleCotizacionComponent implements OnInit, OnDestroy {

    // Services
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private loadingService = inject(LoadingService);
    private menuConfigService = inject(MenuConfigService);
    private fb = inject(FormBuilder);
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
    private cotizacionService = inject(CotizacionService);

    // Data
    cotizacion: CotizacionConDetallesResponseDTO | null = null;
    cotizacionId: number | null = null;

    // Cache and display
    personasCache: { [id: number]: personaDisplay } = {};
    personasDisplayMap: { [id: number]: string } = {};

    // Reference data
    categorias: CategoriaResponse[] = [];
    productos: ProductoResponse[] = [];
    proveedores: ProveedorResponse[] = [];

    // Detalle Cotización arrays
    detallesFijos: DetalleCotizacionTemp[] = [];
    gruposHoteles: GrupoHotelTemp[] = [];
    deletedDetalleIds: number[] = [];
    grupoSeleccionadoId: number | null = null;
    estadosCotizacion: EstadoCotizacionResponse[] = [];
    sucursales: SucursalResponse[] = [];
    formasPago: FormaPagoResponse[] = [];
    personas: any[] = []; // All personas for selector
    personasFiltradas: any[] = []; // Filtered personas for search
    clienteSearch: string = ''; // Search term for cliente
    cambiandoCliente: boolean = false; // Flag to show client search in edit mode

    // Forms
    cotizacionForm: FormGroup;
    detalleForm!: FormGroup; // Para agregar productos fijos
    detalleGrupoForm!: FormGroup; // Para agregar productos a grupos
    grupoHotelForm!: FormGroup; // Para crear grupos de hoteles

    // UI State
    isLoading = false;
    error: string | null = null;
    sidebarCollapsed = false;
    modoEdicion = false;

    // Sidebar
    sidebarMenuItems: ExtendedSidebarMenuItem[] = [];

    private subscriptions = new Subscription();

    constructor() {
        this.cotizacionForm = this.fb.group({
            codigoCotizacion: [''],
            fechaEmision: [''],
            fechaVencimiento: [''],
            estadoCotizacionId: [''],
            sucursalId: [''],
            personaId: [''],
            origenDestino: [''],
            fechaSalida: [''],
            fechaRegreso: [''],
            cantAdultos: [1],
            cantNinos: [0],
            formaPagoId: [''],
            moneda: ['USD'],
            observacion: ['']
        });

        // Formulario para agregar productos fijos
        this.detalleForm = this.fb.group({
            proveedorId: [''],
            productoId: [''],
            descripcion: [''],
            cantidad: [1],
            precioHistorico: [0],
            comision: [0],
            unidad: [1]
        });

        // Formulario para agregar productos a grupos
        this.detalleGrupoForm = this.fb.group({
            proveedorId: [''],
            productoId: [''],
            descripcion: [''],
            cantidad: [1],
            precioHistorico: [0],
            comision: [0],
            unidad: [1]
        });

        // Formulario para crear grupos de hoteles
        this.grupoHotelForm = this.fb.group({
            categoria: ['']
        });
    }

    ngOnInit(): void {
        this.initializeSidebar();
        this.loadReferenceData();
        this.loadCotizacionFromRoute();
        this.getAllPersonas();
        // this.getAllPersonas(); // This is now part of loadReferenceData
    }

    private initializeSidebar(): void {
        this.sidebarMenuItems = this.menuConfigService.getMenuItems('/cotizaciones');
    }

    private async getAllPersonas(): Promise<void> {
        try {
            // EXACT modal pattern: load natural and juridica separately
            const personasNaturales = await this.personaNaturalService.findAll().toPromise() || [];
            const personasJuridicas = await this.personaJuridicaService.findAll().toPromise() || [];

            // Combine both lists
            this.personas = [...personasNaturales, ...personasJuridicas];
            this.personasFiltradas = [...this.personas]; // Initialize filtered list
        } catch (error) {
            console.error('Error loading personas:', error);
            this.personas = [];
            this.personasFiltradas = [];
        }
    }

    filtrarClientes(): void {
        if (!this.clienteSearch || this.clienteSearch.trim() === '') {
            this.personasFiltradas = [...this.personas];
            return;
        }
        const searchTerm = this.clienteSearch.toLowerCase();
        this.personasFiltradas = this.personas.filter(p =>
            this.getClienteDisplayName(p).toLowerCase().includes(searchTerm)
        );
    }

    getClienteDisplayName(persona: any): string {
        // Returns ONLY the name (no DNI/RUC prefix)
        if (!persona) return 'Cliente';

        // PersonaNatural
        if ('nombres' in persona) {
            const nombres = (persona as any).nombres || '';
            const apellidoPaterno = (persona as any).apellidosPaterno || '';
            const apellidoMaterno = (persona as any).apellidosMaterno || '';

            const partesNombre = [nombres, apellidoPaterno, apellidoMaterno].filter(
                (parte) => parte && parte !== 'null',
            );
            return partesNombre.join(' ').trim() || 'Sin nombre';
        }

        // PersonaJuridica
        if ('razonSocial' in persona) {
            return (persona as any).razonSocial || 'Empresa';
        }

        return 'Cliente';
    }

    getClienteType(persona: any): string {
        if (!persona) return 'Cliente';

        // PersonaNatural
        if ('nombres' in persona || 'documento' in persona) {
            return 'Cliente';
        }

        // PersonaJuridica
        if ('razonSocial' in persona || 'ruc' in persona) {
            return 'Empresa';
        }

        return 'Cliente';
    }

    clearClienteSearch(): void {
        this.clienteSearch = '';
        this.personasFiltradas = [...this.personas];
    }

    seleccionarClienteDetalle(persona: any): void {
        if (!this.modoEdicion) return;
        this.cotizacionForm.patchValue({ personaId: persona.id });
        this.cambiandoCliente = false; // Hide search after selection
        this.clienteSearch = ''; // Clear search
        this.personasFiltradas = [...this.personas]; // Reset filter
    }

    cambiarCliente(): void {
        this.cambiandoCliente = true;
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    private loadReferenceData(): void {
        // Load estados de cotizacion
        this.estadoCotizacionService.getAllEstadosCotizacion().subscribe({
            next: (estados: EstadoCotizacionResponse[]) => this.estadosCotizacion = estados,
            error: (error: any) => console.error('Error loading estados:', error)
        });

        // Load sucursales
        this.sucursalService.findAllSucursal().subscribe({
            next: (sucursales: SucursalResponse[]) => this.sucursales = sucursales,
            error: (error: any) => console.error('Error loading sucursales:', error)
        });

        // Load formas de pago
        this.formaPagoService.getAllFormasPago().subscribe({
            next: (formasPago: FormaPagoResponse[]) => this.formasPago = formasPago,
            error: (error: any) => console.error('Error loading formas de pago:', error)
        });

        // Load productos
        this.productoService.getAllProductos().subscribe({
            next: (productos: ProductoResponse[]) => this.productos = productos,
            error: (error: any) => console.error('Error loading productos:', error)
        });

        // Load proveedores
        this.proveedorService.findAllProveedor().subscribe({
            next: (proveedores: ProveedorResponse[]) => this.proveedores = proveedores,
            error: (error: any) => console.error('Error loading proveedores:', error)
        });

        // Load categorias
        this.categoriaService.findAll().subscribe({
            next: (categorias: CategoriaResponse[]) => this.categorias = categorias,
            error: (error: any) => console.error('Error loading categorías:', error)
        });
    }

    private loadCotizacionFromRoute(): void {
        const idParam = this.route.snapshot.paramMap.get('id');

        if (!idParam || isNaN(Number(idParam))) {
            this.error = 'ID de cotización inválido';
            return;
        }

        const modoParam = this.route.snapshot.queryParamMap.get('modo');
        this.modoEdicion = modoParam === 'editar';

        this.cotizacionId = Number(idParam);
        this.loadCotizacion(this.cotizacionId);
    }

    private loadCotizacion(id: number): void {
        this.isLoading = true;
        this.error = null;
        this.loadingService.setLoading(true);

        const subscription = this.cotizacionService.getCotizacionConDetalles(id)
            .subscribe({
                next: async (cotizacion) => {
                    this.cotizacion = cotizacion;
                    this.initializeForm();

                    // Cargar persona si no está en cache
                    if (cotizacion.personas?.id && !this.personasCache[cotizacion.personas.id]) {
                        await this.loadPersonaById(cotizacion.personas.id);
                    }

                    // Populate edit arrays if in edit mode
                    if (this.modoEdicion) {
                        this.populateEditArrays();
                    }
                },
                error: (error) => {
                    console.error('Error al cargar cotización:', error);
                    this.error = 'Error al cargar la cotización. Por favor, intente nuevamente.';
                },
                complete: () => {
                    this.isLoading = false;
                    this.loadingService.setLoading(false);
                }
            });

        this.subscriptions.add(subscription);
    }

    private initializeForm(): void {
        if (this.cotizacion) {
            // Convert dates to datetime-local format
            const formatDateTimeLocal = (date: any) => {
                if (!date) return '';
                const d = new Date(date);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                return `${year}-${month}-${day}T${hours}:${minutes}`;
            };

            const formatDateLocal = (date: any) => {
                if (!date) return '';
                const d = new Date(date);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            this.cotizacionForm.patchValue({
                codigoCotizacion: this.cotizacion.codigoCotizacion,
                fechaEmision: formatDateTimeLocal(this.cotizacion.fechaEmision),
                fechaVencimiento: formatDateTimeLocal(this.cotizacion.fechaVencimiento),
                estadoCotizacionId: this.cotizacion.estadoCotizacion?.id || '',
                sucursalId: this.cotizacion.sucursal?.id || '',
                personaId: this.cotizacion.personas?.id || '',
                origenDestino: this.cotizacion.origenDestino || '',
                fechaSalida: formatDateLocal(this.cotizacion.fechaSalida),
                fechaRegreso: formatDateLocal(this.cotizacion.fechaRegreso),
                cantAdultos: this.cotizacion.cantAdultos || 1,
                cantNinos: this.cotizacion.cantNinos || 0,
                formaPagoId: this.cotizacion.formaPago?.id || '',
                moneda: this.cotizacion.moneda || 'USD',
                observacion: this.cotizacion.observacion || ''
            });
        }
    }

    /**
     * Populate detallesFijos array from cotizacion.detalles when in edit mode
     */
    private populateEditArrays(): void {
        console.log('🔧 populateEditArrays called');
        console.log('📦 cotizacion:', this.cotizacion);
        console.log('📋 cotizacion.detalles:', this.cotizacion?.detalles);

        if (!this.cotizacion?.detalles) {
            console.warn('⚠️ No detalles found in cotizacion');
            return;
        }

        // Clear existing arrays
        this.detallesFijos = [];
        this.gruposHoteles = [];

        // Populate detallesFijos (categoría 1)
        const productosFijos = this.cotizacion.detalles.filter(d => d.categoria?.id === 1);
        console.log(`✅ Found ${productosFijos.length} productos fijos (categoría 1)`);

        this.detallesFijos = productosFijos.map(d => ({
            id: d.id,
            proveedor: d.proveedor || null,
            producto: d.producto,
            categoria: 1,
            descripcion: d.descripcion || '',
            precioHistorico: d.precioHistorico || 0,
            comision: d.comision || 0,
            cantidad: d.cantidad || 1,
            unidad: d.unidad || 1,
            total: ((d.precioHistorico || 0) + (d.comision || 0)) * (d.cantidad || 1),
            isTemporary: false,
            seleccionado: true
        }));

        console.log('🎯 detallesFijos populated:', this.detallesFijos);

        // TODO: Populate gruposHoteles (categorías != 1) for v2
    }

    // Navigation
    volverACotizaciones(): void {
        this.router.navigate(['/cotizaciones']);
    }

    irAEditarCotizacion(): void {
        this.modoEdicion = true;
        this.cambiandoCliente = false; // Reset to show client card, not search
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { modo: 'editar' },
            queryParamsHandling: 'merge'
        });
    }

    cancelarEdicion(): void {
        this.modoEdicion = false;
        this.cambiandoCliente = false; // Reset flag
        // Reset form to original values
        this.initializeForm();
        // Remove query params
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {},
            queryParamsHandling: 'merge'
        });
    }

    guardarCambios(): void {
        if (!this.cotizacion || !this.cotizacionForm.valid) {
            console.error('Formulario inválido');
            return;
        }

        const formValue = this.cotizacionForm.value;

        // Prepare detalles array from detallesFijos and gruposHoteles
        const allDetalles: any[] = [];

        // Add productos fijos
        this.detallesFijos.forEach(detalle => {
            allDetalles.push({
                id: detalle.id || undefined,
                proveedorId: detalle.proveedor?.id || null,
                productoId: detalle.producto?.id || null,
                categoria: 1,
                descripcion: detalle.descripcion,
                precioHistorico: detalle.precioHistorico,
                comision: detalle.comision,
                cantidad: detalle.cantidad,
                unidad: detalle.unidad,
                seleccionado: true
            });
        });

        // Add hotel groups products
        this.gruposHoteles.forEach(grupo => {
            const categoriaId = grupo.categoria.id;
            const isGrupoSeleccionado = grupo.categoria.id === this.grupoSeleccionadoId;

            grupo.detalles.forEach(detalle => {
                allDetalles.push({
                    id: detalle.id || undefined,
                    proveedorId: detalle.proveedor?.id || null,
                    productoId: detalle.producto?.id || null,
                    categoria: categoriaId,
                    descripcion: detalle.descripcion,
                    precioHistorico: detalle.precioHistorico,
                    comision: detalle.comision,
                    cantidad: detalle.cantidad,
                    unidad: detalle.unidad,
                    seleccionado: isGrupoSeleccionado
                });
            });
        });

        // Prepare update DTO
        const updateDTO = {
            id: this.cotizacion.id,
            codigoCotizacion: formValue.codigoCotizacion,
            fechaEmision: formValue.fechaEmision ? new Date(formValue.fechaEmision).toISOString() : undefined,
            fechaVencimiento: formValue.fechaVencimiento ? new Date(formValue.fechaVencimiento).toISOString() : undefined,
            personaId: formValue.personaId || this.cotizacion.personas?.id,
            origenDestino: formValue.origenDestino,
            fechaSalida: formValue.fechaSalida,
            fechaRegreso: formValue.fechaRegreso,
            cantAdultos: formValue.cantAdultos,
            cantNinos: formValue.cantNinos,
            moneda: formValue.moneda,
            formaPagoId: formValue.formaPagoId ? Number(formValue.formaPagoId) : undefined,
            estadoCotizacionId: formValue.estadoCotizacionId ? Number(formValue.estadoCotizacionId) : undefined,
            sucursalId: formValue.sucursalId ? Number(formValue.sucursalId) : undefined,
            observacion: formValue.observacion,
            detalles: allDetalles,
            deletedDetalleIds: this.deletedDetalleIds
        };

        // Call update service
        this.loadingService.setLoading(true);
        this.cotizacionService.updateCotizacion(this.cotizacion.id, updateDTO).subscribe({
            next: (response: CotizacionResponse) => {
                // Clear deleted IDs
                this.deletedDetalleIds = [];

                // Reload full data with details
                this.cotizacionService.getCotizacionConDetalles(this.cotizacion!.id).subscribe({
                    next: (updatedCotizacion: CotizacionConDetallesResponseDTO) => {
                        this.loadingService.setLoading(false);
                        this.cotizacion = updatedCotizacion;
                        this.initializeForm();
                        this.modoEdicion = false;
                        this.cambiandoCliente = false;

                        // Process details and categories
                        if (updatedCotizacion.detalles && updatedCotizacion.detalles.length > 0) {
                            this.procesarDetallesEnGrupos(updatedCotizacion.detalles as any);
                        }

                        // Remove query params
                        this.router.navigate([], {
                            relativeTo: this.route,
                            queryParams: {},
                            queryParamsHandling: 'merge'
                        });
                    },
                    error: (error: any) => {
                        this.loadingService.setLoading(false);
                        console.error('Error reloading cotizacion:', error);
                    }
                });
            },
            error: (error: any) => {
                this.loadingService.setLoading(false);
                console.error('Error updating cotizacion:', error);
                alert('Error al guardar los cambios. Por favor intente nuevamente.');
            }
        });
    }

    salirModoEdicion(): void {
        this.modoEdicion = false;

        // Remove edit mode parameter from URL
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { modo: null },
            queryParamsHandling: 'merge'
        });
    }

    recargarDatos(): void {
        if (this.cotizacionId) {
            this.loadCotizacion(this.cotizacionId);
        }
    }

    onToggleSidebar(): void {
        this.sidebarCollapsed = !this.sidebarCollapsed;
    }

    onSidebarItemClick(item: ExtendedSidebarMenuItem): void {
        if (item.route) {
            this.router.navigate([item.route]);
        }
    }

    guardarCotizacion(): void {
        // TODO: Implement save logic
        console.log('Guardando cotización...');
        // After saving, exit edit mode
        this.salirModoEdicion();
    }

    // =====  HELPER METHODS FOR DATA LOADING =====

    private async loadPersonaById(personaId: number): Promise<void> {
        try {
            const personaDisplay = await this.personaService
                .findPersonaNaturalOrJuridicaById(personaId)
                .toPromise();

            if (personaDisplay) {
                this.personasCache[personaId] = personaDisplay;
                this.personasDisplayMap[personaId] = personaDisplay.nombre;
            }
        } catch (error) {
            console.error('Error cargando persona:', error);
        }
    }

    private async procesarDetallesEnGrupos(detalles: DetalleCotizacionResponse[]): Promise<void> {
        // Limpiar grupos existentes
        this.gruposHoteles = [];
        this.detallesFijos = [];

        // Cargar categorías si no están cargadas
        if (this.categorias.length === 0) {
            try {
                this.categorias = await this.categoriaService.findAll().toPromise() || [];
            } catch (error) {
                console.error('Error cargando categorías:', error);
            }
        }

        // Agrupar detalles por categoría
        const gruposPorCategoria: { [key: number]: DetalleCotizacionTemp[] } = {};

        detalles.forEach(detalle => {
            const categoriaId = detalle.categoria?.id || 1;

            if (!gruposPorCategoria[categoriaId]) {
                gruposPorCategoria[categoriaId] = [];
            }

            const detalleTemp: DetalleCotizacionTemp = {
                id: detalle.id,
                proveedor: detalle.proveedor,
                producto: detalle.producto,
                categoria: detalle.categoria || 1,
                descripcion: detalle.descripcion || '',
                precioHistorico: detalle.precioHistorico || 0,
                comision: detalle.comision || 0,
                cantidad: detalle.cantidad || 1,
                unidad: detalle.unidad || 1,
                total: ((detalle.precioHistorico || 0) + (detalle.comision || 0)) * (detalle.cantidad || 1),
                isTemporary: false,
                seleccionado: detalle.seleccionado || false
            };

            gruposPorCategoria[categoriaId].push(detalleTemp);
        });

        // Poblar detallesFijos con productos de categoría 1
        if (gruposPorCategoria[1]) {
            this.detallesFijos = gruposPorCategoria[1].map(detalle => ({
                ...detalle,
                seleccionado: true // Productos fijos siempre seleccionados
            }));
        }

        // Crear grupos por categoría (excepto categoría 1 que son productos fijos)
        Object.keys(gruposPorCategoria).forEach(categoriaIdStr => {
            const categoriaId = parseInt(categoriaIdStr);

            // Salt ar categoría 1 (productos fijos)
            if (categoriaId === 1) return;

            const categoria = this.categorias.find(c => c.id === categoriaId);
            if (categoria) {
                const detallesGrupo = gruposPorCategoria[categoriaId];
                const totalGrupo = detallesGrupo.reduce((sum, d) => sum + d.total, 0);

                // Verificar si algún detalle está seleccionado
                const haySeleccionados = detallesGrupo.some(d => d.seleccionado);

                const grupo: GrupoHotelTemp = {
                    categoria: categoria,
                    detalles: detallesGrupo,
                    total: totalGrupo,
                    isTemporary: false,
                    seleccionado: haySeleccionados
                };

                this.gruposHoteles.push(grupo);

                // Si hay detalles seleccionados, marcar como grupo seleccionado
                if (haySeleccionados) {
                    this.grupoSeleccionadoId = categoriaId;
                }
            }
        });
    }

    // ===== HELPER METHODS FOR DISPLAY =====

    getCategoriasConDetalles(): any[] {
        if (!this.cotizacion || !this.cotizacion.detalles) return [];

        const categoriasMap: { [key: number]: any } = {};

        this.cotizacion.detalles.forEach(detalle => {
            const cat = detalle.categoria;
            if (cat && cat.id) {
                if (!categoriasMap[cat.id]) {
                    categoriasMap[cat.id] = {
                        ...cat,
                        detalles: []
                    };
                }
                categoriasMap[cat.id].detalles.push(detalle);
            }
        });

        return Object.values(categoriasMap);
    }

    // ===== FORMATTING METHODS =====

    formatDate(date: any): string {
        if (!date) return 'N/A';
        const d = new Date(date);
        return d.toLocaleDateString('es-ES');
    }

    formatDateTime(date: any): string {
        if (!date) return 'N/A';
        const d = new Date(date);
        return d.toLocaleDateString('es-ES') + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }

    getPersonaDisplayName(personaId: number): string {
        if (!personaId) return 'Sin cliente';
        return this.personasDisplayMap[personaId] || `Cliente ID: ${personaId}`;
    }

    // ===== PRODUCTOS FIJOS - CRUD METHODS =====

    agregarDetalleFijo(): void {
        if (this.detalleForm.invalid) {
            return;
        }

        const formValue = this.detalleForm.value;

        let proveedor = null;
        if (formValue.proveedorId) {
            const proveedorId = Number(formValue.proveedorId);
            proveedor = this.proveedores.find((p) => p.id === proveedorId) || null;
        }

        let producto = null;
        if (formValue.productoId) {
            const productoId = Number(formValue.productoId);
            producto = this.productos.find((p) => p.id === productoId) || null;
        }

        if (!producto) {
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
            categoria: 1, // Productos fijos siempre categoría 1
            descripcion,
            precioHistorico,
            comision,
            cantidad,
            unidad,
            total: (precioHistorico + comision) * cantidad,
            isTemporary: true,
            seleccionado: true,
        };

        this.detallesFijos.push(nuevoDetalle);

        // Limpiar formulario
        this.detalleForm.patchValue({
            proveedorId: '',
            productoId: '',
            descripcion: '',
            precioHistorico: 0,
            comision: 0,
            cantidad: 1,
        });
    }

    eliminarDetalleFijo(index: number): void {
        const detalle = this.detallesFijos[index];
        if (detalle.id && !detalle.isTemporary) {
            this.deletedDetalleIds.push(detalle.id);
        }
        this.detallesFijos.splice(index, 1);
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
        const detalle = this.detallesFijos[index];
        detalle.total = (detalle.precioHistorico + detalle.comision) * detalle.cantidad;
    }

    calcularTotalDetalle(): number {
        const cantidad = this.detalleForm.get('cantidad')?.value || 0;
        const precioUnitario = this.detalleForm.get('precioHistorico')?.value || 0;
        const comision = this.detalleForm.get('comision')?.value || 0;
        return (precioUnitario + comision) * cantidad;
    }

    // ===== GRUPOS DE HOTELES - CRUD METHODS =====

    async crearGrupoHotel(): Promise<void> {
        if (this.grupoHotelForm.invalid) {
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
                seleccionado: false,
            };
            this.gruposHoteles.push(nuevoGrupo);
            this.grupoHotelForm.reset();
        }
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

    agregarDetalleAGrupo(grupoIndex: number): void {
        if (this.detalleGrupoForm.invalid) {
            return;
        }

        const grupo = this.gruposHoteles[grupoIndex];
        const formValue = this.detalleGrupoForm.value;

        let proveedor: ProveedorResponse | null = null;
        if (formValue.proveedorId) {
            const proveedorId = Number(formValue.proveedorId);
            proveedor = this.proveedores.find((p) => p.id === proveedorId) || null;
        }

        const producto = this.productos.find((p) => p.id === Number(formValue.productoId));
        const descripcion = formValue.descripcion?.trim() || 'Sin descripción';
        const precioHistorico = formValue.precioHistorico || 0;
        const comision = formValue.comision || 0;
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
            total: (precioHistorico + comision) * cantidad,
            isTemporary: true,
            seleccionado: false,
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
            comision: 0,
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
        const grupo = this.gruposHoteles[groupIndex];
        const detalle = grupo.detalles[detailIndex];
        detalle.total = (detalle.precioHistorico + detalle.comision) * detalle.cantidad;
    }

    calcularTotalDetalleGrupo(): number {
        const cantidad = this.detalleGrupoForm.get('cantidad')?.value || 0;
        const precioUnitario = this.detalleGrupoForm.get('precioHistorico')?.value || 0;
        const comision = this.detalleGrupoForm.get('comision')?.value || 0;
        return (precioUnitario + comision) * cantidad;
    }

    seleccionarGrupoUnico(grupoIndex: number): void {
        if (grupoIndex >= 0 && grupoIndex < this.gruposHoteles.length) {
            const grupoSeleccionado = this.gruposHoteles[grupoIndex];
            const categoriaId = grupoSeleccionado.categoria.id;

            // Si ya está seleccionado, lo deseleccionamos
            if (this.grupoSeleccionadoId === categoriaId) {
                this.grupoSeleccionadoId = null;
                grupoSeleccionado.seleccionado = false;
                grupoSeleccionado.detalles.forEach((detalle) => {
                    detalle.seleccionado = false;
                });
            } else {
                // Deseleccionar todos los grupos primero
                this.gruposHoteles.forEach((grupo) => {
                    grupo.seleccionado = false;
                    grupo.detalles.forEach((detalle) => {
                        detalle.seleccionado = false;
                    });
                });

                // Seleccionar solo el grupo actual
                if (categoriaId !== undefined) {
                    this.grupoSeleccionadoId = categoriaId;
                    grupoSeleccionado.seleccionado = true;
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

    // ===== HELPER METHODS =====

    async loadCategorias(): Promise<void> {
        try {
            this.categorias = await this.categoriaService.findAll().toPromise() || [];
        } catch (error) {
            console.error('Error loading categorías:', error);
        }
    }

    getCategoriasDisponibles(): CategoriaResponse[] {
        const categoriasUsadas = this.gruposHoteles.map(g => g.categoria.id);
        return this.categorias.filter(c => c.id !== 1 && !categoriasUsadas.includes(c.id));
    }

    // ===== VIEW MODE HELPER METHODS =====

    /**
     * Verifica si hay productos fijos (categoría 1) en la cotización
     */
    hasProductosFijos(): boolean {
        if (!this.cotizacion?.detalles) return this.detallesFijos.length > 0;
        return this.cotizacion.detalles.some(d => d.categoria?.id === 1);
    }

    /**
     * Verifica si hay categorías que no son fijas (diferentes de categoría 1)
     */
    hasCategoriasNoFijas(): boolean {
        return this.getCategoriasNoFijas().length > 0;
    }

    /**
     * Obtiene todas las categorías con detalles que no son productos fijos
     */
    getCategoriasNoFijas(): any[] {
        if (!this.cotizacion?.detalles) return [];

        const categoriasMap = new Map();

        this.cotizacion.detalles.forEach((detalle) => {
            const categoriaId = detalle.categoria?.id || 1;
            const categoriaNombre = detalle.categoria?.nombre || 'Productos Fijos';

            // Solo procesar categorías diferentes de 1
            if (categoriaId !== 1) {
                if (!categoriasMap.has(categoriaId)) {
                    categoriasMap.set(categoriaId, {
                        id: categoriaId,
                        nombre: categoriaNombre,
                        detalles: [],
                    });
                }

                categoriasMap.get(categoriaId).detalles.push(detalle);
            }
        });

        return Array.from(categoriasMap.values());
    }

    /**
     * Obtiene todos los detalles de una categoría específica
     */
    getDetallesByCategoria(categoriaId: number): any[] {
        if (!this.cotizacion?.detalles) return [];
        return this.cotizacion.detalles.filter(
            (detalle) => detalle.categoria?.id === categoriaId,
        );
    }

    /**
     * Calcula el total de una lista de detalles
     */
    getTotalCategoria(detalles: any[]): number {
        return detalles.reduce(
            (sum, d) => sum + ((d.precioHistorico || 0) + (d.comision || 0)) * (d.cantidad || 1),
            0,
        );
    }

    /**
     * Calcula el total de los productos fijos (categoría 1)
     */
    getTotalProductosFijos(): number {
        const fijos = this.getDetallesByCategoria(1);
        return fijos.reduce(
            (sum, d) => sum + ((d.precioHistorico || 0) + (d.comision || 0)) * (d.cantidad || 1),
            0,
        );
    }

    /**
     * Calcula el total completo de la cotización
     * Incluye productos fijos + el grupo más económico
     */
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
            this.getTotalCategoria(categoria.detalles),
        );

        const grupoMasEconomico = Math.min(...totalesPorCategoria);

        return totalFijos + grupoMasEconomico;
    }

    /**
     * Obtiene la clase CSS para el badge según el estado de la cotización
     */
    getEstadoBadgeClass(estado: any): string {
        if (!estado) return 'bg-gray-100 text-gray-800';

        const descripcion = estado.descripcion?.toLowerCase() || '';

        if (descripcion.includes('pendiente') || descripcion.includes('en proceso')) {
            return 'bg-yellow-100 text-yellow-800';
        }
        if (descripcion.includes('aprobada') || descripcion.includes('confirmada')) {
            return 'bg-green-100 text-green-800';
        }
        if (descripcion.includes('rechazada') || descripcion.includes('cancelada')) {
            return 'bg-red-100 text-red-800';
        }
        if (descripcion.includes('enviada')) {
            return 'bg-blue-100 text-blue-800';
        }

        return 'bg-gray-100 text-gray-800';
    }

    /**
     * Verifica si un grupo está seleccionado en modo visualización
     */
    isGrupoSeleccionadoEnVisualizacion(grupoIndex: number): boolean {
        if (grupoIndex >= 0 && grupoIndex < this.gruposHoteles.length) {
            const grupo = this.gruposHoteles[grupoIndex];
            return grupo.categoria.id !== undefined && this.grupoSeleccionadoId === grupo.categoria.id;
        }
        return false;
    }
}
