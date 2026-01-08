import { TemplateRef } from '@angular/core';

/**
 * Tipos de datos soportados para las columnas
 */
export type ColumnType = 'text' | 'number' | 'date' | 'currency' | 'badge' | 'boolean' | 'custom';

/**
 * Alineación del contenido de la columna
 */
export type ColumnAlign = 'left' | 'center' | 'right';

/**
 * Configuración de una columna de la tabla
 * @template T - Tipo de dato del elemento de la tabla
 */
export interface DataTableColumn<T = any> {
    /**
     * Clave única de la columna (corresponde a la propiedad del objeto)
     * Soporta dot notation para propiedades anidadas: 'persona.nombre'
     */
    key: string;

    /**
     * Título que se mostrará en el header de la columna
     */
    header: string;

    /**
     * Icono que se mostrará en el header de la columna
     */
    icon?: string;

    /**
     * Tipo de dato de la columna (afecta el renderizado)
     * @default 'text'
     */
    type?: ColumnType;

    /**
     * Alineación del contenido
     * @default 'left'
     */
    align?: ColumnAlign;

    /**
     * Ancho de la columna (CSS width)
     * Ejemplo: '100px', '20%', 'auto'
     */
    width?: string;

    /**
     * Si la columna es ordenable
     * @default true
     */
    sortable?: boolean;

    /**
     * Si la columna es visible
     * @default true
     */
    visible?: boolean;

    /**
     * Clase CSS adicional para la columna
     */
    cssClass?: string;

    /**
     * Función personalizada para renderizar el valor
     * Si se proporciona, se usa en lugar del renderizado por tipo
     */
    render?: (item: T, value: any) => string;

    /**
     * Template personalizado de Angular para la celda
     * Tiene prioridad sobre render() y type
     */
    cellTemplate?: TemplateRef<any>;

    /**
     * Template personalizado para el header
     */
    headerTemplate?: TemplateRef<any>;

    /**
     * Formato específico para el tipo de columna
     * - Para 'date': formato de fecha (ej: 'dd/MM/yyyy')
     * - Para 'currency': código de moneda (ej: 'PEN', 'USD')
     */
    format?: string;

    /**
     * Tooltip que se muestra al pasar el mouse sobre el header
     */
    tooltip?: string;
}

/**
 * Configuración de badge para columnas tipo 'badge'
 */
export interface BadgeConfig {
    value: string | number;
    label: string;
    color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray' | 'indigo';
}

/**
 * Resultado del ordenamiento de columna
 */
export interface SortEvent {
    column: string;
    direction: 'asc' | 'desc' | null;
}
