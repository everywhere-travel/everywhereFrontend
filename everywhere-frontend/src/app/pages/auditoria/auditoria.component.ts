import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { MenuConfigService, ExtendedSidebarMenuItem } from '../../core/service/menu/menu-config.service';
import { AuditoriaService, AuditoriaFilterParams } from '../../core/service/auditoria/auditoria.service';
import { AuditoriaItem, AuditoriaDetalle, AuditoriaStats } from '../../core/models/auditoria/auditoria.model';

interface ParsedDiffItem {
  campo: string;
  antes: any;
  ahora: any;
}

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SidebarComponent
  ],
  templateUrl: './auditoria.component.html',
  styleUrls: ['./auditoria.component.css']
})
export class AuditoriaComponent implements OnInit {

  private router = inject(Router);
  private auditoriaService = inject(AuditoriaService);
  private menuConfigService = inject(MenuConfigService);

  // Sidebar
  sidebarCollapsed = false;
  sidebarMenuItems: ExtendedSidebarMenuItem[] = [];

  // Datos
  auditorias: AuditoriaItem[] = [];
  tablasDisponibles: string[] = [];
  stats: AuditoriaStats = {
    totalEventos: 0,
    eventosHoy: 0,
    creaciones: 0,
    modificaciones: 0,
    eliminaciones: 0,
    consultas: 0
  };

  // Estados de carga
  loading = false;
  loadingModal = false;

  // Filtros
  searchTerm = '';
  selectedTabla = '';
  selectedAccion = '';
  fechaInicio = '';
  fechaFin = '';

  // Paginación
  currentPage = 0;
  pageSize = 15;
  totalElements = 0;
  totalPages = 0;

  // Modal de Detalle / Diff
  modalAbierto = false;
  detalleSeleccionado: AuditoriaDetalle | null = null;
  parsedDiffList: ParsedDiffItem[] = [];
  activeModalTab: 'diff' | 'previo' | 'nuevo' = 'diff';

  ngOnInit(): void {
    this.sidebarMenuItems = this.menuConfigService.getMenuItems('/audit');
    this.cargarTablas();
    this.cargarEstadisticas();
    this.cargarAuditorias();
  }

  // Manejo de Sidebar
  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onSidebarItemClick(item: ExtendedSidebarMenuItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  // Carga de datos
  cargarAuditorias(): void {
    this.loading = true;

    const filters: AuditoriaFilterParams = {
      page: this.currentPage,
      size: this.pageSize
    };

    if (this.searchTerm.trim()) filters.search = this.searchTerm.trim();
    if (this.selectedTabla) filters.tabla = this.selectedTabla;
    if (this.selectedAccion) filters.accion = this.selectedAccion;
    if (this.fechaInicio) filters.fechaInicio = `${this.fechaInicio}T00:00:00`;
    if (this.fechaFin) filters.fechaFin = `${this.fechaFin}T23:59:59`;

    this.auditoriaService.getAuditorias(filters).subscribe({
      next: (res) => {
        this.auditorias = res.content || [];
        this.totalElements = res.totalElements || 0;
        this.totalPages = res.totalPages || 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar logs de auditoría:', err);
        this.loading = false;
      }
    });
  }

  cargarTablas(): void {
    this.auditoriaService.getTablas().subscribe({
      next: (tablas) => {
        this.tablasDisponibles = tablas || [];
      },
      error: (err) => console.error('Error al cargar tablas:', err)
    });
  }

  cargarEstadisticas(): void {
    this.auditoriaService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (err) => console.error('Error al cargar estadísticas:', err)
    });
  }

  // Filtros y acciones
  aplicarFiltros(): void {
    this.currentPage = 0;
    this.cargarAuditorias();
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.selectedTabla = '';
    this.selectedAccion = '';
    this.fechaInicio = '';
    this.fechaFin = '';
    this.currentPage = 0;
    this.cargarAuditorias();
  }

  cambiarPagina(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.cargarAuditorias();
    }
  }

  // Ver Detalle / Modal
  abrirDetalle(item: AuditoriaItem): void {
    this.modalAbierto = true;
    this.loadingModal = true;
    this.activeModalTab = 'diff';
    this.parsedDiffList = [];
    this.detalleSeleccionado = null;

    this.auditoriaService.getDetalle(item.id).subscribe({
      next: (detalle) => {
        this.detalleSeleccionado = detalle;
        this.parsearDiff(detalle.cambiosDiff);
        this.loadingModal = false;
      },
      error: (err) => {
        console.error('Error al obtener detalle de auditoría:', err);
        this.loadingModal = false;
      }
    });
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.detalleSeleccionado = null;
    this.parsedDiffList = [];
  }

  private parsearDiff(diffStr?: string): void {
    this.parsedDiffList = [];
    if (!diffStr) return;

    try {
      const obj = JSON.parse(diffStr);
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (val && typeof val === 'object' && ('antes' in val || 'ahora' in val)) {
          this.parsedDiffList.push({
            campo: key,
            antes: val.antes !== undefined ? this.formatValue(val.antes) : '(vacío)',
            ahora: val.ahora !== undefined ? this.formatValue(val.ahora) : '(vacío)'
          });
        }
      }
    } catch {
      // Si no es JSON estándar con antes/ahora, se muestra como texto
    }
  }

  formatJson(jsonStr?: string): string {
    if (!jsonStr) return 'Sin datos';
    try {
      return JSON.stringify(JSON.parse(jsonStr), null, 2);
    } catch {
      return jsonStr;
    }
  }

  private formatValue(val: any): string {
    if (val === null || val === undefined) return 'null';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  }

  // Helpers de visualización
  getBadgeClass(accion: string): string {
    switch (accion?.toUpperCase()) {
      case 'CREACION':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'MODIFICACION':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ELIMINACION':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'CONSULTA':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  formatFecha(fechaStr: string): string {
    if (!fechaStr) return '-';
    try {
      const date = new Date(fechaStr);
      return date.toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return fechaStr;
    }
  }
}
