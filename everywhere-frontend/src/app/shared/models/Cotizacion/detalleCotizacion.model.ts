import { CotizacionResponse } from './cotizacion.model'
import { ProductoResponse } from '../Producto/producto.model';
import { ProveedorResponse } from '../Proveedor/proveedor.model';
import { CategoriaResponse } from '../Categoria/categoria.model';


export interface DetalleCotizacionRequest {
  cantidad?: number;          // ✅ Opcional para flexibilidad
  unidad?: number;           // ✅ Opcional
  descripcion?: string;      // ✅ Opcional
  categoria?: number;        // ✅ Cambio: categoriaId → categoria
  comision?: number;         // ✅ Opcional
  precioHistorico?: number;  // ✅ Opcional
  seleccionado?: boolean;    // ✅ Campo para marcar si está seleccionado
}

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
  categoria?: CategoriaResponse        // ✅ Cambio: categoriaId → categoria
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
