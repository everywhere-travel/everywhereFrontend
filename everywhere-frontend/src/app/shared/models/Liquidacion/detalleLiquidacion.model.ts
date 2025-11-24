import { OperadorResponse } from '../Operador/operador.model'
import { ProveedorResponse } from '../Proveedor/proveedor.model'
import { ViajeroResponse, ViajeroConPersonaNatural } from '../Viajero/viajero.model'
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
  viajero?: ViajeroConPersonaNatural

  producto?: ProductoResponse
  proveedor?: ProveedorResponse
  operador?: OperadorResponse
}

export interface DetalleLiquidacionRequest {
  liquidacionId?: number    // Requerido para creación (se agrega automáticamente en servicio)
  ticket?: string
  costoTicket?: number
  cargoServicio?: number
  valorVenta?: number
  facturaCompra?: string
  boletaPasajero?: string
  montoDescuento?: number
  pagoPaxUSD?: number
  pagoPaxPEN?: number

  // Campos opcionales - se pueden asignar después en edición
  viajeroId?: number    // Opcional
  productoId?: number   // Opcional
  proveedorId?: number  // Opcional
  operadorId?: number   // Opcional
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

  viajero?: ViajeroConPersonaNatural
  producto?: ProductoResponse
  proveedor?: ProveedorResponse
  operador?: OperadorResponse
}

export interface DetalleLiquidacionSinLiquidacion{
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

  viajero?: ViajeroConPersonaNatural
  producto?: ProductoResponse
  proveedor?: ProveedorResponse
  operador?: OperadorResponse
}
