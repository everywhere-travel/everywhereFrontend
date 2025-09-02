export interface Liquidacion {
  id?: number
  cotizacionId: number
  numero: string
  fechaLiquidacion: Date
  viajeroId: number
  operadorId?: number
  proveedorId?: number
  numeroTicket?: string
  costoServicio: number
  cargoServicio: number
  valorVenta: number
  numeroFactura?: string
  numeroRecibo?: string
  descuento: number
  pagoSoles: number
  pagoDolares: number
  pagoEuros: number
  observaciones?: string
  cargoAdicional: number
  total: number
  estado: string
  fechaCreacion?: Date
  fechaActualizacion?: Date
}

export interface DetalleLiquidacion {
  id?: number
  liquidacionId: number
  productoId: number
  cantidad: number
  precioUnitario: number
  subtotal: number
  descripcion?: string
}
