import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { DetalleCotizacionResponse, DetalleCotizacionRequest, DetalleCotizacionPatchRequest } from '../../../shared/models/Cotizacion/detalleCotizacion.model'
import { environment } from '../../../../environments/environment';
import { CacheService } from '../cache.service';

@Injectable({
  providedIn: 'root'
})
export class DetalleCotizacionService {
  private apiUrl = `${environment.baseURL}/detalles-cotizacion`;
  private cacheService = inject(CacheService);

  constructor(private http: HttpClient) { }

  getAllDetallesCotizacion(): Observable<DetalleCotizacionResponse[]> {
    return this.http.get<DetalleCotizacionResponse[]>(this.apiUrl);
  }

  getByIdDetalleCotizacion(id: number): Observable<DetalleCotizacionResponse> {
    return this.http.get<DetalleCotizacionResponse>(`${this.apiUrl}/${id}`);
  }

  getByCotizacionId(cotizacionId: number): Observable<DetalleCotizacionResponse[]> {
    return this.http.get<DetalleCotizacionResponse[]>(`${this.apiUrl}/cotizacion/${cotizacionId}`);
  }

  createDetalleCotizacion(cotizacionId: number, detalleCotizacionRequest: DetalleCotizacionRequest): Observable<DetalleCotizacionResponse> {
    return this.http.post<DetalleCotizacionResponse>(`${this.apiUrl}/cotizacion/${cotizacionId}`, detalleCotizacionRequest).pipe(
      tap(() => {
        this.cacheService.invalidatePattern(`/cotizaciones/${cotizacionId}/con-detalles`);
      })
    );
  }

  updateDetalleCotizacion(id: number, patchPayload: DetalleCotizacionPatchRequest): Observable<DetalleCotizacionResponse> {
    return this.http.patch<DetalleCotizacionResponse>(`${this.apiUrl}/${id}`, patchPayload).pipe(
      tap((response) => {
        if (response.cotizacion?.id) {
          this.cacheService.invalidatePattern(`/cotizaciones/${response.cotizacion.id}/con-detalles`);
        }
      })
    );
  }

  deleteDetalleCotizacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.cacheService.invalidatePattern(/\/cotizaciones\/\d+\/con-detalles/);
      })
    );
  }

}
