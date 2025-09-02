import { Injectable } from "@angular/core"
import type { Observable } from "rxjs"
import type { ApiService } from "./api.service"
import type { Liquidacion, DetalleLiquidacion } from "../models/liquidacion.model"

@Injectable({
  providedIn: "root",
})
export class LiquidacionService {
  constructor(private apiService: ApiService) {}

  getLiquidaciones(): Observable<Liquidacion[]> {
    return this.apiService.get<Liquidacion[]>("liquidaciones")
  }

  getLiquidacion(id: number): Observable<Liquidacion> {
    return this.apiService.get<Liquidacion>(`liquidaciones/${id}`)
  }

  createLiquidacion(liquidacion: Liquidacion): Observable<Liquidacion> {
    return this.apiService.post<Liquidacion>("liquidaciones", liquidacion)
  }

  updateLiquidacion(id: number, liquidacion: Liquidacion): Observable<Liquidacion> {
    return this.apiService.put<Liquidacion>(`liquidaciones/${id}`, liquidacion)
  }

  deleteLiquidacion(id: number): Observable<void> {
    return this.apiService.delete<void>(`liquidaciones/${id}`)
  }

  // Detail operations
  getDetalleLiquidacion(liquidacionId: number): Observable<DetalleLiquidacion[]> {
    return this.apiService.get<DetalleLiquidacion[]>(`liquidaciones/${liquidacionId}/detalles`)
  }

  addDetalleLiquidacion(detalle: DetalleLiquidacion): Observable<DetalleLiquidacion> {
    return this.apiService.post<DetalleLiquidacion>("liquidaciones/detalles", detalle)
  }

  // Create liquidation from quotation
  createFromCotizacion(cotizacionId: number): Observable<Liquidacion> {
    return this.apiService.post<Liquidacion>(`liquidaciones/from-cotizacion/${cotizacionId}`, {})
  }

  // Search operations
  searchLiquidaciones(query: string): Observable<Liquidacion[]> {
    return this.apiService.search<Liquidacion[]>("liquidaciones/search", { q: query })
  }
}
