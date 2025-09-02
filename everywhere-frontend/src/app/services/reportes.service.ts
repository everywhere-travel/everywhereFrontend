import { Injectable } from "@angular/core"
import { type Observable, of } from "rxjs"

export interface FiltrosReporte {
  fechaInicio: string
  fechaFin: string
  estado?: string
  moneda?: string
  cliente?: string
  producto?: string
}

export interface ReporteCotizaciones {
  id: number
  numero: string
  cliente: string
  fecha: string
  estado: string
  moneda: string
  total: number
  comision: number
  productos: string[]
}

export interface ReporteLiquidaciones {
  id: number
  numero: string
  cotizacion: string
  cliente: string
  fecha: string
  moneda: string
  total: number
  pagado: number
  pendiente: number
  estado: string
}

export interface AnalisisRentabilidad {
  periodo: string
  ingresos: number
  costos: number
  utilidad: number
  margen: number
}

export interface TendenciasVentas {
  mes: string
  cotizaciones: number
  liquidaciones: number
  ingresos: number
  crecimiento: number
}

@Injectable({
  providedIn: "root",
})
export class ReportesService {
  constructor() {}

  getCotizacionesReporte(filtros: FiltrosReporte): Observable<ReporteCotizaciones[]> {
    const reportes: ReporteCotizaciones[] = [
      {
        id: 1,
        numero: "COT-2024-001",
        cliente: "Juan Pérez",
        fecha: "2024-01-15",
        estado: "Completada",
        moneda: "USD",
        total: 2500,
        comision: 250,
        productos: ["Hotel Premium", "Tour Ciudad"],
      },
      {
        id: 2,
        numero: "COT-2024-002",
        cliente: "María García",
        fecha: "2024-01-18",
        estado: "Pendiente",
        moneda: "EUR",
        total: 3200,
        comision: 320,
        productos: ["Crucero Mediterráneo", "Excursiones"],
      },
      {
        id: 3,
        numero: "COT-2024-003",
        cliente: "Empresa ABC S.A.",
        fecha: "2024-01-20",
        estado: "Aprobada",
        moneda: "USD",
        total: 15000,
        comision: 1500,
        productos: ["Paquete Corporativo", "Transporte Ejecutivo"],
      },
    ]
    return of(reportes)
  }

  getLiquidacionesReporte(filtros: FiltrosReporte): Observable<ReporteLiquidaciones[]> {
    const reportes: ReporteLiquidaciones[] = [
      {
        id: 1,
        numero: "LIQ-2024-001",
        cotizacion: "COT-2024-001",
        cliente: "Juan Pérez",
        fecha: "2024-01-16",
        moneda: "USD",
        total: 2500,
        pagado: 2500,
        pendiente: 0,
        estado: "Pagada",
      },
      {
        id: 2,
        numero: "LIQ-2024-002",
        cotizacion: "COT-2024-003",
        cliente: "Empresa ABC S.A.",
        fecha: "2024-01-22",
        moneda: "USD",
        total: 15000,
        pagado: 7500,
        pendiente: 7500,
        estado: "Parcial",
      },
    ]
    return of(reportes)
  }

  getAnalisisRentabilidad(): Observable<AnalisisRentabilidad[]> {
    const analisis: AnalisisRentabilidad[] = [
      { periodo: "Enero 2024", ingresos: 45000, costos: 32000, utilidad: 13000, margen: 28.9 },
      { periodo: "Febrero 2024", ingresos: 52000, costos: 35000, utilidad: 17000, margen: 32.7 },
      { periodo: "Marzo 2024", ingresos: 48000, costos: 33000, utilidad: 15000, margen: 31.3 },
    ]
    return of(analisis)
  }

  getTendenciasVentas(): Observable<TendenciasVentas[]> {
    const tendencias: TendenciasVentas[] = [
      { mes: "Ene", cotizaciones: 24, liquidaciones: 18, ingresos: 45000, crecimiento: 12.5 },
      { mes: "Feb", cotizaciones: 28, liquidaciones: 22, ingresos: 52000, crecimiento: 15.6 },
      { mes: "Mar", cotizaciones: 26, liquidaciones: 20, ingresos: 48000, crecimiento: -7.7 },
      { mes: "Abr", cotizaciones: 32, liquidaciones: 25, ingresos: 58000, crecimiento: 20.8 },
    ]
    return of(tendencias)
  }

  exportarReporte(
    tipo: "cotizaciones" | "liquidaciones",
    formato: "pdf" | "excel",
    filtros: FiltrosReporte,
  ): Observable<string> {
    const fileName = `reporte_${tipo}_${new Date().getTime()}.${formato}`
    return of(fileName)
  }
}
