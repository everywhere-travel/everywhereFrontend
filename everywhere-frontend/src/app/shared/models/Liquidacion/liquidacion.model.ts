import { CarpetaResponse } from '../Carpeta/carpeta.model'
import { CotizacionResponse } from '../Cotizacion/cotizacion.model'
import { FormaPagoResponse } from '../FormaPago/formaPago.model'
import { ProductoResponse } from '../Producto/producto.model'

export interface LiquidacionRequest {
  numero?: string
  fechaCompra?: string
  fechaVencimiento?: string
  destino?: string
  numeroPasajeros?: number
  observacion?: string
  productoId?: number
  formaPagoId?: number
}

export interface LiquidacionResponse {
  id: number
  numero?: string
  fechaCompra?: string
  fechaVencimiento?: string
  destino?: string
  numeroPasajeros?: number
  observacion?: string
  creado?: string
  actualizado?: string
  producto?: ProductoResponse
  formaPago?: FormaPagoResponse
  cotizacion?: CotizacionResponse
  carpeta?: CarpetaResponse
}
