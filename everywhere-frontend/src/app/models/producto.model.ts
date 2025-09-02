export interface Producto {
  id?: number
  codigo: string
  nombre: string
  descripcion?: string
  categoria: string
  precio: number
  moneda: string
  proveedorId?: number
  operadorId?: number
  activo: boolean
  fechaCreacion?: Date
  fechaActualizacion?: Date
}

export interface Proveedor {
  id?: number
  nombre: string
  contacto?: string
  telefono?: string
  email?: string
  direccion?: string
}

export interface Operador {
  id?: number
  nombre: string
  codigo?: string
  contacto?: string
  telefono?: string
  email?: string
}
