import { Injectable } from "@angular/core"
import type { Observable } from "rxjs"
import type { ApiService } from "./api.service"
import type { Cotizacion, DetalleCotizacion, GrupoHotel } from "../models/cotizacion.model"

@Injectable({
  providedIn: "root",
})
export class CotizacionService {
  constructor(private apiService: ApiService) {}

  getCotizaciones(): Observable<Cotizacion[]> {
    return this.apiService.get<Cotizacion[]>("cotizaciones")
  }

  getCotizacion(id: number): Observable<Cotizacion> {
    return this.apiService.get<Cotizacion>(`cotizaciones/${id}`)
  }

  createCotizacion(cotizacion: Cotizacion): Observable<Cotizacion> {
    return this.apiService.post<Cotizacion>("cotizaciones", cotizacion)
  }

  updateCotizacion(id: number, cotizacion: Cotizacion): Observable<Cotizacion> {
    return this.apiService.put<Cotizacion>(`cotizaciones/${id}`, cotizacion)
  }

  deleteCotizacion(id: number): Observable<void> {
    return this.apiService.delete<void>(`cotizaciones/${id}`)
  }

  // Detalle operations
  getDetalleCotizacion(cotizacionId: number): Observable<DetalleCotizacion[]> {
    return this.apiService.get<DetalleCotizacion[]>(`cotizaciones/${cotizacionId}/detalles`)
  }

  addDetalleCotizacion(detalle: DetalleCotizacion): Observable<DetalleCotizacion> {
    return this.apiService.post<DetalleCotizacion>("cotizaciones/detalles", detalle)
  }

  // Hotel groups
  getGruposHoteles(): Observable<GrupoHotel[]> {
    return this.apiService.get<GrupoHotel[]>("grupos-hoteles")
  }

  // Search operations
  searchCotizaciones(query: string): Observable<Cotizacion[]> {
    return this.apiService.search<Cotizacion[]>("cotizaciones/search", { q: query })
  }
}
