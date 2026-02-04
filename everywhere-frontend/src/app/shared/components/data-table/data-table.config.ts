import { DataTableColumn } from './data-table-column.interface';

/**
 * Vista de visualización de la tabla
 */
export type TableView = 'table' | 'cards' | 'list';

/**
 * Configuración de una acción de la tabla
 */
export interface DataTableAction<T = any> {
    /**
     * Icono Font Awesome (ej: 'fa-eye', 'fa-edit')
     */
    icon: string;

    /**
     * Texto del botón/tooltip
     */
    label: string;

    /**
     * Color del botón
     */
    color: 'green' | 'blue' | 'red' | 'indigo' | 'yellow' | 'purple' | 'gray';

    /**
     * Función que se ejecuta al hacer click
     */
    handler: (item: T) => void;

    /**
     * Condición para mostrar la acción (opcional)
     * Si retorna false, la acción no se muestra para ese item
     */
    show?: (item: T) => boolean;

    /**
     * Si la acción está deshabilitada
     */
    disabled?: (item: T) => boolean;

    /**
     * Confirmación antes de ejecutar la acción
     */
    confirm?: {
        title: string;
        message: string;
    };
}

/**
 * Configuración de acciones masivas
 */
export interface BulkAction<T = any> {
    icon: string;
    label: string;
    color: 'blue' | 'red' | 'green' | 'yellow';
    handler: (items: T[]) => void;
    confirm?: {
        title: string;
        message: string;
    };
}

/**
 * Configuración completa de la tabla
 */
export interface DataTableConfig<T = any> {
    // ===== DATOS =====
    /**
     * Array de datos a mostrar
     */
    data: T[];

    /**
     * Configuración de las columnas
     */
    columns: DataTableColumn<T>[];

    /**
     * Clave única para identificar cada fila (tracking)
     * @default 'id'
     */
    trackByKey?: string;

    // ===== FEATURES =====
    /**
     * Habilitar búsqueda
     * @default true
     */
    enableSearch?: boolean;

    /**
     * Placeholder del input de búsqueda
     */
    searchPlaceholder?: string;

    /**
     * Habilitar selección múltiple
     * @default false
     */
    enableSelection?: boolean;

    /**
     * Habilitar paginación
     * @default true
     */
    enablePagination?: boolean;

    /**
     * Habilitar cambio de vista (table/cards/list)
     * @default true
     */
    enableViewSwitcher?: boolean;

    /**
     * Habilitar ordenamiento de columnas
     * @default true
     */
    enableSorting?: boolean;

    // ===== PAGINACIÓN =====
    /**
     * Número de items por página
     * @default 10
     */
    itemsPerPage?: number;

    /**
     * Opciones de items por página
     * @default [5, 10, 25, 50]
     */
    pageSizeOptions?: number[];

    // ===== ACCIONES =====
    /**
     * Acciones por fila
     */
    actions?: DataTableAction<T>[];

    /**
     * Acciones masivas (para items seleccionados)
     */
    bulkActions?: BulkAction<T>[];

    // ===== PERSONALIZACIÓN =====
    /**
     * Clase CSS adicional para cada fila
     */
    rowClass?: string | ((item: T) => string);

    /**
     * Mensaje cuando no hay datos
     * @default 'No se encontraron registros'
     */
    emptyMessage?: string;

    /**
     * Mensaje durante la carga
     * @default 'Cargando datos...'
     */
    loadingMessage?: string;

    /**
     * Vista por defecto
     * @default 'table'
     */
    defaultView?: TableView;

    /**
     * Mostrar índice de fila (#)
     * @default false
     */
    showRowIndex?: boolean;

    /**
     * Habilitar hover en las filas
     * @default true
     */
    enableRowHover?: boolean;

    /**
     * Función para filtrado personalizado
     * Si se proporciona, se usa en lugar del filtrado por defecto
     */
    customFilter?: (item: T, searchTerm: string) => boolean;
}

/**
 * Estado interno de la tabla
 */
export interface DataTableState {
    currentPage: number;
    itemsPerPage: number;
    searchTerm: string;
    sortColumn: string | null;
    sortDirection: 'asc' | 'desc' | null;
    selectedItems: any[];
    currentView: TableView;
}
