import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

// Services
import { LiquidacionService } from '../../core/service/Liquidacion/liquidacion.service';
import { LoadingService } from '../../core/service/loading.service';
import { PersonaService } from '../../core/service/persona/persona.service';
import { PersonaNaturalService } from '../../core/service/natural/persona-natural.service';
import { PersonaJuridicaService } from '../../core/service/juridica/persona-juridica.service';
import { ProductoService } from '../../core/service/Producto/producto.service';
import { FormaPagoService } from '../../core/service/FormaPago/forma-pago.service';
import { DetalleLiquidacionService } from '../../core/service/DetalleLiquidacion/detalle-liquidacion.service';
import { ProveedorService } from '../../core/service/Proveedor/proveedor.service';
import { OperadorService } from '../../core/service/Operador/operador.service';
import { ViajeroService } from '../../core/service/viajero/viajero.service';

// Models
import { LiquidacionConDetallesResponse, LiquidacionRequest } from '../../shared/models/Liquidacion/liquidacion.model';
import { DetalleLiquidacionResponse, DetalleLiquidacionRequest } from '../../shared/models/Liquidacion/detalleLiquidacion.model';
import { personaDisplay } from '../../shared/models/Persona/persona.model';
import { PersonaNaturalResponse } from '../../shared/models/Persona/personaNatural.model';
import { PersonaJuridicaResponse } from '../../shared/models/Persona/personaJuridica.models';
import { ProductoResponse } from '../../shared/models/Producto/producto.model';
import { FormaPagoResponse } from '../../shared/models/FormaPago/formaPago.model';
import { ProveedorResponse } from '../../shared/models/Proveedor/proveedor.model';
import { OperadorResponse } from '../../shared/models/Operador/operador.model';
import { ViajeroResponse } from '../../shared/models/Viajero/viajero.model';

// Components
import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-detalle-liquidacion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './detalle-liquidacion.component.html',
  styleUrls: ['./detalle-liquidacion.component.css']
})
export class DetalleLiquidacionComponent implements OnInit, OnDestroy {

  // Services
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private liquidacionService = inject(LiquidacionService);
  private loadingService = inject(LoadingService);
  private personaService = inject(PersonaService);
  private personaNaturalService = inject(PersonaNaturalService);
  private personaJuridicaService = inject(PersonaJuridicaService);
  private productoService = inject(ProductoService);
  private formaPagoService = inject(FormaPagoService);
  private detalleLiquidacionService = inject(DetalleLiquidacionService);
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
  viajeros: ViajeroResponse[] = [];

  // Search/Filter state for dropdowns
  viajerosFiltrados: { [index: string]: ViajeroResponse[] } = {};
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

  // Detalles fijos como en cotizaciones
  detallesFijos: DetalleLiquidacionRequest[] = [];

  // Sidebar Configuration
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
      route: '/cotizaciones'
    },
    {
      id: 'liquidaciones',
      title: 'Liquidaciones',
      icon: 'fas fa-credit-card',
      active: true,
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
  }

  ngOnInit(): void {
    this.loadLiquidacionFromRoute();
    this.loadSelectOptions();
  }

  ngOnDestroy(): void {
    // Guardar estado temporal antes de destruir el componente
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
      viajeroSearchTerms: this.viajeroSearchTerms,
      timestamp: new Date().getTime()
    };

    try {
      sessionStorage.setItem(this.getEstadoTemporalKey(), JSON.stringify(estadoTemporal));
    } catch (error) {
      console.warn('No se pudo guardar el estado temporal:', error);
    }
  }

  private cargarEstadoTemporal(): boolean {
    if (!this.modoEdicion || !this.liquidacionId) {
      return false;
    }

    try {
      const estadoGuardado = sessionStorage.getItem(this.getEstadoTemporalKey());
      if (!estadoGuardado) {
        return false;
      }

      const estado = JSON.parse(estadoGuardado);
      const tiempoTranscurrido = new Date().getTime() - estado.timestamp;

      // Solo cargar si han pasado menos de 30 minutos (1800000 ms)
      if (tiempoTranscurrido > 1800000) {
        this.limpiarEstadoTemporal();
        return false;
      }

      // Restaurar formularios
      if (estado.liquidacionForm) {
        this.liquidacionForm.patchValue(estado.liquidacionForm);
      }
      if (estado.detalleForm) {
        this.detalleForm.patchValue(estado.detalleForm);
      }
      if (estado.detallesFijos) {
        this.detallesFijos = estado.detallesFijos;
      }
      if (estado.viajeroSearchTerms) {
        this.viajeroSearchTerms = estado.viajeroSearchTerms;
      }

      // Reinicializar los valores de búsqueda después de restaurar el estado
      setTimeout(() => {
        this.reinicializarValoresBusqueda();
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
              error: (error) => {
                console.error('Error al cargar liquidación básica:', error);
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

          // Inicializar el formulario con los datos cargados
          this.initializeForm();

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
        catchError(error => {
          console.error('Error al cargar formas de pago:', error);
          return of([]);
        })
      )
      .subscribe(formasPago => {
        this.formasPago = formasPago;
      });

    // Cargar proveedores
    const proveedoresSubscription = this.proveedorService.findAllProveedor()
      .pipe(
        catchError(error => {
          console.error('Error al cargar proveedores:', error);
          return of([]);
        })
      )
      .subscribe((proveedores: ProveedorResponse[]) => {
        this.proveedores = proveedores;
      });

    // Cargar operadores
    const operadoresSubscription = this.operadorService.findAllOperador()
      .pipe(
        catchError(error => {
          console.error('Error al cargar operadores:', error);
          return of([]);
        })
      )
      .subscribe((operadores: OperadorResponse[]) => {
        this.operadores = operadores;
      });

    // Cargar viajeros
    const viajerosSubscription = this.viajeroService.findAll()
      .pipe(
        catchError(error => {
          console.error('Error al cargar viajeros:', error);
          return of([]);
        })
      )
      .subscribe((viajeros: ViajeroResponse[]) => {
        this.viajeros = viajeros;

        // Inicializar los valores de búsqueda después de cargar los viajeros
        setTimeout(() => {
          this.initializeAllViajeroSearchValues();
        }, 100);
      });

    this.subscriptions.add(productosSubscription);
    this.subscriptions.add(formasPagoSubscription);
    this.subscriptions.add(proveedoresSubscription);
    this.subscriptions.add(operadoresSubscription);
    this.subscriptions.add(viajerosSubscription);
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

  // Form methods
  private initializeForm(): void {
    // Intentar cargar estado temporal primero
    const estadoTemporalCargado = this.cargarEstadoTemporal();

    if (!estadoTemporalCargado && this.liquidacion) {
      // Si no hay estado temporal, cargar datos normales
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

          // Guardar detalles fijos de forma simple
          this.detallesFijos.forEach(detalle => {
            if (detalle.viajeroId || detalle.productoId) {
              this.detalleLiquidacionService.createDetalleLiquidacion(this.liquidacionId!, detalle)
                .subscribe({
                  next: (detalleResponse) => { },
                  error: (error) => { }
                });
            }
          });

          // Limpiar estado temporal después de guardar exitosamente
          this.limpiarEstadoTemporal();
          // Recargar los datos actualizados
          this.loadLiquidacion(this.liquidacionId!);
          // Salir del modo edición
          this.salirModoEdicion();
        }),
        catchError(error => {
          this.error = 'Error al guardar los cambios';
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
      this.liquidacion.detalles.splice(index, 1);
      // Autoguardar estado temporal
      this.guardarEstadoTemporal();
    }
  }

  recargarDatos(): void {
    if (this.liquidacionId) {
      this.loadLiquidacion(this.liquidacionId);
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
  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onSidebarItemClick(item: any): void {
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
          break;
        case 'cargoServicio':
          detalle.cargoServicio = value ? Number(value) : 0;
          break;
        case 'valorVenta':
          detalle.valorVenta = value ? Number(value) : 0;
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
          break;
        case 'cargoServicio':
          detalle.cargoServicio = value ? Number(value) : 0;
          break;
        case 'valorVenta':
          detalle.valorVenta = value ? Number(value) : 0;
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
    if (viajero) {
      return `${viajero.nombres} ${viajero.apellidoPaterno}`;
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
  getViajerosFiltrados(index: string): ViajeroResponse[] {
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
        const nombreCompleto = `${viajero.nombres} ${viajero.apellidoPaterno} ${viajero.apellidoMaterno || ''}`.toLowerCase();
        return nombreCompleto.includes(searchTerm.toLowerCase());
      });
    }
  }

  // Seleccionar un viajero
  onViajeroSelect(index: string, viajero: ViajeroResponse): void {
    // Actualizar el término de búsqueda con el nombre seleccionado
    this.viajeroSearchTerms[index] = `${viajero.nombres} ${viajero.apellidoPaterno}`;

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
        const nombreCompleto = `${viajero.nombres} ${viajero.apellidoPaterno} ${viajero.apellidoMaterno || ''}`.toLowerCase();
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
    if (viajero && viajero.nombres) {
      this.viajeroSearchTerms[index] = `${viajero.nombres} ${viajero.apellidoPaterno}`;
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
