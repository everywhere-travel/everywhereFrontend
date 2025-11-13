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
import { AuthServiceService } from '../../core/service/auth/auth.service';

// Models
import { DocumentoCobranzaResponseDTO, DocumentoCobranzaUpdateDTO } from '../../shared/models/DocumetnoCobranza/documentoCobranza.model';
import {
  DetalleDocumentoCobranzaRequestDTO,
  DetalleDocumentoCobranzaResponseDTO
} from '../../shared/models/DocumetnoCobranza/detalleDocumentoCobranza.model';
import { ProductoResponse } from '../../shared/models/Producto/producto.model';

// Components
import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';
import { DetalleDocumentoService } from '../../core/service/DetalleDocumento/detalle-documento.service';
import { DetalleDocumentoResponse } from '../../shared/models/Documento/detalleDocumento.model';
import { PersonaNaturalService } from '../../core/service';

// Extender la interfaz para agregar moduleKey
interface ExtendedSidebarMenuItem extends SidebarMenuItem {
  moduleKey?: string;
  children?: ExtendedSidebarMenuItem[];
}

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

  // Data
  documento: DocumentoCobranzaResponseDTO | null = null;
  documentoId: number | null = null;
  detalles: DetalleDocumentoCobranzaResponseDTO[] = [];
  detallesDocumento: DetalleDocumentoResponse[] = [];
  productos: ProductoResponse[] = [];

  // Forms
  detalleForm: FormGroup;
  documentoForm: FormGroup;

  // UI State
  isLoading = false;
  error: string | null = null;
  success: string | null = null;
  sidebarCollapsed = false;
  modoEdicion = false;
  showDetalleForm = false;
  showDocumentoForm = false;
  editingDetalleId: number | null = null;

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
      active: true,
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
  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];

  private subscriptions = new Subscription();
  private authService = inject(AuthServiceService);

  constructor() {
    this.detalleForm = this.fb.group({
      cantidad: [1, [Validators.required, Validators.min(1)]],
      descripcion: ['', [Validators.required, Validators.maxLength(255)]],
      precio: [0, [Validators.required, Validators.min(0)]],
      productoId: [null]
    });

    this.documentoForm = this.fb.group({
      fileVenta: ['', [Validators.maxLength(100)]],
      costoEnvio: [0, [Validators.min(0)]],
      observaciones: ['', [Validators.maxLength(500)]],
      detalleDocumentoId: [null]
    });
  }

  ngOnInit(): void {
    this.initializeSidebar();
    this.loadDocumentoFromRoute();
    this.loadProductos();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // =================================================================
  // SIDEBAR FILTERING
  // =================================================================

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
    this.loadDetalles(this.documentoId);
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
          this.documento = documento;
          this.loadDetallesDocumento();
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
    const updateDTO: DocumentoCobranzaUpdateDTO = {
      fileVenta: formValue.fileVenta?.trim() || '',
      costoEnvio: formValue.costoEnvio || 0,
      observaciones: formValue.observaciones?.trim() || '',
      detalleDocumentoId: formValue.detalleDocumentoId || undefined
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
          this.documento = response;
          this.cancelarEdicionDocumento();
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
  getProductoNombre(productoId: number | undefined): string {
    if (!productoId) return 'Sin producto';
    const producto = this.productos.find(p => p.id === productoId);
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

  // ===== SIDEBAR METHODS =====
  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onSidebarItemClick(item: SidebarMenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  trackByDetalle(index: number, detalle: DetalleDocumentoCobranzaResponseDTO): number {
    return detalle.id || index;
  }

  // ============ HELPER METHODS =============
  getDetalleDocumentoInfo(id: number): DetalleDocumentoResponse | undefined {
    return this.detallesDocumento.find(d => d.id === id);
  }

  onDetalleDocumentoChange(event: any): void {
    const detalleId = event.target.value;
    if (detalleId) {
      const detalle = this.getDetalleDocumentoInfo(Number(detalleId));
    }
  }
}
