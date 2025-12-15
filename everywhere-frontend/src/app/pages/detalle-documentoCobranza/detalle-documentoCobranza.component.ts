import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

// Services
import { DocumentoCobranzaService } from '../../core/service/DocumentoCobranza/DocumentoCobranza.service';
import { DetalleDocumentoCobranzaService } from '../../core/service/DetalleDocumentoCobranza/detalle-documentoCobranza.service';
import { ProductoService } from '../../core/service/Producto/producto.service';
import { LoadingService } from '../../core/service/loading.service';
import { SucursalService } from '../../core/service/Sucursal/sucursal.service';
import { FormaPagoService } from '../../core/service/FormaPago/forma-pago.service';
import { NaturalJuridicoService } from '../../core/service/NaturalJuridico/natural-juridico.service';
import { PersonaService } from '../../core/service/persona/persona.service';
import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';

// Models
import { DocumentoCobranzaResponseDTO, DocumentoCobranzaUpdateDTO } from '../../shared/models/DocumetnoCobranza/documentoCobranza.model';
import { DetalleDocumentoCobranzaRequestDTO, DetalleDocumentoCobranzaResponseDTO } from '../../shared/models/DocumetnoCobranza/detalleDocumentoCobranza.model';
import { ProductoResponse } from '../../shared/models/Producto/producto.model';
import { SucursalResponse } from '../../shared/models/Sucursal/sucursal.model'; 
import { PersonaJuridicaResponse } from '../../shared/models/Persona/personaJuridica.models';
import { FormaPagoResponse } from '../../shared/models/FormaPago/formaPago.model';

// Components
import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';
import { DetalleDocumentoService } from '../../core/service/DetalleDocumento/detalle-documento.service';
import { DetalleDocumentoResponse } from '../../shared/models/Documento/detalleDocumento.model'; 


@Component({
  selector: 'app-detalle-documentoCobranza',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './detalle-documentoCobranza.component.html',
  styleUrls: ['./detalle-documentoCobranza.component.css']
})
export class DetalleDocumentoCobranzaComponent implements OnInit, OnDestroy {

  // Services
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private documentoCobranzaService = inject(DocumentoCobranzaService);
  private detalleDocumentoCobranzaService = inject(DetalleDocumentoCobranzaService);
  private detalleDocumentoService = inject(DetalleDocumentoService);
  private productoService = inject(ProductoService);
  private loadingService = inject(LoadingService);
  private fb = inject(FormBuilder);
  private sucursalService = inject(SucursalService);
  private naturalJuridicoService = inject(NaturalJuridicoService);
  private personaService = inject(PersonaService);
  private formaPagoService = inject(FormaPagoService);

  // Data
  documento: DocumentoCobranzaResponseDTO | null = null;
  documentoId: number | null = null;
  detalles: DetalleDocumentoCobranzaResponseDTO[] = [];
  detallesFijos: DetalleDocumentoCobranzaResponseDTO[] = []; // Detalles temporales para agregar en modo edición
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
  documentoForm: FormGroup;

  // UI State
  isLoading = false;
  error: string | null = null;
  success: string | null = null;
  modoEdicion = false;
  showDetalleForm = false;
  showDocumentoForm = false;
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

    this.documentoForm = this.fb.group({
      fileVenta: ['', [Validators.maxLength(100)]],
      costoEnvio: [0, [Validators.min(0)]],
      observaciones: ['', [Validators.maxLength(500)]],
      detalleDocumentoId: [null], // Puede contener 'doc_123' o 'pj_456' - Opcional
      sucursalId: [null], // Opcional
      formaPagoId: [null] // Opcional
    });
  }

  ngOnInit(): void {
    this.sidebarMenuItems = this.menuConfigService.getMenuItems('/documentos-cobranza/detalle/:id');
    this.loadDocumentoFromRoute();
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
  private loadDocumentoFromRoute(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam || isNaN(Number(idParam))) {
      this.error = 'ID de documento de cobranza inválido';
      return;
    }

    const modoParam = this.route.snapshot.queryParamMap.get('modo');
    this.modoEdicion = modoParam === 'editar';

    this.documentoId = Number(idParam);
    this.loadDocumento(this.documentoId);
  }

  private loadDocumento(id: number): void {
    this.isLoading = true;
    this.error = null;
    this.loadingService.setLoading(true);

    const subscription = this.documentoCobranzaService.getDocumentoById(id)
      .pipe(
        catchError(error => {
          console.error('Error al cargar documento:', error);
          this.error = 'Error al cargar el documento de cobranza. Por favor, intente nuevamente.';
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
          this.loadingService.setLoading(false);
        })
      )
      .subscribe(documento => {
        if (documento) {
          // Crear nueva referencia para forzar detección de cambios en Angular
          this.documento = { ...documento };
          console.log('📄 Documento cargado:', this.documento);
          console.log('💳 FormaPagoId:', this.documento.formaPagoId);
          console.log('💳 FormaPagoDescripcion:', this.documento.formaPagoDescripcion);
          this.loadDetallesDocumento();
          // Cargar detalles del documento de cobranza
          this.loadDetalles(id);
        }
      });

    this.subscriptions.add(subscription);
  }

  private loadDetallesDocumento(): void {
    if (!this.documento?.personaId) {
      return;
    }

    const subscription = this.detalleDocumentoService.findByPersonaId(this.documento.personaId)
      .pipe(
        catchError(error => {
          console.error('❌ Error al cargar detalles de documento:', error);
          return of([]);
        })
      )
      .subscribe(detallesDoc => {
        this.detallesDocumento = detallesDoc;
      });

    this.subscriptions.add(subscription);
  }

  private loadDetalles(documentoId: number): void {
    const subscription = this.detalleDocumentoCobranzaService.getDetallesByDocumentoCobranza(documentoId)
      .pipe(
        catchError(error => {
          console.error('Error al cargar detalles:', error);
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
    if (!this.detalleForm.valid || !this.documentoId) {
      return;
    }

    const formValue = this.detalleForm.value;
    const detalleRequest: DetalleDocumentoCobranzaRequestDTO = {
      cantidad: formValue.cantidad,
      descripcion: formValue.descripcion,
      precio: formValue.precio,
      productoId: formValue.productoId,
      documentoCobranzaId: this.documentoId
    };

    this.isLoading = true;

    if (this.editingDetalleId) {
      // Actualizar detalle existente
      const updateSubscription = this.detalleDocumentoCobranzaService.updateDetalle(this.editingDetalleId, detalleRequest)
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
      const createSubscription = this.detalleDocumentoCobranzaService.createDetalle(detalleRequest)
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

  editarDetalle(detalle: DetalleDocumentoCobranzaResponseDTO): void {
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

    const deleteSubscription = this.detalleDocumentoCobranzaService.deleteDetalle(detalleId)
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
    if (!this.documentoForm.valid || !this.documentoId) {
      return;
    }

    const formValue = this.documentoForm.value;

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

    const updateDTO: DocumentoCobranzaUpdateDTO = {
      fileVenta: formValue.fileVenta?.trim() || '',
      costoEnvio: formValue.costoEnvio || 0,
      observaciones: formValue.observaciones?.trim() || '',
      detalleDocumentoId: detalleDocumentoId,
      sucursalId: formValue.sucursalId || undefined,
      personaJuridicaId: personaJuridicaId,
      formaPagoId: formValue.formaPagoId || undefined
    };

    this.isLoading = true;

    const updateSubscription = this.documentoCobranzaService.updateDocumento(this.documentoId, updateDTO)
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
          if (this.documentoId) {
            this.loadDocumento(this.documentoId);
          }
          this.salirModoEdicion();
        }
      });

    this.subscriptions.add(updateSubscription);
  }

  // ===== UI METHODS =====
  mostrarFormularioEditarDocumento(): void {
    if (this.documento) {
      this.documentoForm.patchValue({
        fileVenta: this.documento.fileVenta || '',
        costoEnvio: this.documento.costoEnvio || 0,
        observaciones: this.documento.observaciones || ''
      });
      this.showDocumentoForm = true;
    }
  }

  cancelarEdicionDocumento(): void {
    this.showDocumentoForm = false;
    this.documentoForm.reset();
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

  irAEditarDocumento(): void {
    this.modoEdicion = true;
    // Cargar opciones de sucursales, documentos del cliente y personas jurídicas
    this.cargarOpcionesEdicion();
    // Populate form with current document data
    if (this.documento) {
      // Determinar el valor del dropdown combinado
      let valorCombinado = null;
      if (this.documento.personaJuridicaId) {
        // Si tiene PersonaJuridica, usar 'pj_ID'
        valorCombinado = 'pj_' + this.documento.personaJuridicaId;
      } else if (this.documento.detalleDocumentoId) {
        // Si tiene DetalleDocumento, usar 'doc_ID'
        valorCombinado = 'doc_' + this.documento.detalleDocumentoId;
      }

      console.log('✏️ Entrando en modo edición, aplicando patchValue...');
      console.log('💳 FormaPagoId a cargar:', this.documento.formaPagoId);

      this.documentoForm.patchValue({
        fileVenta: this.documento.fileVenta || '',
        costoEnvio: this.documento.costoEnvio || 0,
        observaciones: this.documento.observaciones || '',
        detalleDocumentoId: valorCombinado,
        sucursalId: this.documento.sucursalId || null,
        formaPagoId: this.documento.formaPagoId || null
      });
      this.sucursalSeleccionada = this.documento.sucursalId || null;

      console.log('✅ Valor del form después de patchValue:', this.documentoForm.get('formaPagoId')?.value);
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { modo: 'editar' },
      queryParamsHandling: 'merge'
    });
  }

  salirModoEdicion(): void {
    this.modoEdicion = false;
    this.showDetalleForm = false;
    this.showDocumentoForm = false;
    this.documentoForm.reset();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { modo: null },
      queryParamsHandling: 'merge'
    });
  }

  volverADocumentos(): void {
    this.router.navigate(['/documentos-cobranza']);
  }

  recargarDetalles(): void {
    if (this.documentoId) {
      this.loadDetalles(this.documentoId);
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
    const costoEnvio = this.documento?.costoEnvio || 0;
    return totalDetalles + costoEnvio;
  }

  hideMessages(): void {
    this.success = null;
    this.error = null;
  }

  trackByDetalle(index: number, detalle: DetalleDocumentoCobranzaResponseDTO): number {
    return detalle.id || index;
  }

  // ============ OPCIONES DE EDICIÓN =============
  async cargarOpcionesEdicion(): Promise<void> {
    try {
      // Cargar sucursales
      this.sucursales = await this.sucursalService.findAllSucursal().toPromise() || [];

      // Cargar formas de pago
      this.formasPago = await this.formaPagoService.getAllFormasPago().toPromise() || [];

      // Cargar documentos del cliente (DNI, Pasaporte, etc.)
      const personaId = this.documento?.personaId;

      if (personaId) {
        try {
          // Cargar documentos del cliente
          this.documentosCliente = await this.detalleDocumentoService
            .findByPersonaId(personaId)
            .toPromise() || [];

          // Cargar personas jurídicas asociadas (empresas/RUC)
          // El backend tiene PersonaNaturalRepository.findByPersonasId(personaId)
          // que convierte automáticamente de personas.id a persona_natural.id
          const relaciones = await this.naturalJuridicoService
            .findByPersonaNaturalId(personaId)
            .toPromise() || [];

          this.personasJuridicas = relaciones.map(r => r.personaJuridica);
        } catch (error) {
          this.documentosCliente = [];
          this.personasJuridicas = [];
        }
      }
    } catch (error) {
      this.error = 'Error al cargar las opciones de edición';
    }
  }

  // ============ HELPER METHODS =============
  getDetalleDocumentoDisplay(): string {
    const detalleDocId = (this.documento as any)?.detalleDocumentoId;
    if (!detalleDocId) return 'Sin detalle de documento';
    const detalle = this.detallesDocumento.find(d => d.id === detalleDocId);
    if (!detalle) return 'Sin detalle de documento';
    return `${detalle.numero} - ${detalle.documento?.tipo || 'N/A'}`;
  }

  getDetalleDocumentoInfo(id: number): DetalleDocumentoResponse | undefined {
    return this.detallesDocumento.find(d => d.id === id);
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
    const nuevoDetalle: DetalleDocumentoCobranzaResponseDTO = {
      cantidad: formValue.cantidad || 1,
      descripcion: formValue.descripcion || '',
      precio: formValue.precio || 0,
      productoId: formValue.productoId || undefined,
      documentoCobranzaId: this.documentoId || undefined
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
    if (!this.documentoId) {
      this.error = 'No se puede guardar sin un ID de documento';
      return;
    }

    this.isLoading = true;
    this.loadingService.setLoading(true);

    try {
      await this.guardarDocumentoAsync();

      // 2. Actualizar detalles existentes
      for (const detalle of this.detalles) {
        if (detalle.id) {
          const updateDTO: DetalleDocumentoCobranzaRequestDTO = {
            cantidad: detalle.cantidad,
            descripcion: detalle.descripcion || '',
            precio: detalle.precio,
            productoId: detalle.productoId || 0,
            documentoCobranzaId: this.documentoId
          };

          await this.detalleDocumentoCobranzaService.updateDetalle(detalle.id, updateDTO).toPromise();
        }
      }

      // 3. Crear nuevos detalles fijos
      for (const detalleFijo of this.detallesFijos) {
        const createDTO: DetalleDocumentoCobranzaRequestDTO = {
          cantidad: detalleFijo.cantidad,
          descripcion: detalleFijo.descripcion || '',
          precio: detalleFijo.precio,
          productoId: detalleFijo.productoId || 0,
          documentoCobranzaId: this.documentoId
        };

        await this.detalleDocumentoCobranzaService.createDetalle(createDTO).toPromise();
      }

      this.success = 'Cambios guardados correctamente';
      this.detallesFijos = []; // Limpiar detalles temporales
      this.recargarDetalles();
      // Recargar documento completo desde el servidor para evitar caché
      if (this.documentoId) {
        this.loadDocumento(this.documentoId);
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
   * Versión async del guardar documento
   */
  private async guardarDocumentoAsync(): Promise<void> {
    if (!this.documentoForm.valid || !this.documentoId) {
      console.error('Formulario inválido o sin documentoId', {
        valid: this.documentoForm.valid,
        documentoId: this.documentoId,
        errors: this.documentoForm.errors
      });
      return;
    }

    const formValue = this.documentoForm.value;

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

    const updateDTO: DocumentoCobranzaUpdateDTO = {
      fileVenta: formValue.fileVenta?.trim() || '',
      costoEnvio: formValue.costoEnvio || 0,
      observaciones: formValue.observaciones?.trim() || '',
      detalleDocumentoId: detalleDocumentoId,
      sucursalId: formValue.sucursalId || undefined,
      personaJuridicaId: personaJuridicaId,
      formaPagoId: formValue.formaPagoId || undefined
    };

    const response = await this.documentoCobranzaService.updateDocumento(this.documentoId, updateDTO).toPromise();
    if (response) {
      this.documento = response;
    }
  }
}
