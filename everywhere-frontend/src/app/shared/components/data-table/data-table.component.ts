import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, DoCheck } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataTableConfig, DataTableState, TableView } from './data-table.config';
import { DataTableColumn, SortEvent } from './data-table-column.interface';
import { ErrorModalComponent, ErrorModalData } from '../error-modal/error-modal.component';

@Component({
    selector: 'app-data-table',
    standalone: true,
    imports: [CommonModule, FormsModule, ErrorModalComponent],
    templateUrl: './data-table.component.html',
    styleUrls: ['./data-table.component.css']
})
export class DataTableComponent<T = any> implements OnInit, OnChanges, DoCheck {
    // ===== INPUTS =====
    @Input() config!: DataTableConfig<T>;
    @Input() isLoading: boolean = false;

    // ===== OUTPUTS =====
    @Output() selectedItemsChange = new EventEmitter<T[]>();
    @Output() searchChange = new EventEmitter<string>();
    @Output() sortChange = new EventEmitter<SortEvent>();
    @Output() pageChange = new EventEmitter<number>();
    @Output() viewChange = new EventEmitter<TableView>();

    // ===== STATE =====
    state: DataTableState = {
        currentPage: 1,
        itemsPerPage: 10,
        searchTerm: '',
        sortColumn: null,
        sortDirection: null,
        selectedItems: [],
        currentView: 'table'
    };

    // ===== COMPUTED DATA =====
    filteredData: T[] = [];
    paginatedData: T[] = [];
    allSelected = false;
    someSelected = false;

    // ===== UTILITIES =====
    Math = Math;
    private previousDataLength = 0;

    // ===== CONFIRMATION MODAL =====
    showConfirmationModal = false;
    confirmationModalData: ErrorModalData = {
        title: '',
        message: '',
        type: 'warning',
        buttonText: 'Confirmar'
    };
    private pendingAction: { handler: () => void } | null = null;

    ngOnInit(): void {
        this.initializeState();
        this.applyFiltersAndPagination();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['config']) {
            this.applyFiltersAndPagination();
        }
    }

    ngDoCheck(): void {
        // Detectar cambios en config.data incluso si la referencia del config no cambia
        if (this.config && this.config.data) {
            const currentLength = this.config.data.length;
            if (currentLength !== this.previousDataLength) {
                this.previousDataLength = currentLength;
                this.applyFiltersAndPagination();
            }
        }
    }

    // ===== INITIALIZATION =====
    private initializeState(): void {
        this.state.itemsPerPage = this.config.itemsPerPage || 10;
        this.state.currentView = this.config.defaultView || 'table';
    }

    // ===== SEARCH =====
    onSearchChange(searchTerm: string): void {
        this.state.searchTerm = searchTerm;
        this.state.currentPage = 1;
        this.applyFiltersAndPagination();
        this.searchChange.emit(searchTerm);
    }

    clearSearch(): void {
        this.state.searchTerm = '';
        this.onSearchChange('');
    }

    // ===== FILTERING AND SORTING =====
    private applyFiltersAndPagination(): void {
        console.log('🔍 applyFiltersAndPagination called');
        if (!this.config || !this.config.data) {
            console.log('❌ No config or data');
            this.filteredData = [];
            this.paginatedData = [];
            return;
        }

        console.log('📊 Config data length:', this.config.data.length);

        // 1. Filter
        this.filteredData = this.filterData();
        console.log('📋 Filtered data length:', this.filteredData.length);

        // 2. Sort
        if (this.state.sortColumn && this.state.sortDirection) {
            this.filteredData = this.sortData(this.filteredData);
        }

        // 3. Paginate
        if (this.config.enablePagination !== false) {
            this.paginatedData = this.paginateData(this.filteredData);
        } else {
            this.paginatedData = this.filteredData;
        }

        console.log('📄 Paginated data length:', this.paginatedData.length);

        // Update selection state
        this.updateSelectionState();
    }

    private filterData(): T[] {
        if (!this.state.searchTerm.trim()) {
            return [...this.config.data];
        }

        const term = this.state.searchTerm.toLowerCase();

        // Use custom filter if provided
        if (this.config.customFilter) {
            return this.config.data.filter(item => this.config.customFilter!(item, term));
        }

        // Default filtering: search in all column values
        return this.config.data.filter(item => {
            return this.config.columns.some(column => {
                if (column.visible === false) return false;

                const value = this.getNestedValue(item, column.key);
                if (value === null || value === undefined) return false;

                return String(value).toLowerCase().includes(term);
            });
        });
    }

    private sortData(data: T[]): T[] {
        if (!this.state.sortColumn) return data;

        const sorted = [...data].sort((a, b) => {
            const aVal = this.getNestedValue(a, this.state.sortColumn!);
            const bVal = this.getNestedValue(b, this.state.sortColumn!);

            if (aVal === bVal) return 0;
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            const comparison = aVal < bVal ? -1 : 1;
            return this.state.sortDirection === 'asc' ? comparison : -comparison;
        });

        return sorted;
    }

    private paginateData(data: T[]): T[] {
        const start = (this.state.currentPage - 1) * this.state.itemsPerPage;
        const end = start + this.state.itemsPerPage;
        return data.slice(start, end);
    }

    // ===== SORTING =====
    onSort(column: DataTableColumn<T>): void {
        if (!column.sortable || this.config.enableSorting === false) return;

        if (this.state.sortColumn === column.key) {
            // Toggle direction
            if (this.state.sortDirection === 'asc') {
                this.state.sortDirection = 'desc';
            } else if (this.state.sortDirection === 'desc') {
                this.state.sortColumn = null;
                this.state.sortDirection = null;
            }
        } else {
            this.state.sortColumn = column.key;
            this.state.sortDirection = 'asc';
        }

        this.applyFiltersAndPagination();
        this.sortChange.emit({
            column: this.state.sortColumn || '',
            direction: this.state.sortDirection
        });
    }

    // ===== PAGINATION =====
    get totalPages(): number {
        return Math.ceil(this.filteredData.length / this.state.itemsPerPage);
    }

    get totalItems(): number {
        return this.filteredData.length;
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.state.currentPage = page;
            this.applyFiltersAndPagination();
            this.pageChange.emit(page);
        }
    }

    onItemsPerPageChange(): void {
        this.state.currentPage = 1;
        this.applyFiltersAndPagination();
    }

    getVisiblePages(): number[] {
        const total = this.totalPages;
        const current = this.state.currentPage;
        const delta = 2;
        const pages: number[] = [];

        if (total <= 7) {
            for (let i = 1; i <= total; i++) {
                pages.push(i);
            }
        } else {
            if (current <= 4) {
                for (let i = 1; i <= 5; i++) pages.push(i);
                pages.push(-1, total);
            } else if (current >= total - 3) {
                pages.push(1, -1);
                for (let i = total - 4; i <= total; i++) pages.push(i);
            } else {
                pages.push(1, -1);
                for (let i = current - 1; i <= current + 1; i++) pages.push(i);
                pages.push(-1, total);
            }
        }

        return pages;
    }

    // ===== SELECTION =====
    toggleSelection(item: T): void {
        const trackByKey = this.config.trackByKey || 'id';
        const itemKey = (item as any)[trackByKey];
        const index = this.state.selectedItems.findIndex(i => (i as any)[trackByKey] === itemKey);

        if (index > -1) {
            this.state.selectedItems.splice(index, 1);
        } else {
            this.state.selectedItems.push(item);
        }

        this.updateSelectionState();
        this.selectedItemsChange.emit(this.state.selectedItems);
    }

    toggleAllSelection(): void {
        if (this.allSelected) {
            this.state.selectedItems = [];
        } else {
            this.state.selectedItems = [...this.paginatedData];
        }

        this.updateSelectionState();
        this.selectedItemsChange.emit(this.state.selectedItems);
    }

    isSelected(item: T): boolean {
        const trackByKey = this.config.trackByKey || 'id';
        const itemKey = (item as any)[trackByKey];
        return this.state.selectedItems.some(i => (i as any)[trackByKey] === itemKey);
    }

    clearSelection(): void {
        this.state.selectedItems = [];
        this.updateSelectionState();
        this.selectedItemsChange.emit(this.state.selectedItems);
    }

    private updateSelectionState(): void {
        const total = this.paginatedData.length;
        const selected = this.state.selectedItems.filter(item => {
            const trackByKey = this.config.trackByKey || 'id';
            const itemKey = (item as any)[trackByKey];
            return this.paginatedData.some(p => (p as any)[trackByKey] === itemKey);
        }).length;

        this.allSelected = selected === total && total > 0;
        this.someSelected = selected > 0 && selected < total;
    }

    // ===== VIEW SWITCHING =====
    changeView(view: TableView): void {
        this.state.currentView = view;
        this.viewChange.emit(view);
    }

    // ===== ACTIONS =====
    executeAction(action: any, item: T): void {
        if (action.confirm) {
            // Mostrar modal de confirmación
            this.confirmationModalData = {
                title: action.confirm.title,
                message: action.confirm.message,
                type: 'warning',
                buttonText: action.label || 'Confirmar'
            };
            this.pendingAction = { handler: () => action.handler(item) };
            this.showConfirmationModal = true;
        } else {
            action.handler(item);
        }
    }

    executeBulkAction(action: any): void {
        if (this.state.selectedItems.length === 0) return;

        if (action.confirm) {
            // Mostrar modal de confirmación
            this.confirmationModalData = {
                title: action.confirm.title,
                message: `${action.confirm.message}\n\nItems seleccionados: ${this.state.selectedItems.length}`,
                type: 'warning',
                buttonText: action.label || 'Confirmar'
            };
            this.pendingAction = { handler: () => action.handler(this.state.selectedItems) };
            this.showConfirmationModal = true;
        } else {
            action.handler(this.state.selectedItems);
        }
    }

    // ===== UTILITIES =====
    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, prop) => current?.[prop], obj);
    }

    getCellValue(item: T, column: DataTableColumn<T>): any {
        const value = this.getNestedValue(item, column.key);

        // Custom render function
        if (column.render) {
            return column.render(item, value);
        }

        // Type-based rendering
        switch (column.type) {
            case 'date':
                return this.formatDate(value, column.format);
            case 'currency':
                return this.formatCurrency(value, column.format);
            case 'number':
                return value?.toLocaleString() || '0';
            case 'boolean':
                return value ? 'Sí' : 'No';
            default:
                return value || '';
        }
    }

    private formatDate(dateString: string | undefined, format?: string): string {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    private formatCurrency(amount: number | undefined, currency: string = 'PEN'): string {
        if (amount === undefined || amount === null) return currency === 'USD' ? '$0.00' : 'S/ 0.00';
        const symbol = currency === 'USD' ? '$' : 'S/';
        return `${symbol} ${amount.toFixed(2)}`;
    }

    getRowClass(item: T): string {
        if (!this.config || !this.config.rowClass) return '';
        if (typeof this.config.rowClass === 'string') {
            return this.config.rowClass;
        }
        return this.config.rowClass(item);
    }

    trackByFn(index: number, item: T): any {
        if (!this.config) return index;
        const trackByKey = this.config.trackByKey || 'id';
        return (item as any)[trackByKey] || index;
    }

    shouldShowAction(action: any, item: T): boolean {
        if (action.show) {
            return action.show(item);
        }
        return true;
    }

    isActionDisabled(action: any, item: T): boolean {
        if (action.disabled) {
            return action.disabled(item);
        }
        return false;
    }

    get visibleColumns(): DataTableColumn<T>[] {
        if (!this.config || !this.config.columns) return [];
        return this.config.columns.filter(col => col.visible !== false);
    }

    get pageSizeOptions(): number[] {
        if (!this.config) return [5, 10, 25, 50];
        return this.config.pageSizeOptions || [5, 10, 25, 50];
    }

    // ===== MODAL HANDLERS =====
    onConfirmModalAction(): void {
        if (this.pendingAction) {
            this.pendingAction.handler();
            this.pendingAction = null;
        }
        this.showConfirmationModal = false;
    }

    onCancelModalAction(): void {
        this.pendingAction = null;
        this.showConfirmationModal = false;
    }
}
