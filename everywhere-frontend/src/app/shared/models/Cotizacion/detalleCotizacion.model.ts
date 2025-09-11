import { CotizacionResponse } from './cotizacion.model'
import { ProductoResponse } from '../Producto/producto.model';
import { ProveedorResponse } from '../Proveedor/proveedor.model';


export interface DetalleCotizacionRequest {
  cantidad?: number
  unidad?: number
  descripcion?: string
  categoriaId?: number
  comision?: number
  precioHistorico?: number

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
  categoriaId?: number
  comision?: number
  precioHistorico?: number
}
