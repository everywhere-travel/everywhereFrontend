import { OperadorResponse } from '../Operador/operador.model'
import { ProveedorResponse } from '../Proveedor/proveedor.model'
import { ViajeroResponse } from '../Viajero/viajero.model'
import { ProductoResponse } from '../Producto/producto.model'
import { LiquidacionResponse } from './liquidacion.model'

export interface DetalleLiquidacionResponse {
  id: number
  ticket?: string
  costoTicket?: number
  cargoServicio?: number
  valorVenta?: number
  facturaCompra?: string
  boletaPasajero?: string
  montoDescuento?: number
  pagoPaxUSD?: number
  pagoPaxPEN?: number
  creado?: string
  actualizado?: string

  liquidacion?: LiquidacionResponse
  viajero?: ViajeroResponse

  producto?: ProductoResponse
  proveedor?: ProveedorResponse
  operador?: OperadorResponse
}

export interface DetalleLiquidacionRequest {
  ticket?: string
  costoTicket?: number
  cargoServicio?: number
  valorVenta?: number
  facturaCompra?: string
  boletaPasajero?: string
  montoDescuento?: number
  pagoPaxUSD?: number
  pagoPaxPEN?: number

  liquidacionId: number
  viajeroId: number
  productoId: number
  proveedorId: number
  operadorId: number
}

export interface DetalleLiquidacionSimple{
  id: number
  ticket?: string
  costoTicket?: number
  cargoServicio?: number
  valorVenta?: number
  facturaCompra?: string
  boletaPasajero?: string
  montoDescuento?: number
  pagoPaxUSD?: number
  pagoPaxPEN?: number

  viajero?: ViajeroResponse
  producto?: ProductoResponse
  proveedor?: ProveedorResponse
  operador?: OperadorResponse
}