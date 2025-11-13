import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

// Services
import { LiquidacionService } from '../../core/service/Liquidacion/liquidacion.service';
import { LoadingService } from '../../core/service/loading.service';
import { AuthorizationService } from '../../core/service/authorization.service';
import { PersonaService } from '../../core/service/persona/persona.service';
import { PersonaNaturalService } from '../../core/service/natural/persona-natural.service';
import { PersonaJuridicaService } from '../../core/service/juridica/persona-juridica.service';
import { ProductoService } from '../../core/service/Producto/producto.service';
import { FormaPagoService } from '../../core/service/FormaPago/forma-pago.service';
import { DetalleLiquidacionService } from '../../core/service/DetalleLiquidacion/detalle-liquidacion.service';
import { ObservacionLiquidacionService } from '../../core/service/ObservacionLiquidacion/observacion-liquidacion';
import { ProveedorService } from '../../core/service/Proveedor/proveedor.service';
import { OperadorService } from '../../core/service/Operador/operador.service';
import { ViajeroService } from '../../core/service/viajero/viajero.service';

// Models
import { LiquidacionConDetallesResponse, LiquidacionRequest } from '../../shared/models/Liquidacion/liquidacion.model';
import { DetalleLiquidacionResponse, DetalleLiquidacionRequest } from '../../shared/models/Liquidacion/detalleLiquidacion.model';
import { ObservacionLiquidacionRequest, ObservacionLiquidacionResponse } from '../../shared/models/Liquidacion/observacionLiquidacion.model';
import { personaDisplay } from '../../shared/models/Persona/persona.model';
import { PersonaNaturalResponse } from '../../shared/models/Persona/personaNatural.model';
import { PersonaJuridicaResponse } from '../../shared/models/Persona/personaJuridica.models';
import { ProductoResponse } from '../../shared/models/Producto/producto.model';
import { FormaPagoResponse } from '../../shared/models/FormaPago/formaPago.model';

// Interfaz extendida para observaciones con propiedades de edición
interface ObservacionConEdicion extends ObservacionLiquidacionResponse {
  editando?: boolean;
  descripcionTemp?: string;
}
import { ProveedorResponse } from '../../shared/models/Proveedor/proveedor.model';
import { OperadorResponse } from '../../shared/models/Operador/operador.model';
import { ViajeroResponse, ViajeroConPersonaNatural } from '../../shared/models/Viajero/viajero.model';

// Components
import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';

// Interfaces
interface ExtendedSidebarMenuItem extends SidebarMenuItem {
  moduleKey?: string;
  children?: ExtendedSidebarMenuItem[];
}

@Component({
  selector: 'app-detalle-liquidacion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './detalle-liquidacion.component.html',
  styleUrls: ['./detalle-liquidacion.component.css']
})
export class DetalleLiquidacionComponent implements OnInit, OnDestroy {

  // ===== PERSISTENCE KEYS =====
  private readonly STORAGE_KEYS = {
    LIQUIDACION_DETALLE: 'liquidacion_detalle_data',
    FORM_STATE: 'liquidacion_detalle_form_state',
    DETALLES_STATE: 'liquidacion_detalles_state'
  };

  // Flag para evitar sobrescribir datos restaurados
  private estadoTemporalRestaurado = false;

  // Services
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private liquidacionService = inject(LiquidacionService);
  private loadingService = inject(LoadingService);
  private authService = inject(AuthorizationService);
  private personaService = inject(PersonaService);
  private personaNaturalService = inject(PersonaNaturalService);
  private personaJuridicaService = inject(PersonaJuridicaService);
  private productoService = inject(ProductoService);
  private formaPagoService = inject(FormaPagoService);
  private detalleLiquidacionService = inject(DetalleLiquidacionService);
  private observacionLiquidacionService = inject(ObservacionLiquidacionService);
  private proveedorService = inject(ProveedorService);
  private operadorService = inject(OperadorService);
  private viajeroService = inject(ViajeroService);
  private fb = inject(FormBuilder);

  // Data
  liquidacion: LiquidacionConDetallesResponse | null = null;
  liquidacionId: number | null = null;
  productos: ProductoResponse[] = [];
  formasPago: FormaPagoResponse[] = [];
  proveedores: ProveedorResponse[] = [];
  operadores: OperadorResponse[] = [];
  viajeros: ViajeroConPersonaNatural[] = [];

  // Search/Filter state for dropdowns
  viajerosFiltrados: { [index: string]: ViajeroConPersonaNatural[] } = {};
  viajeroSearchTerms: { [index: string]: string } = {};
  viajeroDropdownsOpen: { [index: string]: boolean } = {};

  // Form
  liquidacionForm: FormGroup;
  detalleForm: FormGroup;

  // Cache for personas
  personasCache: { [id: number]: any } = {};
  personasDisplayMap: { [id: number]: string } = {};

  // UI State
  isLoading = false;
  error: string | null = null;
  sidebarCollapsed = false;
  modoEdicion = false; // Nueva propiedad para controlar modo edición

  // Sidebar State
  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];

  // Observaciones múltiples
  observaciones: ObservacionConEdicion[] = [];
  nuevaObservacion: string = '';

  // Detalles fijos como en cotizaciones
  detallesFijos: DetalleLiquidacionRequest[] = [];

  // Array para rastrear IDs de detalles eliminados que deben ser eliminados de la BD
  detallesEliminados: number[] = [];

  // Sidebar Configuration
  private allSidebarMenuItems: ExtendedSidebarMenuItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'fas fa-chart-pie',
      route: '/dashboard'
    },

    {
      id: 'clientes',
      title: 'Clientes',
      icon: 'fas fa-address-book',
      route: '/personas',
      moduleKey: 'PERSONAS'
    },
    {
      id: 'cotizaciones',
      title: 'Cotizaciones',
      icon: 'fas fa-file-invoice',
      route: '/cotizaciones',
      moduleKey: 'COTIZACIONES'
    },
    {
      id: 'liquidaciones',
      title: 'Liquidaciones',
      icon: 'fas fa-credit-card',
      route: '/liquidaciones',
      active: true,
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
      id: 'categorias',
      title: 'Gestion de Categorias',
      icon: 'fas fa-box',
      children: [
        {
          id: 'categorias-persona',
          title: 'Categorias de Clientes',
          icon: 'fas fa-users',
          route: '/categorias-persona',
          moduleKey: 'CATEGORIA_PERSONAS'
        },
        {
          id: 'categorias-producto',
          title: 'Categorias de Producto',
          icon: 'fas fa-list',
          route: '/categorias',
        },
        {
          id: 'estado-cotizacion',
          title: 'Estado de Cotización',
          icon: 'fas fa-clipboard-check',
          route: '/estado-cotizacion',
          moduleKey: 'COTIZACIONES'
        },
        {
          id: 'forma-pago',
          title: 'Forma de Pago',
          icon: 'fas fa-credit-card',
          route: '/formas-pago',
          moduleKey: 'FORMA_PAGO'
        }
      ]
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
          id: 'sucursales',
          title: 'Sucursales',
          icon: 'fas fa-building',
          route: '/sucursales',
          moduleKey: 'SUCURSALES'
        }
      ]
    }
  ];
  private subscriptions = new Subscription();

  constructor() {
    this.liquidacionForm = this.fb.group({
      numero: [''],
      fechaCompra: [''],
      destino: [''],
      numeroPasajeros: [0],
      productoId: [null],
      formaPagoId: [null]
    });

    // Formulario para agregar detalles
    this.detalleForm = this.fb.group({
      viajeroId: [''],
      productoId: [''],
      proveedorId: [''],
      operadorId: [''],
      ticket: [''],
      costoTicket: [0],
      cargoServicio: [0],
      valorVenta: [0],
      facturaCompra: [''],
      boletaPasajero: [''],
      montoDescuento: [0],
      pagoPaxUSD: [0],
      pagoPaxPEN: [0]
    });

    // Suscribirse a cambios en costoTicket y valorVenta para calcular automáticamente cargoServicio
    this.detalleForm.get('costoTicket')?.valueChanges.subscribe(value => {
      this.calcularCargoServicioFormulario();
    });

    this.detalleForm.get('valorVenta')?.valueChanges.subscribe(value => {
      this.calcularCargoServicioFormulario();
    });
  }

  ngOnInit(): void {
    this.initializeSidebar();
    this.loadLiquidacionFromRoute();
    this.loadSelectOptions();
  }

  ngOnDestroy(): void {
    this.guardarEstadoTemporal();
    this.subscriptions.unsubscribe();
  }

  // ===== MÉTODOS PARA AUTOGUARDADO TEMPORAL =====

  private getEstadoTemporalKey(): string {
    return `detalle-liquidacion-${this.liquidacionId}-temporal`;
  }

  private guardarEstadoTemporal(): void {
    if (!this.modoEdicion || !this.liquidacionId) {
      return; // Solo guardar en modo edición
    }

    const estadoTemporal = {
      liquidacionForm: this.liquidacionForm.value,
      detalleForm: this.detalleForm.value,
      detallesFijos: this.detallesFijos,
      detallesOriginales: this.liquidacion?.detalles || [], // AGREGAR: Guardar detalles originales
      detallesEliminados: this.detallesEliminados, // AGREGAR: Guardar detalles eliminados
      viajeroSearchTerms: this.viajeroSearchTerms,
      timestamp: new Date().getTime()
    };

    try {
      const key = this.getEstadoTemporalKey();
      sessionStorage.setItem(key, JSON.stringify(estadoTemporal));
    } catch (error) {
      console.warn('No se pudo guardar el estado temporal:', error);
    }
  }

  private cargarEstadoTemporal(): boolean {
    if (!this.modoEdicion || !this.liquidacionId) {
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

      if (tiempoTranscurrido > 1800000) {
        this.limpiarEstadoTemporal();
        return false;
      }

      // Restaurar formularios
      if (estado.liquidacionForm && this.liquidacionForm) {
        this.liquidacionForm.patchValue(estado.liquidacionForm);
      }
      if (estado.detalleForm && this.detalleForm) {
        this.detalleForm.patchValue(estado.detalleForm);
      }
      if (estado.detallesFijos) {
        this.detallesFijos = estado.detallesFijos;
      }

      // Restaurar detalles originales
      if (estado.detallesOriginales && this.liquidacion?.detalles) {
        // Restaurar solo los campos editables, manteniendo la estructura original
        estado.detallesOriginales.forEach((detalleEstado: any, index: number) => {
          if (this.liquidacion!.detalles![index]) {
            const detalleOriginal = this.liquidacion!.detalles![index];

            // Restaurar campos editables
            detalleOriginal.ticket = detalleEstado.ticket || '';
            detalleOriginal.costoTicket = detalleEstado.costoTicket || 0;
            detalleOriginal.cargoServicio = detalleEstado.cargoServicio || 0;
            detalleOriginal.valorVenta = detalleEstado.valorVenta || 0;
            detalleOriginal.facturaCompra = detalleEstado.facturaCompra || '';
            detalleOriginal.boletaPasajero = detalleEstado.boletaPasajero || '';
            detalleOriginal.montoDescuento = detalleEstado.montoDescuento || 0;
            detalleOriginal.pagoPaxUSD = detalleEstado.pagoPaxUSD || 0;
            detalleOriginal.pagoPaxPEN = detalleEstado.pagoPaxPEN || 0;

            // Restaurar relaciones si están presentes
            if (detalleEstado.viajero) {
              detalleOriginal.viajero = detalleEstado.viajero;
            }
            if (detalleEstado.producto) {
              detalleOriginal.producto = detalleEstado.producto;
            }
            if (detalleEstado.proveedor) {
              detalleOriginal.proveedor = detalleEstado.proveedor;
            }
            if (detalleEstado.operador) {
              detalleOriginal.operador = detalleEstado.operador;
            }
          }
        });
      }

      // Restaurar detalles eliminados
      if (estado.detallesEliminados) {
        this.detallesEliminados = estado.detallesEliminados;
      }

      if (estado.viajeroSearchTerms) {
        this.viajeroSearchTerms = estado.viajeroSearchTerms;
      }

      // Reinicializar los valores de búsqueda después de restaurar el estado
      setTimeout(() => {
        this.reinicializarValoresBusqueda();
        // También llamar initializeAllViajeroSearchValues para asegurar consistencia
        this.initializeAllViajeroSearchValues();
      }, 100);

      return true;
    } catch (error) {
      this.limpiarEstadoTemporal();
      return false;
    }
  }

  private limpiarEstadoTemporal(): void {
    try {
      sessionStorage.removeItem(this.getEstadoTemporalKey());
      // También limpiar el array de detalles eliminados
      this.detallesEliminados = [];
      // Limpiar observación temporal
      this.nuevaObservacion = '';
      this.observaciones = [];
    } catch (error) {
      console.warn('Error al limpiar estado temporal:', error);
    }
  }

  private configurarAutoguardado(): void {
    if (!this.modoEdicion) {
      return;
    }

    // Autoguardar cada 30 segundos cuando hay cambios
    let timerAutoguardado: any;
    const autoguardar = () => {
      if (timerAutoguardado) {
        clearTimeout(timerAutoguardado);
      }
      timerAutoguardado = setTimeout(() => {
        this.guardarEstadoTemporal();
      }, 30000); // 30 segundos
    };

    // Escuchar cambios en los formularios
    this.liquidacionForm.valueChanges.subscribe(() => autoguardar());
    this.detalleForm.valueChanges.subscribe(() => autoguardar());

    // Guardar antes de cerrar ventana/pestaña
    window.addEventListener('beforeunload', () => {
      this.guardarEstadoTemporal();
    });
  }

  private loadLiquidacionFromRoute(): void {
    // Obtener el ID de la ruta
    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam || isNaN(Number(idParam))) {
      this.error = 'ID de liquidación inválido';
      return;
    }

    // Verificar si viene en modo edición
    const modoParam = this.route.snapshot.queryParamMap.get('modo');
    this.modoEdicion = modoParam === 'editar';

    this.liquidacionId = Number(idParam);
    this.loadLiquidacion(this.liquidacionId);
  } private loadLiquidacion(id: number): void {
    this.isLoading = true;
    this.error = null;

    // Mostrar loading global
    this.loadingService.setLoading(true);

    const subscription = this.liquidacionService.getLiquidacionConDetalles(id)
      .pipe(
        tap(liquidacionConDetalles => {
          if (!liquidacionConDetalles) {
            throw new Error('Liquidación no encontrada');
          }

          // Si no tiene cotización, intentar cargar desde getLiquidacionById
          if (!liquidacionConDetalles.cotizacion?.personas?.id) {
            // Hacer una segunda llamada para obtener la información básica con cotización
            this.liquidacionService.getLiquidacionById(id).subscribe({
              next: (liquidacionBasica) => {
                if (liquidacionBasica.cotizacion?.personas?.id) {
                  // Combinar los datos: usar detalles de ConDetalles pero cotización de getId
                  this.liquidacion = {
                    ...liquidacionConDetalles,
                    cotizacion: liquidacionBasica.cotizacion
                  };
                  this.loadClienteInfo(liquidacionBasica.cotizacion.personas.id);
                }
              },
              error: () => {
              }
            });
          }
        }),
        catchError(error => {
          console.error('Error al cargar liquidación:', error);
          this.error = 'Error al cargar la liquidación. Por favor, intente nuevamente.';
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
          this.loadingService.setLoading(false);
        })
      )
      .subscribe(liquidacion => {
        if (liquidacion) {
          this.liquidacion = liquidacion;

          // Inicializar el formulario (ya incluye carga de estado temporal)
          this.initializeForm();

          // Cargar observaciones de la liquidación
          this.cargarObservacionesLiquidacion(liquidacion.id);

          // Extraer viajeros únicos de los detalles
          this.extraerViajerosDeDetalles();

          // Cargar información del cliente si existe cotización
          if (liquidacion?.cotizacion?.personas?.id) {
            this.loadClienteInfo(liquidacion.cotizacion.personas.id);
          }
        }
      });

    this.subscriptions.add(subscription);
  }

  private loadSelectOptions(): void {
    // Cargar productos
    const productosSubscription = this.productoService.getAllProductos()
      .pipe(
        catchError(error => {
          console.error('Error al cargar productos:', error);
          return of([]);
        })
      )
      .subscribe(productos => {
        this.productos = productos;
      });

    // Cargar formas de pago
    const formasPagoSubscription = this.formaPagoService.getAllFormasPago()
      .pipe(
        catchError(() => {
          return of([]);
        })
      )
      .subscribe(formasPago => {
        this.formasPago = formasPago;
      });

    // Cargar proveedores
    const proveedoresSubscription = this.proveedorService.findAllProveedor()
      .pipe(
        catchError(() => {
          return of([]);
        })
      )
      .subscribe((proveedores: ProveedorResponse[]) => {
        this.proveedores = proveedores;
      });

    // Cargar operadores
    const operadoresSubscription = this.operadorService.findAllOperador()
      .pipe(
        catchError(() => {
          return of([]);
        })
      )
      .subscribe((operadores: OperadorResponse[]) => {
        this.operadores = operadores;
      });

    // No cargar viajeros desde servicio separado, se obtienen de los detalles
    // const viajerosSubscription = this.viajeroService.findAll()
    //   .pipe(
    //     catchError(() => {
    //       return of([]);
    //     })
    //   )
    //   .subscribe((viajeros: ViajeroResponse[]) => {
    //     this.viajeros = viajeros;

    //     // Inicializar los valores de búsqueda después de cargar los viajeros
    //     setTimeout(() => {
    //       this.initializeAllViajeroSearchValues();
    //     }, 100);
    //   });

    this.subscriptions.add(productosSubscription);
    this.subscriptions.add(formasPagoSubscription);
    this.subscriptions.add(proveedoresSubscription);
    this.subscriptions.add(operadoresSubscription);
    // this.subscriptions.add(viajerosSubscription); // Comentado porque ya no se usa
  }

  // Navigation methods
  volverALiquidaciones(): void {
    this.router.navigate(['/liquidaciones']);
  }

  irAEditarLiquidacion(): void {
    if (this.liquidacionId) {
      // Cambiar a modo edición sin navegación adicional
      this.modoEdicion = true;
      // Actualizar la URL para reflejar el modo edición
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { modo: 'editar' },
        queryParamsHandling: 'merge'
      });
    }
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

  // Método para cargar observaciones
  private cargarObservacionesLiquidacion(liquidacionId: number): void {
    const subscription = this.observacionLiquidacionService.findByLiquidacionId(liquidacionId)
      .pipe(
        catchError(error => {
          console.error('Error al cargar observaciones:', error);
          return of([]);
        })
      )
      .subscribe(observaciones => {
        // Cargar todas las observaciones
        this.observaciones = observaciones || [];
      });

    this.subscriptions.add(subscription);
  }

  // Extraer viajeros únicos de los detalles de liquidación
  private extraerViajerosDeDetalles(): void {
    if (!this.liquidacion?.detalles) {
      this.viajeros = [];
      return;
    }

    // Extraer viajeros únicos que no sean null/undefined
    const viajerosMap = new Map<number, ViajeroConPersonaNatural>();

    this.liquidacion.detalles.forEach((detalle, idx) => {
      if (detalle.viajero && detalle.viajero.id) {
        viajerosMap.set(detalle.viajero.id, detalle.viajero);
      }
    });

    const viajerosDeDetalles = Array.from(viajerosMap.values());

    // SIEMPRE cargar todos los viajeros disponibles del backend
    this.viajeroService.findAll().subscribe({
      next: (todosLosViajeros: ViajeroConPersonaNatural[]) => {
        // Combinar: primero los de los detalles, luego el resto
        const viajerosCombinados = new Map<number, ViajeroConPersonaNatural>();

        // Agregar primero los viajeros de los detalles (si existen)
        viajerosDeDetalles.forEach(v => viajerosCombinados.set(v.id, v));

        // Luego agregar todos los del backend (esto actualizará los datos si hay cambios)
        todosLosViajeros.forEach(v => viajerosCombinados.set(v.id, v));

        this.viajeros = Array.from(viajerosCombinados.values());

        // Inicializar búsqueda con los viajeros cargados
        setTimeout(() => {
          this.initializeAllViajeroSearchValues();
        }, 100);
      },
      error: (error: any) => {
        // Si falla, al menos usar los viajeros de los detalles
        this.viajeros = viajerosDeDetalles;

        // Inicializar búsqueda incluso en error
        setTimeout(() => {
          this.initializeAllViajeroSearchValues();
        }, 100);
      }
    });
  }  // Métodos para manejar observaciones múltiples
  agregarObservacion(): void {
    if (!this.nuevaObservacion?.trim() || !this.liquidacionId) {
      return;
    }

    const observacionRequest: ObservacionLiquidacionRequest = {
      descripcion: this.nuevaObservacion.trim(),
      liquidacionId: this.liquidacionId
    };

    const subscription = this.observacionLiquidacionService.create(observacionRequest)
      .pipe(
        catchError(error => {
          console.error('Error al crear observación:', error);
          return of(null);
        })
      )
      .subscribe(response => {
        if (response) {
          this.observaciones.push(response);
          this.nuevaObservacion = '';
        }
      });

    this.subscriptions.add(subscription);
  }

  // Método para eliminar observación directamente
  eliminarObservacion(observacion: ObservacionConEdicion): void {
    const subscription = this.observacionLiquidacionService.delete(observacion.id)
      .pipe(
        catchError(error => {
          console.error('Error al eliminar observación:', error);
          return of(null);
        })
      )
      .subscribe(response => {
        this.observaciones = this.observaciones.filter(obs => obs.id !== observacion.id);
      });

    this.subscriptions.add(subscription);
  }

  // Método para iniciar la edición de una observación
  editarObservacion(observacion: ObservacionConEdicion): void {
    // Cancelar cualquier otra edición activa
    this.observaciones.forEach(obs => {
      if (obs !== observacion) {
        obs.editando = false;
        delete obs.descripcionTemp;
      }
    });

    // Activar modo edición para esta observación
    observacion.editando = true;
    observacion.descripcionTemp = observacion.descripcion;
  }

  // Método para guardar la edición de una observación
  guardarEdicionObservacion(observacion: ObservacionConEdicion): void {
    if (!observacion.descripcionTemp?.trim()) {
      return;
    }

    const observacionRequest: ObservacionLiquidacionRequest = {
      descripcion: observacion.descripcionTemp.trim(),
      liquidacionId: this.liquidacionId!
    };

    const subscription = this.observacionLiquidacionService.update(observacion.id, observacionRequest)
      .pipe(
        catchError(error => {
          console.error('Error al actualizar observación:', error);
          return of(null);
        })
      )
      .subscribe(response => {
        if (response && observacion.descripcionTemp) {
          // Actualizar la observación en la lista
          observacion.descripcion = observacion.descripcionTemp.trim();
          observacion.editando = false;
          delete observacion.descripcionTemp;
        }
      });

    this.subscriptions.add(subscription);
  }

  // Método para cancelar la edición de una observación
  cancelarEdicionObservacion(observacion: ObservacionConEdicion): void {
    observacion.editando = false;
    delete observacion.descripcionTemp;
  }

  // Form methods
  private initializeForm(): void {
    // Cargar datos del servidor primero
    if (this.liquidacion) {
      this.liquidacionForm.patchValue({
        numero: this.liquidacion.numero || '',
        fechaCompra: this.liquidacion.fechaCompra || '',
        destino: this.liquidacion.destino || '',
        numeroPasajeros: this.liquidacion.numeroPasajeros || 0,
        productoId: this.liquidacion.producto?.id || null,
        formaPagoId: this.liquidacion.formaPago?.id || null
      });
    }

    // Configurar autoguardado si estamos en modo edición
    this.configurarAutoguardado();

    // DESPUÉS de inicializar, esperar a que todos los datos async estén cargados
    // y LUEGO intentar cargar estado temporal
    this.esperarDatosAsyncYCargarEstado();
  }

  private esperarDatosAsyncYCargarEstado(): void {
    // Verificar si todos los datos necesarios están cargados
    const verificarDatos = () => {
      const datosListos = this.viajeros.length > 0 &&
                         this.productos.length > 0 &&
                         this.proveedores.length > 0 &&
                         this.operadores.length > 0 &&
                         this.formasPago.length > 0;

      if (datosListos) {
        // Todos los datos están listos, intentar cargar estado temporal
        setTimeout(() => {
          this.cargarEstadoTemporal();
        }, 200);
      } else {
        // Reintentar en 100ms
        setTimeout(verificarDatos, 100);
      }
    };

    // Iniciar la verificación
    setTimeout(verificarDatos, 100);
  }

  guardarLiquidacion(): void {
    if (!this.liquidacionId || !this.liquidacionForm.valid) {
      console.error('Formulario inválido o ID de liquidación no disponible');
      return;
    }

    this.isLoading = true;
    this.loadingService.setLoading(true);

    const liquidacionRequest: LiquidacionRequest = {
      numero: this.liquidacionForm.value.numero,
      fechaCompra: this.liquidacionForm.value.fechaCompra,
      destino: this.liquidacionForm.value.destino,
      numeroPasajeros: this.liquidacionForm.value.numeroPasajeros,
      productoId: this.liquidacionForm.value.productoId,
      formaPagoId: this.liquidacionForm.value.formaPagoId,
      cotizacionId: this.liquidacion?.cotizacion?.id
    };

    // Primero guardar la liquidación principal
    const saveSubscription = this.liquidacionService.updateLiquidacion(this.liquidacionId, liquidacionRequest)
      .pipe(
        tap(liquidacionResponse => {
          // 0. ELIMINAR detalles marcados para eliminación
          if (this.detallesEliminados.length > 0) {
            // Limpiar la lista de detalles eliminados
            this.detallesEliminados = [];
          }

          // 1. ACTUALIZAR detalles originales existentes
          if (this.liquidacion?.detalles) {
            this.liquidacion.detalles.forEach(detalle => {
              if (detalle.id) {
                // Crear request para detalle existente
                const detalleRequest: DetalleLiquidacionRequest = {
                  viajeroId: detalle.viajero?.id,
                  productoId: detalle.producto?.id,
                  proveedorId: detalle.proveedor?.id,
                  operadorId: detalle.operador?.id,
                  ticket: detalle.ticket || '',
                  costoTicket: detalle.costoTicket || 0,
                  cargoServicio: detalle.cargoServicio || 0,
                  valorVenta: detalle.valorVenta || 0,
                  facturaCompra: detalle.facturaCompra || '',
                  boletaPasajero: detalle.boletaPasajero || '',
                  montoDescuento: detalle.montoDescuento || 0,
                  pagoPaxUSD: detalle.pagoPaxUSD || 0,
                  pagoPaxPEN: detalle.pagoPaxPEN || 0,
                  liquidacionId: this.liquidacionId!
                };

                // Actualizar detalle existente
                this.detalleLiquidacionService.updateDetalleLiquidacion(detalle.id, detalleRequest)
                  .subscribe({
                    next: (response) => {
                      // Detalle actualizado exitosamente
                    },
                    error: (error) => {
                      console.error(`Error al actualizar detalle ${detalle.id}:`, error);
                    }
                  });
              }
            });
          }

          // 2. CREAR detalles fijos nuevos
          this.detallesFijos.forEach(detalle => {
            if (detalle.viajeroId || detalle.productoId) {
              // Agregar liquidacionId al detalle
              const detalleConLiquidacion = {
                ...detalle,
                liquidacionId: this.liquidacionId!
              };

              this.detalleLiquidacionService.createDetalleLiquidacion(this.liquidacionId!, detalleConLiquidacion)
                .subscribe({
                  next: (detalleResponse) => {
                    // Detalle fijo creado exitosamente
                  },
                  error: (error) => {
                    console.error('Error al crear detalle fijo:', error);
                  }
                });
            }
          });

          // 3. Finalizar guardado (las observaciones se manejan por separado)
          this.limpiarEstadoTemporal();
          this.recargarDatos();
        }),
        catchError(error => {
          console.error('Error al guardar la liquidación:', error);
          this.error = 'Error al guardar los cambios. Por favor, intente nuevamente.';
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
          this.loadingService.setLoading(false);
        })
      )
      .subscribe();

    this.subscriptions.add(saveSubscription);
  }

  recargarDatos(): void {
    // Recargar los datos actualizados después de un breve delay
    setTimeout(() => {
      this.loadLiquidacion(this.liquidacionId!);
      // Salir del modo edición
      this.salirModoEdicion();
    }, 1000);
  }

  // Métodos para detalles fijos
  agregarDetalleFijo(): void {
    if (this.detalleForm.invalid) {
      return;
    }

    const formValue = this.detalleForm.value;

    const nuevoDetalle: DetalleLiquidacionRequest = {
      viajeroId: formValue.viajeroId ? Number(formValue.viajeroId) : undefined,
      productoId: formValue.productoId ? Number(formValue.productoId) : undefined,
      proveedorId: formValue.proveedorId ? Number(formValue.proveedorId) : undefined,
      operadorId: formValue.operadorId ? Number(formValue.operadorId) : undefined,
      ticket: formValue.ticket || '',
      costoTicket: Number(formValue.costoTicket) || 0,
      cargoServicio: Number(formValue.cargoServicio) || 0,
      valorVenta: Number(formValue.valorVenta) || 0,
      facturaCompra: formValue.facturaCompra || '',
      boletaPasajero: formValue.boletaPasajero || '',
      montoDescuento: Number(formValue.montoDescuento) || 0,
      pagoPaxUSD: Number(formValue.pagoPaxUSD) || 0,
      pagoPaxPEN: Number(formValue.pagoPaxPEN) || 0
    };

    this.detallesFijos.push(nuevoDetalle); // Agregar al final de la lista

    // Inicializar el valor de búsqueda para la nueva fila si tiene viajero seleccionado
    const nuevoIndice = this.detallesFijos.length - 1; // Índice de la fila recién agregada
    if (nuevoDetalle.viajeroId) {
      // Usar setTimeout para permitir que Angular detecte los cambios primero
      setTimeout(() => {
        const viajero = this.viajeros.find(v => v.id === nuevoDetalle.viajeroId);
        if (viajero) {
          this.initViajeroSearchValue(`detalle-fijo-${nuevoIndice}`, viajero);
        }
      }, 10);
    }

    // Limpiar formulario
    this.detalleForm.reset({
      viajeroId: '',
      productoId: '',
      proveedorId: '',
      operadorId: '',
      ticket: '',
      costoTicket: 0,
      cargoServicio: 0,
      valorVenta: 0,
      facturaCompra: '',
      boletaPasajero: '',
      montoDescuento: 0,
      pagoPaxUSD: 0,
      pagoPaxPEN: 0
    });

    // Limpiar también el estado de búsqueda del viajero
    this.viajeroSearchTerms['nuevo'] = '';
    this.viajerosFiltrados['nuevo'] = [...this.viajeros];
    this.viajeroDropdownsOpen['nuevo'] = false;
  }

  eliminarDetalleFijo(index: number): void {
    this.detallesFijos.splice(index, 1);
    // Autoguardar estado temporal
    this.guardarEstadoTemporal();
  }

  eliminarDetalleOriginal(index: number): void {
    if (this.liquidacion?.detalles) {
      const detalleAEliminar = this.liquidacion.detalles[index];

      // Si el detalle tiene ID, agregarlo a la lista de eliminados
      if (detalleAEliminar?.id) {
        this.detallesEliminados.push(detalleAEliminar.id);
      }

      // Eliminar del array local
      this.liquidacion.detalles.splice(index, 1);

      // Autoguardar estado temporal
      this.guardarEstadoTemporal();
    }
  }

  irAEditarLiquidacionOld(): void {
    if (this.liquidacionId) {
      this.router.navigate(['/liquidaciones'], {
        queryParams: { editId: this.liquidacionId }
      });
    }
  }

  // Sidebar methods
  private initializeSidebar(): void {
    this.sidebarMenuItems = this.filterSidebarItems(this.allSidebarMenuItems);
  }

  private filterSidebarItems(items: ExtendedSidebarMenuItem[]): ExtendedSidebarMenuItem[] {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      return [];
    }

    // Obtener el rol del usuario
    const currentRole = this.authService.getCurrentRole();

    // Si el usuario es admin o no tiene rol, mostrar todo
    if (this.authService.isAdmin() || !currentRole) {
      return items;
    }

    return items.filter(item => {
      // Si tiene moduleKey, verificar si el usuario tiene acceso a ese módulo
      if (item.moduleKey) {
        return currentRole.modules.includes(item.moduleKey);
      }

      // Si no tiene moduleKey pero tiene children, verificar si algún hijo tiene permisos
      if (item.children && item.children.length > 0) {
        const filteredChildren = this.filterSidebarItems(item.children);
        if (filteredChildren.length > 0) {
          // Actualizar el item con solo los children filtrados
          item.children = filteredChildren;
          return true;
        }
        return false;
      }

      // Si no tiene moduleKey ni children, mostrar por defecto (como Dashboard)
      return true;
    });
  }

  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onSidebarItemClick(item: SidebarMenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  // Utility methods
  trackByDetalle(index: number, detalle: DetalleLiquidacionResponse): number {
    return detalle.id;
  }

  // Método para manejar cambios en los campos de detalles fijos editables
  onProductoChange(index: number, field: string, value: any): void {
    if (index >= 0 && index < this.detallesFijos.length) {
      const detalle = this.detallesFijos[index];

      switch (field) {
        case 'viajeroId':
          detalle.viajeroId = value ? Number(value) : undefined;
          break;
        case 'productoId':
          detalle.productoId = value ? Number(value) : undefined;
          break;
        case 'proveedorId':
          detalle.proveedorId = value ? Number(value) : undefined;
          break;
        case 'operadorId':
          detalle.operadorId = value ? Number(value) : undefined;
          break;
        case 'ticket':
          detalle.ticket = value || '';
          break;
        case 'costoTicket':
          detalle.costoTicket = value ? Number(value) : 0;
          // Calcular automáticamente el cargo por servicio
          this.calcularCargoServicio(detalle);
          break;
        case 'cargoServicio':
          detalle.cargoServicio = value ? Number(value) : 0;
          break;
        case 'valorVenta':
          detalle.valorVenta = value ? Number(value) : 0;
          // Calcular automáticamente el cargo por servicio
          this.calcularCargoServicio(detalle);
          break;
        case 'facturaCompra':
          detalle.facturaCompra = value || '';
          break;
        case 'boletaPasajero':
          detalle.boletaPasajero = value || '';
          break;
        case 'montoDescuento':
          detalle.montoDescuento = value ? Number(value) : 0;
          break;
        case 'pagoPaxUSD':
          detalle.pagoPaxUSD = value ? Number(value) : 0;
          break;
        case 'pagoPaxPEN':
          detalle.pagoPaxPEN = value ? Number(value) : 0;
          break;
        default:
          console.warn('Campo no reconocido:', field);
          break;
      }

      // Autoguardar estado temporal
      this.guardarEstadoTemporal();
    }
  }

  // Método para manejar cambios en los detalles originales (los que vienen de la base de datos)
  onDetalleOriginalChange(index: number, field: string, value: any): void {

    if (this.liquidacion && this.liquidacion.detalles &&
        index >= 0 && index < this.liquidacion.detalles.length) {
      const detalle = this.liquidacion.detalles[index];

      switch (field) {
        case 'viajeroId':
          // Buscar el viajero por ID y asignarlo
          const viajeroId = value ? Number(value) : null;
          const viajero = this.viajeros.find(v => v.id === viajeroId);
          if (viajero) {
            detalle.viajero = viajero;
          }
          break;
        case 'productoId':
          // Buscar el producto por ID y asignarlo
          const productoId = value ? Number(value) : null;
          const producto = this.productos.find(p => p.id === productoId);
          if (producto) {
            detalle.producto = producto;
          }
          break;
        case 'proveedorId':
          // Buscar el proveedor por ID y asignarlo
          const proveedorId = value ? Number(value) : null;
          const proveedor = this.proveedores.find(p => p.id === proveedorId);
          if (proveedor) {
            detalle.proveedor = proveedor;
          }
          break;
        case 'operadorId':
          // Buscar el operador por ID y asignarlo
          const operadorId = value ? Number(value) : null;
          const operador = this.operadores.find(o => o.id === operadorId);
          if (operador) {
            detalle.operador = operador;
          }
          if (operador) {
            detalle.operador = operador;
          }
          break;
        case 'ticket':
          detalle.ticket = value || '';
          break;
        case 'costoTicket':
          detalle.costoTicket = value ? Number(value) : 0;
          // Calcular automáticamente el cargo por servicio
          this.calcularCargoServicio(detalle);
          break;
        case 'cargoServicio':
          detalle.cargoServicio = value ? Number(value) : 0;
          break;
        case 'valorVenta':
          detalle.valorVenta = value ? Number(value) : 0;
          // Calcular automáticamente el cargo por servicio
          this.calcularCargoServicio(detalle);
          break;
        case 'facturaCompra':
          detalle.facturaCompra = value || '';
          break;
        case 'boletaPasajero':
          detalle.boletaPasajero = value || '';
          break;
        case 'montoDescuento':
          detalle.montoDescuento = value ? Number(value) : 0;
          break;
        case 'pagoPaxUSD':
          detalle.pagoPaxUSD = value ? Number(value) : 0;
          break;
        case 'pagoPaxPEN':
          detalle.pagoPaxPEN = value ? Number(value) : 0;
          break;
        default:
          console.warn('Campo no reconocido:', field);
          break;
      }

      // Autoguardar estado temporal
      this.guardarEstadoTemporal();
    }
  }

  // Calcular totales para la vista
  get totalCostoTickets(): number {
    if (!this.liquidacion?.detalles) return 0;
    return this.liquidacion.detalles.reduce((sum, detalle) =>
      sum + (detalle.costoTicket || 0), 0);
  }

  get totalCargoServicio(): number {
    if (!this.liquidacion?.detalles) return 0;
    return this.liquidacion.detalles.reduce((sum, detalle) =>
      sum + (detalle.cargoServicio || 0), 0);
  }

  get totalValorVenta(): number {
    if (!this.liquidacion?.detalles) return 0;
    return this.liquidacion.detalles.reduce((sum, detalle) =>
      sum + (detalle.valorVenta || 0), 0);
  }

  get totalMontoDescuento(): number {
    if (!this.liquidacion?.detalles) return 0;
    return this.liquidacion.detalles.reduce((sum, detalle) =>
      sum + (detalle.montoDescuento || 0), 0);
  }

  get totalPagoPaxUSD(): number {
    if (!this.liquidacion?.detalles) return 0;
    return this.liquidacion.detalles.reduce((sum, detalle) =>
      sum + (detalle.pagoPaxUSD || 0), 0);
  }

  get totalPagoPaxPEN(): number {
    if (!this.liquidacion?.detalles) return 0;
    return this.liquidacion.detalles.reduce((sum, detalle) =>
      sum + (detalle.pagoPaxPEN || 0), 0);
  }

  get totalBoletaPasajero(): number {
    if (!this.liquidacion?.detalles) return 0;
    return this.liquidacion.detalles.reduce((sum, detalle) => {
      // Convertir el valor de boleta a número, asumiendo que es un valor monetario
      const boletaValue = detalle.boletaPasajero ? parseFloat(detalle.boletaPasajero.toString()) : 0;
      return sum + (isNaN(boletaValue) ? 0 : boletaValue);
    }, 0);
  }

  // Método para calcular automáticamente el cargo por servicio
  calcularCargoServicio(detalle: any): void {
    const valorVenta = detalle.valorVenta || 0;
    const costoTicket = detalle.costoTicket || 0;

    // Solo calcular automáticamente si ambos valores están presentes
    if (valorVenta > 0 && costoTicket >= 0) {
      detalle.cargoServicio = valorVenta - costoTicket;
    }
  }

  // Método para calcular automáticamente el cargo por servicio en el formulario
  calcularCargoServicioFormulario(): void {
    const valorVenta = this.detalleForm.get('valorVenta')?.value || 0;
    const costoTicket = this.detalleForm.get('costoTicket')?.value || 0;

    // Solo calcular automáticamente si ambos valores están presentes
    if (valorVenta > 0 && costoTicket >= 0) {
      const cargoServicio = valorVenta - costoTicket;
      this.detalleForm.get('cargoServicio')?.setValue(cargoServicio, { emitEvent: false });
    }
  }

  // Persona display methods
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

  getPersonaDisplayName(personaId: number): string {
    if (!personaId || personaId === 0) {
      return 'Sin cliente';
    }

    if (this.personasDisplayMap[personaId]) {
      return this.personasDisplayMap[personaId];
    }

    // Si no está en cache, retornar texto temporal
    return 'Cargando...';
  }

  getClienteInfo(): string {

    if (this.liquidacion?.cotizacion?.personas?.id) {
      return this.getPersonaDisplayName(this.liquidacion.cotizacion.personas.id);
    }
    return 'Sin cliente asignado';
  }

  // Método auxiliar para obtener el nombre del viajero por ID
  getViajeroDisplayName(viajeroId: number | undefined): string {
    if (!viajeroId) return 'Sin viajero';

    const viajero = this.viajeros.find(v => v.id === viajeroId);
    if (viajero && viajero.personaNatural) {
      return `${viajero.personaNatural.nombres} ${viajero.personaNatural.apellidosPaterno}`;
    }

    return 'Viajero no encontrado';
  }

  // Método auxiliar para obtener el nombre del proveedor por ID
  getProveedorDisplayName(proveedorId: number | undefined): string {
    if (!proveedorId) return 'Sin proveedor';

    const proveedor = this.proveedores.find(p => p.id === proveedorId);
    if (proveedor) {
      return proveedor.nombre;
    }

    return 'Proveedor no encontrado';
  }

  // Método auxiliar para obtener el nombre del operador por ID
  getOperadorDisplayName(operadorId: number | undefined): string {
    if (!operadorId) return 'Sin operador';

    const operador = this.operadores.find(o => o.id === operadorId);
    if (operador) {
      return operador.nombre || 'Sin nombre';
    }

    return 'Operador no encontrado';
  }

  // Método auxiliar para obtener el tipo de producto por ID
  getProductoDisplayName(productoId: number | undefined): string {
    if (!productoId) return 'Sin producto';

    const producto = this.productos.find(p => p.id === productoId);
    if (producto) {
      return producto.tipo;
    }

    return 'Producto no encontrado';
  }

  // Método para agregar un nuevo producto
  agregarProducto(): void {
    const nuevoDetalle = {
      viajeroId: 0,
      productoId: 0,
      proveedorId: 0,
      ticket: '',
      operadorId: 0,
      costoTicket: 0,
      cargoServicio: 0,
      valorVenta: 0,
      facturaCompra: '',
      boletaPasajero: '',
      montoDescuento: 0,
      pagoPaxUSD: 0,
      pagoPaxPEN: 0
    };

    this.detallesFijos.push(nuevoDetalle);

    // Limpiar también el estado de búsqueda del viajero
    this.viajeroSearchTerms['nuevo'] = '';
    this.viajerosFiltrados['nuevo'] = [...this.viajeros];
    this.viajeroDropdownsOpen['nuevo'] = false;
  }

  cancelar(): void {
    this.volverALiquidaciones();
  }

  guardar(): void {
    this.guardarLiquidacion();
  }

  // ===== MÉTODOS PARA BÚSQUEDA FILTRABLE DE VIAJEROS =====

  // Inicializar los viajeros filtrados para un índice específico
  initViajeroSearch(index: string): void {
    if (!this.viajerosFiltrados[index]) {
      this.viajerosFiltrados[index] = [...this.viajeros]; // Mostrar todos al inicio
      // Solo inicializar el término de búsqueda si no existe
      if (!this.viajeroSearchTerms[index]) {
        this.viajeroSearchTerms[index] = '';
      }
      this.viajeroDropdownsOpen[index] = false;
    }
  }

  // Obtener los viajeros filtrados para un índice
  getViajerosFiltrados(index: string): ViajeroConPersonaNatural[] {
    return this.viajerosFiltrados[index] || [];
  }

  // Manejar la búsqueda de viajeros
  onViajeroSearch(index: string, searchTerm: string): void {
    this.viajeroSearchTerms[index] = searchTerm;

    // Asegurar que el dropdown esté abierto
    this.viajeroDropdownsOpen[index] = true;

    if (!searchTerm.trim()) {
      // Si no hay término de búsqueda, mostrar todos
      this.viajerosFiltrados[index] = [...this.viajeros];
    } else {
      // Filtrar viajeros que contengan el término de búsqueda (nombres o apellidos)
      this.viajerosFiltrados[index] = this.viajeros.filter(viajero => {
        if (!viajero.personaNatural) {
          return false;
        }
        const nombreCompleto = `${viajero.personaNatural.nombres} ${viajero.personaNatural.apellidosPaterno} ${viajero.personaNatural.apellidosMaterno || ''}`.toLowerCase();
        return nombreCompleto.includes(searchTerm.toLowerCase());
      });
    }
  }

  // Seleccionar un viajero
  onViajeroSelect(index: string, viajero: ViajeroConPersonaNatural): void {
    // Actualizar el término de búsqueda con el nombre seleccionado
    if (viajero.personaNatural) {
      this.viajeroSearchTerms[index] = `${viajero.personaNatural.nombres} ${viajero.personaNatural.apellidosPaterno}`;
    }

    // Cerrar dropdown
    this.viajeroDropdownsOpen[index] = false;

    // Determinar si es un detalle original, fijo o nuevo
    if (index.startsWith('detalle-original-')) {
      // Es un detalle original
      const detalleIndex = parseInt(index.replace('detalle-original-', ''));
      this.onDetalleOriginalChange(detalleIndex, 'viajeroId', viajero.id);
    } else if (index.startsWith('detalle-fijo-')) {
      // Es un detalle fijo
      const fijoIndex = parseInt(index.replace('detalle-fijo-', ''));
      this.onProductoChange(fijoIndex, 'viajeroId', viajero.id);
    } else if (index === 'nuevo') {
      // Es el formulario de nuevo detalle
      this.detalleForm.patchValue({ viajeroId: viajero.id });
    }
  }  // Abrir dropdown de viajeros
  openViajeroDropdown(index: string): void {
    this.initViajeroSearch(index);

    // Si hay un término de búsqueda, filtrar, sino mostrar todos
    const currentSearchTerm = this.viajeroSearchTerms[index] || '';
    if (currentSearchTerm.trim()) {
      // Filtrar basado en el término actual
      this.viajerosFiltrados[index] = this.viajeros.filter(viajero => {
        if (!viajero.personaNatural) return false;
        const nombreCompleto = `${viajero.personaNatural.nombres} ${viajero.personaNatural.apellidosPaterno} ${viajero.personaNatural.apellidosMaterno || ''}`.toLowerCase();
        return nombreCompleto.includes(currentSearchTerm.toLowerCase());
      });
    } else {
      // Mostrar todos los viajeros si no hay término de búsqueda
      this.viajerosFiltrados[index] = [...this.viajeros];
    }

    this.viajeroDropdownsOpen[index] = true;
  }

  // Cerrar dropdown de viajeros
  closeViajeroDropdown(index: string): void {
    // Delay para permitir click en las opciones
    setTimeout(() => {
      this.viajeroDropdownsOpen[index] = false;
    }, 200);
  }

  // Verificar si el dropdown está abierto
  isViajeroDropdownOpen(index: string): boolean {
    return this.viajeroDropdownsOpen[index] || false;
  }

  // Obtener el término de búsqueda actual
  getViajeroSearchTerm(index: string): string {
    return this.viajeroSearchTerms[index] || '';
  }

  // Inicializar el valor de búsqueda con el viajero ya seleccionado
  initViajeroSearchValue(index: string, viajero: any): void {
    if (viajero && viajero.personaNatural && viajero.personaNatural.nombres) {
      this.viajeroSearchTerms[index] = `${viajero.personaNatural.nombres} ${viajero.personaNatural.apellidosPaterno}`;
    }
  }

  // Inicializar todos los valores de búsqueda de viajeros para detalles existentes
  initializeAllViajeroSearchValues(): void {
    // Inicializar para detalles originales
    if (this.liquidacion?.detalles) {
      this.liquidacion.detalles.forEach((detalle, index) => {
        if (detalle.viajero) {
          this.initViajeroSearchValue(`detalle-original-${index}`, detalle.viajero);
        }
      });
    }

    // Inicializar para detalles fijos
    this.detallesFijos.forEach((detalle, index) => {
      if (detalle.viajeroId) {
        const viajero = this.viajeros.find(v => v.id === detalle.viajeroId);
        if (viajero) {
          this.initViajeroSearchValue(`detalle-fijo-${index}`, viajero);
        }
      }
    });
  }

  // Reinicializar valores de búsqueda después de restaurar estado temporal
  reinicializarValoresBusqueda(): void {
    // Asegurar que tenemos los datos necesarios
    if (this.viajeros.length === 0) {
      setTimeout(() => this.reinicializarValoresBusqueda(), 100);
      return;
    }

    // Inicializar para detalles originales
    if (this.liquidacion?.detalles) {
      this.liquidacion.detalles.forEach((detalle, index) => {
        if (detalle.viajero) {
          this.initViajeroSearchValue(`detalle-original-${index}`, detalle.viajero);
        }
      });
    }

    // Inicializar para detalles fijos
    this.detallesFijos.forEach((detalle, index) => {
      if (detalle.viajeroId) {
        const viajero = this.viajeros.find(v => v.id === detalle.viajeroId);
        if (viajero) {
          this.initViajeroSearchValue(`detalle-fijo-${index}`, viajero);
        }
      }
    });

    // Inicializar para el formulario nuevo si tiene un viajero seleccionado
    const viajeroIdFormulario = this.detalleForm.get('viajeroId')?.value;
    if (viajeroIdFormulario) {
      const viajero = this.viajeros.find(v => v.id === Number(viajeroIdFormulario));
      if (viajero) {
        this.initViajeroSearchValue('nuevo', viajero);
      }
    }
  }
}
