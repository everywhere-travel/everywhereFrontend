import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

// Services
import { ReciboService } from '../../core/service/Recibo/recibo.service';
import { DetalleReciboService } from '../../core/service/Recibo/detalle-recibo.service';
import { ProductoService } from '../../core/service/Producto/producto.service';
import { LoadingService } from '../../core/service/loading.service';
import { SucursalService } from '../../core/service/Sucursal/sucursal.service';
import { FormaPagoService } from '../../core/service/FormaPago/forma-pago.service';
import { NaturalJuridicoService } from '../../core/service/NaturalJuridico/natural-juridico.service'; 
import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';

// Models
import { DetalleReciboRequestDTO, DetalleReciboResponseDTO } from '../../shared/models/Recibo/detalleRecibo.model';
import { ProductoResponse } from '../../shared/models/Producto/producto.model';
import { SucursalResponse } from '../../shared/models/Sucursal/sucursal.model';
import { PersonaJuridicaResponse } from '../../shared/models/Persona/personaJuridica.models';
import { FormaPagoResponse } from '../../shared/models/FormaPago/formaPago.model';
import { ReciboResponseDTO, ReciboUpdateDTO } from '../../shared/models/Recibo/recibo.model';

// Components
import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';
import { DetalleDocumentoService } from '../../core/service/DetalleDocumento/detalle-documento.service';
import { DetalleDocumentoResponse } from '../../shared/models/Documento/detalleDocumento.model';


@Component({
  selector: 'app-detalle-recibo',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './detalle-recibo.component.html',
  styleUrls: ['./detalle-recibo.component.css']
})
export class DetalleReciboComponent implements OnInit, OnDestroy {

  // Services
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private reciboService = inject(ReciboService);
  private detalleReciboService = inject(DetalleReciboService);
  private detalleDocumentoService = inject(DetalleDocumentoService);
  private productoService = inject(ProductoService);
  private loadingService = inject(LoadingService);
  private fb = inject(FormBuilder);
  private sucursalService = inject(SucursalService);
  private naturalJuridicoService = inject(NaturalJuridicoService);
  private formaPagoService = inject(FormaPagoService);

  // Data
  recibo: ReciboResponseDTO | null = null;
  reciboId: number | null = null;
  detalles: DetalleReciboResponseDTO[] = [];
  detallesFijos: DetalleReciboResponseDTO[] = []; // Detalles temporales para agregar en modo edición
  detallesDocumento: DetalleDocumentoResponse[] = [];
  productos: ProductoResponse[] = [];
  sucursales: SucursalResponse[] = [];
  personasJuridicas: PersonaJuridicaResponse[] = [];
  documentosCliente: DetalleDocumentoResponse[] = [];
  formasPago: FormaPagoResponse[] = [];
  sucursalSeleccionada: number | null = null;
  personaJuridicaSeleccionada: number | null = null;
  detalleDocumentoSeleccionado: number | null = null;

  // Forms
  detalleForm: FormGroup;
  reciboForm: FormGroup;

  // UI State
  isLoading = false;
  error: string | null = null;
  success: string | null = null;
  modoEdicion = false;
  showDetalleForm = false;
  showReciboForm = false;
  editingDetalleId: number | null = null;

  // Sidebar Configuration
  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];
  sidebarCollapsed = false;

  private subscriptions = new Subscription();

  constructor(
    private menuConfigService: MenuConfigService
  ) {
    this.detalleForm = this.fb.group({
      cantidad: [1, [Validators.required, Validators.min(1)]],
      descripcion: [''],
      precio: [0, [Validators.required, Validators.min(0)]],
      productoId: [null]
    });

    this.reciboForm = this.fb.group({
      fechaEmision: [''],
      fileVenta: ['', [Validators.maxLength(100)]],
      observaciones: ['', [Validators.maxLength(500)]],
      detalleDocumentoId: [null], // Puede contener 'doc_123' o 'pj_456' - Opcional
      sucursalId: [null], // Opcional
      formaPagoId: [null] // Opcional
    });
  }

  ngOnInit(): void {
    this.sidebarMenuItems = this.menuConfigService.getMenuItems('/recibos/detalle/:id');
    this.loadReciboFromRoute();
    this.loadProductos();
  }

  // =================================================================
  // SIDEBAR EVENTS
  // =================================================================
  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onSidebarItemClick(item: SidebarMenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ===== NAVIGATION METHODS =====
  private loadReciboFromRoute(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam || isNaN(Number(idParam))) {
      this.error = 'ID de recibo inválido';
      return;
    }

    const modoParam = this.route.snapshot.queryParamMap.get('modo');
    this.modoEdicion = modoParam === 'editar';

    this.reciboId = Number(idParam);
    this.loadRecibo(this.reciboId);
  }

  private loadRecibo(id: number): void {
    this.isLoading = true;
    this.error = null;
    this.loadingService.setLoading(true);

    const subscription = this.reciboService.getReciboById(id)
      .pipe(
        catchError(error => {
          console.error('Error al cargar recibo:', error);
          this.error = 'Error al cargar el recibo. Por favor, intente nuevamente.';
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
          this.loadingService.setLoading(false);
        })
      )
      .subscribe(recibo => {
        if (recibo) {
          // Crear nueva referencia para forzar detección de cambios en Angular
          this.recibo = { ...recibo };
          this.loadDetallesRecibo();
          // Cargar detalles del recibo
          this.loadDetalles(id);

          // Si el URL ya tiene modo=editar, entrar en modo edición
          if (this.modoEdicion) {
            this.enterEditMode();
          }
        }
      });

    this.subscriptions.add(subscription);
  }

  private loadDetallesRecibo(): void {
    if (!this.recibo?.personaId) {
      return;
    }

    const subscription = this.detalleDocumentoService.findByPersonaId(this.recibo.personaId)
      .pipe(
        catchError(error => {
          return of([]);
        })
      )
      .subscribe(detallesDoc => {
        this.detallesDocumento = detallesDoc;
      });

    this.subscriptions.add(subscription);
  }

  private loadDetalles(reciboId: number): void {
    const subscription = this.detalleReciboService.getDetallesByRecibo(reciboId)
      .pipe(
        catchError(error => {
          return of([]);
        })
      )
      .subscribe(detalles => {
        this.detalles = detalles;
      });

    this.subscriptions.add(subscription);
  }

  private loadProductos(): void {
    const subscription = this.productoService.getAllProductos()
      .pipe(
        catchError(error => {
          console.error('Error al cargar productos:', error);
          return of([]);
        })
      )
      .subscribe(productos => {
        this.productos = productos;
      });

    this.subscriptions.add(subscription);
  }

  // ===== CRUD OPERATIONS =====
  guardarDetalle(): void {
    if (!this.detalleForm.valid || !this.reciboId) {
      return;
    }

    const formValue = this.detalleForm.value;
    const detalleRequest: DetalleReciboRequestDTO = {
      cantidad: formValue.cantidad,
      descripcion: formValue.descripcion,
      precio: formValue.precio,
      productoId: formValue.productoId,
      reciboId: this.reciboId
    };

    this.isLoading = true;

    if (this.editingDetalleId) {
      // Actualizar detalle existente
      const updateSubscription = this.detalleReciboService.updateDetalle(this.editingDetalleId, detalleRequest)
        .pipe(
          catchError(error => {
            console.error('Error al actualizar detalle:', error);
            this.error = 'Error al actualizar el detalle';
            return of(null);
          }),
          finalize(() => this.isLoading = false)
        )
        .subscribe(response => {
          if (response) {
            this.success = 'Detalle actualizado correctamente';
            this.recargarDetalles();
            this.cancelarEdicion();
          }
        });

      this.subscriptions.add(updateSubscription);
    } else {
      // Crear nuevo detalle
      const createSubscription = this.detalleReciboService.createDetalle(detalleRequest)
        .pipe(
          catchError(error => {
            console.error('Error al crear detalle:', error);
            this.error = 'Error al crear el detalle';
            return of(null);
          }),
          finalize(() => this.isLoading = false)
        )
        .subscribe(response => {
          if (response) {
            this.success = 'Detalle creado correctamente';
            this.recargarDetalles();
            this.cancelarEdicion();
          }
        });

      this.subscriptions.add(createSubscription);
    }
  }

  editarDetalle(detalle: DetalleReciboResponseDTO): void {
    this.editingDetalleId = detalle.id || null;
    this.showDetalleForm = true;

    this.detalleForm.patchValue({
      cantidad: detalle.cantidad,
      descripcion: detalle.descripcion,
      precio: detalle.precio,
      productoId: detalle.productoId
    });
  }

  eliminarDetalle(detalleId: number): void {
    if (!confirm('¿Está seguro de que desea eliminar este detalle?')) {
      return;
    }

    this.isLoading = true;

    const deleteSubscription = this.detalleReciboService.deleteDetalle(detalleId)
      .pipe(
        catchError(error => {
          console.error('Error al eliminar detalle:', error);
          this.error = 'Error al eliminar el detalle';
          return of(null);
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe(() => {
        this.success = 'Detalle eliminado correctamente';
        this.recargarDetalles();
      });

    this.subscriptions.add(deleteSubscription);
  }

  // ===== DOCUMENTO CRUD OPERATIONS =====
  guardarDocumento(): void {
    if (!this.reciboForm.valid || !this.reciboId) {
      return;
    }

    const formValue = this.reciboForm.value;
    // Separar el valor combinado del dropdown
    let detalleDocumentoId: number | undefined = undefined;
    let personaJuridicaId: number | undefined = undefined;

    if (formValue.detalleDocumentoId) {
      const valor = formValue.detalleDocumentoId.toString();
      if (valor.startsWith('doc_')) {
        detalleDocumentoId = parseInt(valor.substring(4));
      } else if (valor.startsWith('pj_')) {
        personaJuridicaId = parseInt(valor.substring(3));
      }
    }

    const updateDTO: ReciboUpdateDTO = {
      fileVenta: formValue.fileVenta?.trim() || '',
      observaciones: formValue.observaciones?.trim() || '',
      detalleDocumentoId: detalleDocumentoId,
      sucursalId: formValue.sucursalId || undefined,
      personaJuridicaId: personaJuridicaId,
      formaPagoId: formValue.formaPagoId || undefined
    };

    this.isLoading = true;

    const updateSubscription = this.reciboService.updateRecibo(this.reciboId, updateDTO)
      .pipe(
        catchError(error => {
          console.error('Error al actualizar documento:', error);
          this.error = 'Error al actualizar el documento';
          return of(null);
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe(response => {
        if (response) {
          this.success = 'Documento actualizado correctamente';
          // Recargar documento completo desde el servidor para evitar caché
          if (this.reciboId) {
            this.loadRecibo(this.reciboId);
          }
          this.salirModoEdicion();
        }
      });

    this.subscriptions.add(updateSubscription);
  }

  // ===== UI METHODS =====
  mostrarFormularioEditarRecibo(): void {
    if (this.recibo) {
      this.reciboForm.patchValue({
        fileVenta: this.recibo.fileVenta || '',
        observaciones: this.recibo.observaciones || ''
      });
      this.showReciboForm = true;
    }
  }

  cancelarEdicionRecibo(): void {
    this.showReciboForm = false;
    this.reciboForm.reset();
  }

  mostrarFormularioNuevoDetalle(): void {
    this.editingDetalleId = null;
    this.showDetalleForm = true;
    this.detalleForm.reset({
      cantidad: 1,
      descripcion: '',
      precio: 0,
      productoId: null
    });
  }

  cancelarEdicion(): void {
    this.showDetalleForm = false;
    this.editingDetalleId = null;
    this.detalleForm.reset();
  }

  irAEditarRecibo(): void {
    this.enterEditMode();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { modo: 'editar' },
      queryParamsHandling: 'merge'
    });
  }

  private enterEditMode(): void {
    if (!this.recibo) return;

    this.modoEdicion = true;

    // Cargar opciones necesarias
    this.cargarOpcionesEdicion();

    // Llenar formulario con datos actuales
    let valorCombinado = null;
    if (this.recibo.personaJuridicaId) {
      valorCombinado = 'pj_' + this.recibo.personaJuridicaId;
    } else if (this.recibo.detalleDocumentoId) {
      valorCombinado = 'doc_' + this.recibo.detalleDocumentoId;
    }

    // Convertir fechaEmision de ISO datetime a solo fecha (YYYY-MM-DD) para el input type="date"
    const fechaEmisionValue = this.recibo.fechaEmision
      ? this.recibo.fechaEmision.split('T')[0]
      : '';

    this.reciboForm.patchValue({
      fechaEmision: fechaEmisionValue,
      fileVenta: this.recibo.fileVenta || '',
      observaciones: this.recibo.observaciones || '',
      detalleDocumentoId: valorCombinado,
      sucursalId: this.recibo.sucursalId || null,
      formaPagoId: this.recibo.formaPagoId || null
    });
    this.sucursalSeleccionada = this.recibo.sucursalId || null;
  }

  salirModoEdicion(): void {
    this.modoEdicion = false;
    this.showDetalleForm = false;
    this.showReciboForm = false;
    this.reciboForm.reset();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { modo: null },
      queryParamsHandling: 'merge'
    });
  }

  volverARecibos(): void {
    this.router.navigate(['/recibos']);
  }

  recargarDetalles(): void {
    if (this.reciboId) {
      this.loadDetalles(this.reciboId);
    }
  }

  // ===== UTILITY METHODS =====
  getProductoNombre(productoId: number | string | undefined): string {
    if (!productoId) return 'Sin producto';
    // Convertir a número para comparar
    const id = typeof productoId === 'string' ? parseInt(productoId, 10) : productoId;
    const producto = this.productos.find(p => p.id === id);
    return producto ? producto.tipo : 'Producto no encontrado';
  }

  calcularTotal(): number {
    const totalDetalles = this.detalles.reduce((total, detalle) => {
      return total + ((detalle.cantidad || 0) * (detalle.precio || 0));
    }, 0);
    return totalDetalles;
  }

  hideMessages(): void {
    this.success = null;
    this.error = null;
  }

  trackByDetalle(index: number, detalle: DetalleReciboResponseDTO): number {
    return detalle.id || index;
  }

  // ============ OPCIONES DE EDICIÓN =============
  async cargarOpcionesEdicion(): Promise<void> {
    try {
      this.sucursales = await this.sucursalService.findAllSucursal().toPromise() || []; // Cargar sucursales
      this.formasPago = await this.formaPagoService.getAllFormasPago().toPromise() || []; // Cargar formas de pago

      const personaId = this.recibo?.personaId; // Cargar documentos del cliente (DNI, Pasaporte, etc.)

      if (personaId) {
        try {
          this.documentosCliente = await this.detalleDocumentoService // Cargar documentos del cliente
            .findByPersonaId(personaId)
            .toPromise() || [];

          if (this.documentosCliente.length > 0) {
            // Usar el personaNaturalId del primer documento
            const personaNaturalId = this.documentosCliente[0].personaNatural.id;
            const relaciones = await this.naturalJuridicoService
              .findByPersonaNaturalId(personaNaturalId)
              .toPromise() || [];
            this.personasJuridicas = relaciones.map(r => r.personaJuridica);
          } else {
            if (this.recibo?.personaJuridicaId) {
              this.personasJuridicas = [{
                id: this.recibo.personaJuridicaId,
                ruc: this.recibo.personaJuridicaRuc || '',
                razonSocial: this.recibo.personaJuridicaRazonSocial || '',
                persona: {} as any,
                creado: new Date().toISOString(),
                actualizado: new Date().toISOString()
              }];
            } else {
              this.personasJuridicas = [];
            }
          }
        } catch (error: any) {
          // Si falla la carga de documentos (404 para PersonaJuridica), intentar cargar PersonaJuridica
          this.documentosCliente = [];

          // Verificar si es PersonaJuridica y cargarla
          if (this.recibo?.personaJuridicaId) {
            this.personasJuridicas = [{
              id: this.recibo.personaJuridicaId,
              ruc: this.recibo.personaJuridicaRuc || '',
              razonSocial: this.recibo.personaJuridicaRazonSocial || '',
              persona: {} as any,
              creado: new Date().toISOString(),
              actualizado: new Date().toISOString()
            }];
          } else {
            this.personasJuridicas = [];
          }
        }
      }
    } catch (error) {
      this.error = 'Error al cargar las opciones de edición';
    }
  }

  // ============ HELPER METHODS =============
  getDetalleDocumentoDisplay(): string {
    const detalleDocId = (this.recibo as any)?.detalleDocumentoId;
    if (!detalleDocId) return 'Sin detalle de documento';
    const detalle = this.detallesDocumento.find(d => d.id === detalleDocId);
    if (!detalle) return 'Sin detalle de documento';
    return `${detalle.numero} - ${detalle.documento?.tipo || 'N/A'}`;
  }

  getDetalleDocumentoInfo(id: number): DetalleDocumentoResponse | undefined {
    return this.detallesDocumento.find(d => d.id === id);
  }

  getNumeroRecibo(recibo: ReciboResponseDTO | null): string {
    if (recibo?.serie && recibo?.correlativo !== undefined && recibo?.correlativo !== null) {
      return `${recibo.serie}-${String(recibo.correlativo).padStart(9, '0')}`;
    }
    return 'Sin número';
  }

  onDetalleDocumentoChange(event: any): void {
    const detalleId = event.target.value;
    if (detalleId) {
      const detalle = this.getDetalleDocumentoInfo(Number(detalleId));
    }
  }

  // ============ INLINE EDITING METHODS =============

  /**
   * Actualiza un campo de un detalle original (ya existente en BD)
   */
  onDetalleOriginalChange(index: number, field: string, value: any): void {
    if (index >= 0 && index < this.detalles.length) {
      const detalle = this.detalles[index];
      (detalle as any)[field] = value;
    }
  }

  /**
   * Elimina un detalle original del array (marca para eliminación)
   */
  eliminarDetalleOriginal(index: number): void {
    if (index >= 0 && index < this.detalles.length) {
      if (confirm('¿Está seguro de eliminar este detalle?')) {
        this.detalles.splice(index, 1);
      }
    }
  }

  /**
   * Actualiza un campo de un detalle fijo (temporal, no guardado aún)
   */
  onDetalleFijoChange(index: number, field: string, value: any): void {
    if (index >= 0 && index < this.detallesFijos.length) {
      const detalle = this.detallesFijos[index];
      (detalle as any)[field] = value;
    }
  }

  /**
   * Elimina un detalle fijo del array temporal
   */
  eliminarDetalleFijo(index: number): void {
    if (index >= 0 && index < this.detallesFijos.length) {
      this.detallesFijos.splice(index, 1);
    }
  }

  /**
   * Agrega un nuevo detalle al array de detalles fijos desde el formulario
   */
  agregarDetalleFijo(): void {
    if (!this.detalleForm.valid) {
      Object.keys(this.detalleForm.controls).forEach(key => {
        this.detalleForm.get(key)?.markAsTouched();
      });
      return;
    }

    const formValue = this.detalleForm.value;
    const nuevoDetalle: DetalleReciboResponseDTO = {
      cantidad: formValue.cantidad || 1,
      descripcion: formValue.descripcion || '',
      precio: formValue.precio || 0,
      productoId: formValue.productoId || undefined,
      reciboId: this.reciboId || undefined
    };

    this.detallesFijos.push(nuevoDetalle);

    // Reset form
    this.detalleForm.reset({
      cantidad: 1,
      descripcion: '',
      precio: 0,
      productoId: null
    });
  }

  /**
   * Guarda todos los cambios: detalles modificados, nuevos detalles fijos y documento
   */
  async guardarCambios(): Promise<void> {
    if (!this.reciboId) {
      this.error = 'No se puede guardar sin un ID de recibo';
      return;
    }

    this.isLoading = true;
    this.loadingService.setLoading(true);

    try {
      await this.guardarReciboAsync();

      // 2. Actualizar detalles existentes
      for (const detalle of this.detalles) {
        if (detalle.id) {
          const updateDTO: DetalleReciboRequestDTO = {
            cantidad: detalle.cantidad,
            descripcion: detalle.descripcion || '',
            precio: detalle.precio,
            productoId: detalle.productoId || 0,
            reciboId: this.reciboId
          };

          await this.detalleReciboService.updateDetalle(detalle.id, updateDTO).toPromise();
        }
      }

      // 3. Crear nuevos detalles fijos
      for (const detalleFijo of this.detallesFijos) {
        const createDTO: DetalleReciboRequestDTO = {
          cantidad: detalleFijo.cantidad,
          descripcion: detalleFijo.descripcion || '',
          precio: detalleFijo.precio,
          productoId: detalleFijo.productoId || 0,
          reciboId: this.reciboId
        };

        await this.detalleReciboService.createDetalle(createDTO).toPromise();
      }

      this.success = 'Cambios guardados correctamente';
      this.detallesFijos = []; // Limpiar detalles temporales
      this.recargarDetalles();
      // Recargar recibo completo desde el servidor para evitar caché
      if (this.reciboId) {
        this.loadRecibo(this.reciboId);
      }
      this.salirModoEdicion();

    } catch (error) {
      console.error('Error al guardar cambios:', error);
      this.error = 'Error al guardar los cambios';
    } finally {
      this.isLoading = false;
      this.loadingService.setLoading(false);
    }
  }

  /**
   * Versión async del guardar recibo
   */
  private async guardarReciboAsync(): Promise<void> {
    if (!this.reciboForm.valid || !this.reciboId) {
      console.error('Formulario inválido o sin reciboId', {
        valid: this.reciboForm.valid,
        reciboId: this.reciboId,
        errors: this.reciboForm.errors
      });
      return;
    }

    const formValue = this.reciboForm.value;

    // Separar el valor combinado del dropdown
    let detalleDocumentoId: number | undefined = undefined;
    let personaJuridicaId: number | undefined = undefined;

    if (formValue.detalleDocumentoId) {
      const valor = formValue.detalleDocumentoId.toString();
      if (valor.startsWith('doc_')) {
        detalleDocumentoId = parseInt(valor.substring(4));
      } else if (valor.startsWith('pj_')) {
        personaJuridicaId = parseInt(valor.substring(3));
      }
    }

    const updateDTO: ReciboUpdateDTO = {
      fechaEmision: formValue.fechaEmision || undefined,
      fileVenta: formValue.fileVenta?.trim() || '',
      observaciones: formValue.observaciones?.trim() || '',
      detalleDocumentoId: detalleDocumentoId,
      sucursalId: formValue.sucursalId || undefined,
      personaJuridicaId: personaJuridicaId,
      formaPagoId: formValue.formaPagoId || undefined
    };

    const response = await this.reciboService.updateRecibo(this.reciboId, updateDTO).toPromise();
    if (response) {
      this.recibo = response;
    }
  }
}
