import { Injectable } from "@angular/core"
import { type Observable, of } from "rxjs"

export interface EstadisticasGenerales {
  cotizacionesActivas: number
  cotizacionesCompletadas: number
  liquidacionesPendientes: number
  liquidacionesCompletadas: number
  personasRegistradas: number
  productosDisponibles: number
  ventasMensual: number
  ventasAnual: number
}

export interface VentasPorMes {
  mes: string
  ventas: number
  cotizaciones: number
}

export interface EstadoCotizaciones {
  estado: string
  cantidad: number
  porcentaje: number
}

export interface TopProductos {
  nombre: string
  ventas: number
  ingresos: number
}

@Injectable({
  providedIn: "root",
})
export class EstadisticasService {
  constructor() {}

  getEstadisticasGenerales(): Observable<EstadisticasGenerales> {
    const stats: EstadisticasGenerales = {
      cotizacionesActivas: Math.floor(Math.random() * 50) + 20,
      cotizacionesCompletadas: Math.floor(Math.random() * 200) + 150,
      liquidacionesPendientes: Math.floor(Math.random() * 15) + 5,
      liquidacionesCompletadas: Math.floor(Math.random() * 180) + 120,
      personasRegistradas: Math.floor(Math.random() * 300) + 200,
      productosDisponibles: Math.floor(Math.random() * 100) + 80,
      ventasMensual: Math.floor(Math.random() * 50000) + 30000,
      ventasAnual: Math.floor(Math.random() * 500000) + 300000,
    }
    return of(stats)
  }

  getVentasPorMes(): Observable<VentasPorMes[]> {
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    const data = meses.map((mes) => ({
      mes,
      ventas: Math.floor(Math.random() * 80000) + 20000,
      cotizaciones: Math.floor(Math.random() * 50) + 10,
    }))
    return of(data)
  }

  getEstadoCotizaciones(): Observable<EstadoCotizaciones[]> {
    const estados = [
      { estado: "Pendiente", cantidad: 24, porcentaje: 35 },
      { estado: "En Proceso", cantidad: 18, porcentaje: 26 },
      { estado: "Aprobada", cantidad: 15, porcentaje: 22 },
      { estado: "Completada", cantidad: 12, porcentaje: 17 },
    ]
    return of(estados)
  }

  getTopProductos(): Observable<TopProductos[]> {
    const productos = [
      { nombre: "Paquete Caribe Premium", ventas: 45, ingresos: 125000 },
      { nombre: "Tour Europa Clásico", ventas: 38, ingresos: 98000 },
      { nombre: "Aventura Amazónica", ventas: 32, ingresos: 76000 },
      { nombre: "Crucero Mediterráneo", ventas: 28, ingresos: 84000 },
      { nombre: "Safari Africano", ventas: 22, ingresos: 67000 },
    ]
    return of(productos)
  }

  getIngresosPorMoneda(): Observable<{ moneda: string; monto: number }[]> {
    return of([
      { moneda: "USD", monto: 245000 },
      { moneda: "EUR", monto: 180000 },
      { moneda: "PEN", monto: 95000 },
      { moneda: "COP", monto: 67000 },
    ])
  }
}
