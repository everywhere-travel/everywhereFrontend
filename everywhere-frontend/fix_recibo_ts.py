# -*- coding: utf-8 -*-
import re

ts_path = 'src/app/pages/recibo/recibo.component.ts'

with open(ts_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
imports_to_add = '''import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { DataTableConfig } from '../../shared/components/data-table/data-table.config';

interface ReciboTabla {
  id: number;
  numero: string;
  codigoCotizacion: string;
  clienteNombre: string;
  fechaEmision: string;
  moneda: string;
  fileVenta: string;
  createdAt: string;
  updatedAt: string;
  reciboOriginal: ReciboResponseDTO;
}
'''
content = content.replace("import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';", "import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';\n" + imports_to_add)

# Update @Component imports
content = content.replace('imports: [CommonModule, ReactiveFormsModule, FormsModule, SidebarComponent]', 'imports: [CommonModule, ReactiveFormsModule, FormsModule, SidebarComponent, DataTableComponent]')

# Remove selection state
content = re.sub(r'// ===== SELECTION STATE =====.*?allSelected.*?someSelected.*?// ===== SEARCH AND FILTERS =====', '// ===== SEARCH AND FILTERS =====', content, flags=re.DOTALL)
content = re.sub(r'selectedItems: number\[\] = \[\];\s*allSelected: boolean = false;\s*someSelected: boolean = false;', '', content)

# Remove old PAGINATION and replace with new state
new_pagination = '''// ===== DATA TABLE CONFIGURATION =====
  recibosTabla: ReciboTabla[] = [];
  currentPage = 1;
  pageSize = 10;
  sortColumn = 'id';
  sortDirection = 'desc';

  tableConfig: DataTableConfig<ReciboTabla> = {
    data: [],
    columns: [
      { key: 'numero', header: 'Número', icon: 'fa-hashtag', sortable: true, width: '150px' },
      { key: 'codigoCotizacion', header: 'Cotización', icon: 'fa-file-alt', sortable: true },
      { key: 'clienteNombre', header: 'Cliente', icon: 'fa-user', sortable: true },
      { key: 'fechaEmision', header: 'Fecha Emisión', icon: 'fa-calendar', sortable: true },
      { key: 'moneda', header: 'Moneda', icon: 'fa-money-bill', sortable: true, align: 'center', width: '100px' }
    ],
    enableSearch: true,
    searchPlaceholder: 'Buscar por número, cotización, cliente...',
    enableSelection: false,
    enablePagination: true,
    serverSidePagination: true,
    totalServerItems: 0,
    enableViewSwitcher: true,
    enableSorting: true,
    itemsPerPage: 10,
    pageSizeOptions: [5, 10, 25, 50],
    actions: [
      { icon: 'fa-eye', label: 'Ver', color: 'green', handler: (item) => this.verDetalleDocumento(item.reciboOriginal) },
      { icon: 'fa-edit', label: 'Editar', color: 'blue', handler: (item) => this.editarDocumento(item.reciboOriginal) },
      { icon: 'fa-file-pdf', label: 'Ver', color: 'gray', handler: (item) => this.verPDF(item.reciboOriginal) },
      { icon: 'fa-download', label: 'Descargar', color: 'purple', handler: (item) => this.descargarPDF(item.reciboOriginal) }
    ],
    bulkActions: [],
    emptyMessage: 'No se encontraron recibos',
    loadingMessage: 'Cargando recibos...',
    defaultView: 'table',
    enableRowHover: true,
    trackByKey: 'id'
  };

  // ===== SEARCH AND FILTERS ====='''
content = re.sub(r'// ===== PAGINATION =====.*?// ===== MESSAGES =====', new_pagination + '\n  // ===== MESSAGES =====', content, flags=re.DOTALL)

# Remove the searchForm setup
content = re.sub(r"this\.searchForm\.get\('searchTerm'\)\?\.valueChanges\.subscribe.*?\}\);", '', content, flags=re.DOTALL)

# Replace loadRecibos
load_recibos = '''private async loadRecibos(setLoading: boolean = false): Promise<void> {
    try {
      if (setLoading) {
        this.loading = true;
        this.isLoading = true;
      }

      const response = await this.reciboService.getRecibosPage(
        this.currentPage - 1,
        this.pageSize,
        this.sortColumn,
        this.sortDirection,
        this.searchTerm
      ).toPromise();

      if (response) {
        this.recibos = response.content || [];
        this.filteredRecibos = [...this.recibos];
        this.totalItems = response.totalElements;
        this.updateTableConfig();
      }
    } catch (error) {
      console.error('Error al cargar recibos:', error);
      this.showError('Error al cargar los recibos');
      this.recibos = [];
    } finally {
      if (setLoading) {
        this.loading = false;
        this.isLoading = false;
      }
    }
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadRecibos();
  }

  onSortChange(sort: { column: string, direction: 'asc' | 'desc' | null }): void {
    if (sort.direction) {
      this.sortColumn = sort.column;
      this.sortDirection = sort.direction;
    } else {
      this.sortColumn = 'id';
      this.sortDirection = 'desc';
    }
    this.loadRecibos();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
    this.loadRecibos();
  }

  private updateTableConfig(): void {
    this.recibosTabla = this.filteredRecibos.map((rec) => ({
      id: rec.id || 0,
      numero: this.getNumeroRecibo(rec),
      codigoCotizacion: rec.codigoCotizacion || 'Sin cotización',
      clienteNombre: rec.clienteNombre || 'Sin nombre',
      fechaEmision: this.formatDate(rec.fechaEmision),
      moneda: rec.moneda || 'USD',
      fileVenta: rec.fileVenta || 'Sin file',
      createdAt: this.formatDateTime((rec as any).createdAt),
      updatedAt: this.formatDateTime((rec as any).updatedAt),
      reciboOriginal: rec,
    }));

    this.tableConfig = {
      ...this.tableConfig,
      data: this.recibosTabla,
      totalServerItems: this.totalItems
    };
  }
'''
content = re.sub(r'private async loadRecibos\(setLoading: boolean = false\): Promise<void> \{.*?\}\n  \}', load_recibos, content, flags=re.DOTALL)

# Delete old search and filter
content = re.sub(r'// ===== SEARCH AND FILTER =====.*?// ===== VIEW METHODS =====', '// ===== VIEW METHODS =====', content, flags=re.DOTALL)

# Delete old pagination
content = re.sub(r'// ===== PAGINATION =====.*?// ===== SIDEBAR METHODS =====', '// ===== SIDEBAR METHODS =====', content, flags=re.DOTALL)
content = re.sub(r'// ===== SELECTION METHODS =====.*?// ===== SIDEBAR METHODS =====', '// ===== SIDEBAR METHODS =====', content, flags=re.DOTALL)


with open(ts_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('TS updated!')
