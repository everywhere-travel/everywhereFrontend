import { CotizacionResponse } from './cotizacion.model'
import { ProductoResponse } from '../Producto/producto.model';
import { ProveedorResponse } from '../Proveedor/proveedor.model';
import { CategoriaResponse } from '../Categoria/categoria.model';


/**
 * DTO para crear o actualizar detalles de cotización
 * Todos los campos son opcionales para flexibilidad con PATCH
 */
export interface DetalleCotizacionRequest {
  cantidad?: number;          // ✅ Opcional para flexibilidad
  unidad?: number;           // ✅ Opcional
  descripcion?: string;      // ✅ Opcional
  categoria?: number;        // ✅ Cambio: categoriaId → categoria (número/ID)
  comision?: number;         // ✅ Opcional
  precioHistorico?: number;  // ✅ Opcional
  seleccionado?: boolean;    // ✅ Campo para marcar si está seleccionado
  categoriaId?: number;      // Para compatibilidad con backend DTO
  productoId?: number;       // ✅ ID de producto (enviado en el payload)
  proveedorId?: number;      // ✅ ID de proveedor (enviado en el payload)
}

/**
 * Tipo para PATCH: permite enviar solo los campos que se van a actualizar
 */
export type DetalleCotizacionPatchRequest = Partial<DetalleCotizacionRequest>

export interface DetalleCotizacionResponse {
  id: number
  cantidad?: number
  unidad?: number
  descripcion?: string
  creado?: string
  actualizado?: string
  cotizacion?: CotizacionResponse
  producto?: ProductoResponse
  proveedor?: ProveedorResponse
  categoria?: CategoriaResponse        // ✅ Cambio: categoriaId → categoria (objeto)
  comision?: number
  precioHistorico?: number
  seleccionado?: boolean
}

export interface DetalleCotizacionSimpleDTO{
  id: number;
  cantidad?: number;
  unidad?: number;
  descripcion?: string;
  precioHistorico?: number;
  creado?: string | Date;
  actualizado?: string | Date;
  comision?: number;

  categoria?: CategoriaResponse;
  producto?: ProductoResponse;
  proveedor?: ProveedorResponse;
}
