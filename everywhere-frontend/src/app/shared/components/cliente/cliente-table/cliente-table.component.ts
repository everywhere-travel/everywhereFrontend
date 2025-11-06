import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface PersonaTabla {
  id: number;
  tipo: 'natural' | 'juridica';
  nombre: string;
  nombres?: string;
  apellidosPaterno?: string;
  apellidosMaterno?: string;
  razonSocial?: string;
  documento: string;
  ruc?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
}

@Component({
  selector: 'app-cliente-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cliente-table.component.html',
  styleUrls: ['./cliente-table.component.css']
})
export class ClienteTableComponent implements OnInit, OnChanges {
  // Inputs
  @Input() clientes: PersonaTabla[] = [];
  @Input() isLoading: boolean = false;

  // Outputs
  @Output() verCliente = new EventEmitter<PersonaTabla>();
  @Output() editarCliente = new EventEmitter<PersonaTabla>();
  @Output() eliminarCliente = new EventEmitter<PersonaTabla>();
  @Output() eliminarMasivo = new EventEmitter<number[]>();
  @Output() refrescar = new EventEmitter<void>();

  // Estado interno
  currentView: 'table' | 'cards' | 'list' = 'table';
  searchQuery: string = '';
  filtroTipo: 'todos' | 'natural' | 'juridica' = 'todos';
  sortColumn: string = 'nombre';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Selección múltiple
  selectedItems: number[] = [];
  allSelected: boolean = false;
  someSelected: boolean = false;

  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 10;

  // Modal confirmación
  mostrarModalEliminar: boolean = false;
  clienteAEliminar: PersonaTabla | null = null;

  // Datos filtrados y paginados
  clientesFiltrados: PersonaTabla[] = [];

  // Math para template
  Math = Math;

  ngOnInit(): void {
    this.aplicarFiltros();
  }

  ngOnChanges(): void {
    this.aplicarFiltros();
  }

  // ===== FILTROS Y BÚSQUEDA =====
  aplicarFiltros(): void {
    let resultado = [...this.clientes];

    // Filtro por tipo
    if (this.filtroTipo !== 'todos') {
      resultado = resultado.filter(c => c.tipo === this.filtroTipo);
    }

    // Filtro por búsqueda
    if (this.searchQuery.trim()) {
      const term = this.searchQuery.toLowerCase();
      resultado = resultado.filter(c => {
        const searchText = `${c.nombre} ${c.documento} ${c.email || ''} ${c.telefono || ''}`.toLowerCase();
        return searchText.includes(term);
      });
    }

    this.clientesFiltrados = resultado;
    this.aplicarOrdenamiento();
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.aplicarFiltros();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.aplicarFiltros();
  }

  aplicarFiltroTipo(tipo: string): void {
    this.filtroTipo = tipo as 'todos' | 'natural' | 'juridica';
    this.currentPage = 1;
    this.aplicarFiltros();
  }

  clearAllFilters(): void {
    this.searchQuery = '';
    this.filtroTipo = 'todos';
    this.aplicarFiltros();
  }

  // ===== ORDENAMIENTO =====
  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.aplicarOrdenamiento();
  }

  private aplicarOrdenamiento(): void {
    this.clientesFiltrados.sort((a, b) => {
      let valorA: any;
      let valorB: any;

      switch (this.sortColumn) {
        case 'tipo':
          valorA = a.tipo;
          valorB = b.tipo;
          break;
        case 'nombre':
          valorA = a.nombre.toLowerCase();
          valorB = b.nombre.toLowerCase();
          break;
        case 'documento':
          valorA = a.documento || '';
          valorB = b.documento || '';
          break;
        default:
          return 0;
      }

      if (valorA < valorB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valorA > valorB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // ===== VISTAS =====
  changeView(view: 'table' | 'cards' | 'list'): void {
    this.currentView = view;
  }

  // ===== ACCIONES =====
  onVerCliente(cliente: PersonaTabla): void {
    this.verCliente.emit(cliente);
  }

  onEditarCliente(cliente: PersonaTabla): void {
    this.editarCliente.emit(cliente);
  }

  confirmarEliminar(cliente: PersonaTabla): void {
    this.clienteAEliminar = cliente;
    this.mostrarModalEliminar = true;
  }

  confirmarEliminacionModal(): void {
    if (this.clienteAEliminar) {
      this.eliminarCliente.emit(this.clienteAEliminar);
      this.cerrarModalEliminar();
    }
  }

  eliminarSeleccionados(): void {
    if (this.selectedItems.length === 0) return;

    const confirmMessage = `¿Está seguro de eliminar ${this.selectedItems.length} cliente${this.selectedItems.length > 1 ? 's' : ''}?\n\nEsta acción no se puede deshacer.`;

    if (confirm(confirmMessage)) {
      this.eliminarMasivo.emit([...this.selectedItems]);
      this.clearSelection();
    }
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.clienteAEliminar = null;
  }

  refreshData(): void {
    this.refrescar.emit();
  }

  // ===== SELECCIÓN MÚLTIPLE =====
  toggleSelection(id: number): void {
    const index = this.selectedItems.indexOf(id);
    if (index > -1) {
      this.selectedItems.splice(index, 1);
    } else {
      this.selectedItems.push(id);
    }
    this.actualizarEstadoSeleccion();
  }

  toggleAllSelection(): void {
    if (this.allSelected) {
      this.selectedItems = [];
    } else {
      this.selectedItems = this.paginatedClientes.map(c => c.id);
    }
    this.actualizarEstadoSeleccion();
  }

  isSelected(id: number): boolean {
    return this.selectedItems.includes(id);
  }

  private actualizarEstadoSeleccion(): void {
    const total = this.paginatedClientes.length;
    const selected = this.selectedItems.length;
    this.allSelected = selected === total && total > 0;
    this.someSelected = selected > 0 && selected < total;
  }

  clearSelection(): void {
    this.selectedItems = [];
    this.actualizarEstadoSeleccion();
  }

  // ===== PAGINACIÓN =====
  get paginatedClientes(): PersonaTabla[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.clientesFiltrados.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.clientesFiltrados.length / this.itemsPerPage);
  }

  get totalItems(): number {
    return this.clientesFiltrados.length;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
  }

  getVisiblePages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 2;
    const start = Math.max(1, current - delta);
    const end = Math.min(total, current + delta);

    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // ===== UTILIDADES =====
  getClientInitials(cliente: PersonaTabla): string {
    if (cliente.tipo === 'natural') {
      const nombres = cliente.nombres || '';
      const paterno = cliente.apellidosPaterno || '';
      const materno = cliente.apellidosMaterno || '';
      return (nombres.charAt(0) + paterno.charAt(0) + materno.charAt(0)).toUpperCase();
    }
    const razon = cliente.razonSocial || '';
    return razon.substring(0, 2).toUpperCase();
  }

  getDocumentType(cliente: PersonaTabla): string {
    return cliente.tipo === 'natural' ? 'DNI/Documento' : 'RUC';
  }

  getPersonaTypeLabel(tipo: string): string {
    return tipo === 'natural' ? 'Natural' : 'Jurídica';
  }

  isClienteVIP(cliente: PersonaTabla): boolean {
    return cliente.tipo === 'natural' && (cliente as any).categoria === 'VIP';
  }

  trackByClienteId(index: number, cliente: PersonaTabla): number {
    return cliente.id;
  }

  // Estadísticas
  get estadisticas() {
    return {
      totalNaturales: this.clientes.filter(c => c.tipo === 'natural').length,
      totalJuridicas: this.clientes.filter(c => c.tipo === 'juridica').length
    };
  }
}
