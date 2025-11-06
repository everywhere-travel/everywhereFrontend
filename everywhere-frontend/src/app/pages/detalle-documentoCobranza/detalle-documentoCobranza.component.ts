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
import { DocumentoCobranzaDTO, DocumentoCobranzaResponseDTO, DocumentoCobranzaUpdateDTO } from '../../shared/models/DocumetnoCobranza/documentoCobranza.model';
import {
  DetalleDocumentoCobranzaRequestDTO,
  DetalleDocumentoCobranzaResponseDTO
} from '../../shared/models/DocumetnoCobranza/detalleDocumentoCobranza.model';
import { ProductoResponse } from '../../shared/models/Producto/producto.model';

// Components
import { SidebarComponent, SidebarMenuItem } from '../../shared/components/sidebar/sidebar.component';

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
  private productoService = inject(ProductoService);
  private loadingService = inject(LoadingService);
  private fb = inject(FormBuilder);

  // Data
  documento: DocumentoCobranzaResponseDTO | null = null;
  documentoId: number | null = null;
  detalles: DetalleDocumentoCobranzaResponseDTO[] = [];
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
  allSidebarMenuItems: ExtendedSidebarMenuItem[] = [
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
      moduleKey: 'CLIENTES',
      children: [
        {
          id: 'personas',
          title: 'Clientes',
          icon: 'fas fa-address-card',
          route: '/personas',
          moduleKey: 'PERSONAS'
        },
        {
          id: 'viajeros',
          title: 'Viajeros',
          icon: 'fas fa-passport',
          route: '/viajero',
          moduleKey: 'VIAJEROS'
        },
        {
          id: 'viajeros-frecuentes',
          title: 'Viajeros Frecuentes',
          icon: 'fas fa-crown',
          route: '/viajero-frecuente',
          moduleKey: 'VIAJEROS'
        }
      ]
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
      route: '/documentos-cobranza',
      active: true,
      moduleKey: 'DOCUMENTOS_COBRANZA'
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
          id: 'formas-pago',
          title: 'Forma De Pago',
          icon: 'fas fa-money-bill-wave',
          route: '/formas-pago',
          moduleKey: 'FORMAS_PAGO'
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
          id: 'counters',
          title: 'Counters',
          icon: 'fas fa-users-line',
          route: '/counters',
          moduleKey: 'COUNTERS'
        },
        {
          id: 'sucursales',
          title: 'Sucursales',
          icon: 'fas fa-building',
          route: '/sucursales',
          moduleKey: 'SUCURSALES'
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
          route: '/carpetas',
          moduleKey: 'CARPETAS'
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
      observaciones: ['', [Validators.maxLength(500)]]
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
        }
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
      fileVenta: formValue.fileVenta?.trim() || undefined,
      costoEnvio: formValue.costoEnvio || undefined,
      observaciones: formValue.observaciones?.trim() || undefined
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
    return this.detalles.reduce((total, detalle) => {
      return total + ((detalle.cantidad || 0) * (detalle.precio || 0));
    }, 0);
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
}
