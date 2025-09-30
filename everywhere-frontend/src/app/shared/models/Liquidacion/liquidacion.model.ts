import { CarpetaResponse } from '../Carpeta/carpeta.model'
import { CotizacionResponse } from '../Cotizacion/cotizacion.model'
import { FormaPagoResponse } from '../FormaPago/formaPago.model'
import { ProductoResponse } from '../Producto/producto.model'
import { DetalleLiquidacionSimple } from './detalleLiquidacion.model'
import { ObservacionLiquidacionSimple } from './observacionLiquidacion.model'

export interface LiquidacionRequest {
  numero?: string
  fechaCompra?: string 
  destino?: string
  numeroPasajeros?: number 
  productoId?: number
  formaPagoId?: number
}

export interface LiquidacionResponse {
  id: number
  numero?: string
  fechaCompra?: string 
  destino?: string
  numeroPasajeros?: number 
  creado?: string
  actualizado?: string
  
  cotizacion?: CotizacionResponse
  producto?: ProductoResponse
  formaPago?: FormaPagoResponse
  carpeta?: CarpetaResponse
}

export interface LiquidacionConDetallesResponse {
  id: number
  numero?: string
  fechaCompra?: string 
  destino?: string
  numeroPasajeros?: number 
  creado?: string
  actualizado?: string

  producto?: ProductoResponse
  formaPago?: FormaPagoResponse
  
  detalles?: DetalleLiquidacionSimple[]
  observaciones?: ObservacionLiquidacionSimple[]
}