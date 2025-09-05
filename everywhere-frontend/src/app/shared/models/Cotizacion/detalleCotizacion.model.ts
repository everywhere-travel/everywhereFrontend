import { CotizacionResponse } from './cotizacion.model'
import { ProductoResponse } from '../Producto/producto.model';
import { ProveedorResponse } from '../Proveedor/proveedor.model';


export interface DetalleCotizacionRequest {
  cantidad?: number
  unidad?: number
  descripcion?: string
}

export interface DetalleCotizacionResponse {
  id: number
  cantidad?: number
  unidad?: number
  descripcion?: string
  precioHistorico?: number
  creado?: string
  actualizado?: string
  cotizacion?: CotizacionResponse
  producto?: ProductoResponse
  proveedor?: ProveedorResponse
}
