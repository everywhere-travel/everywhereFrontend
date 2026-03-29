import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  HistorialCotizacionRequest,
  HistorialCotizacionResponse,
  HistorialCotizacionSimple
} from '../../../shared/models/Cotizacion/historialCotizacion.model';
import { CacheService } from '../cache.service';

@Injectable({
  providedIn: 'root'
})
export class HistorialCotizacionService {
  private apiUrl = `${environment.baseURL}/historial-cotizaciones`;
  private cacheService = inject(CacheService);

  constructor(private http: HttpClient) {}

  findAll(): Observable<HistorialCotizacionResponse[]> {
    return this.http.get<HistorialCotizacionResponse[]>(this.apiUrl);
  }

  findById(id: number): Observable<HistorialCotizacionResponse> {
    return this.http.get<HistorialCotizacionResponse>(`${this.apiUrl}/${id}`);
  }

  findByCotizacionId(cotizacionId: number): Observable<HistorialCotizacionSimple[]> {
    return this.http.get<HistorialCotizacionSimple[]>(`${this.apiUrl}/cotizacion/${cotizacionId}`);
  }

  create(request: HistorialCotizacionRequest): Observable<HistorialCotizacionResponse> {
    return this.http.post<HistorialCotizacionResponse>(this.apiUrl, request).pipe(
      tap((response) => {
        const cotizacionId = response.cotizacionId ?? request.cotizacionId;
        if (cotizacionId) {
          this.cacheService.invalidatePattern(`/cotizaciones/${cotizacionId}`);
        }
      })
    );
  }

  update(id: number, request: HistorialCotizacionRequest): Observable<HistorialCotizacionResponse> {
    return this.http.patch<HistorialCotizacionResponse>(`${this.apiUrl}/${id}`, request).pipe(
      tap((response) => {
        if (response.cotizacionId) {
          this.cacheService.invalidatePattern(`/cotizaciones/${response.cotizacionId}`);
        }
      })
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.cacheService.invalidateModule('cotizaciones');
      })
    );
  }
}
