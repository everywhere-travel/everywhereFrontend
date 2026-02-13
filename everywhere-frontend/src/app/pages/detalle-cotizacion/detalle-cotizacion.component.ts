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
    private cotizacionService = inject(CotizacionService);
    private loadingService = inject(LoadingService);
    private menuConfigService = inject(MenuConfigService);
    private fb = inject(FormBuilder);

    // Data
    cotizacion: CotizacionConDetallesResponseDTO | null = null;
    cotizacionId: number | null = null;

    // Form
    cotizacionForm: FormGroup;

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
            origenDestino: ['']
            // Agregar más campos según necesites
        });
    }

    ngOnInit(): void {
        this.sidebarMenuItems = this.menuConfigService.getMenuItems('/cotizaciones');
        this.loadCotizacionFromRoute();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
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
                next: (cotizacion) => {
                    this.cotizacion = cotizacion;
                    this.initializeForm();
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
            this.cotizacionForm.patchValue({
                codigoCotizacion: this.cotizacion.codigoCotizacion,
                fechaEmision: this.cotizacion.fechaEmision,
                origenDestino: this.cotizacion.origenDestino
                // Agregar más campos según necesites
            });
        }
    }

    // Navigation
    volverACotizaciones(): void {
        this.router.navigate(['/cotizaciones']);
    }

    irAEditarCotizacion(): void {
        if (this.cotizacionId) {
            this.modoEdicion = true;
            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: { modo: 'editar' },
                queryParamsHandling: 'merge'
            });
        }
    }

    salirModoEdicion(): void {
        this.modoEdicion = false;
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { modo: null },
            queryParamsHandling: 'merge'
        });
    }

    // Sidebar
    onToggleSidebar(): void {
        this.sidebarCollapsed = !this.sidebarCollapsed;
    }

    onSidebarItemClick(item: ExtendedSidebarMenuItem): void {
        if (item.route) {
            this.router.navigate([item.route]);
        }
    }
}
