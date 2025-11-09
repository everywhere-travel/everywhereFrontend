import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ObservacionLiquidacionRequest,ObservacionLiquidacionResponse } from '../../../shared/models/Liquidacion/observacionLiquidacion.model';
import { CacheService } from '../cache.service';

@Injectable({
  providedIn: 'root'
})
export class ObservacionLiquidacionService {
  private apiUrl = `${environment.baseURL}/observaciones-liquidacion`;
  private cacheService = inject(CacheService);

  constructor(private http: HttpClient) {}

  findAll(): Observable<ObservacionLiquidacionResponse[]> {
    return this.http.get<ObservacionLiquidacionResponse[]>(this.apiUrl);
  }

  findById(id: number): Observable<ObservacionLiquidacionResponse> {
    return this.http.get<ObservacionLiquidacionResponse>(`${this.apiUrl}/${id}`);
  }

  create(requestDTO: ObservacionLiquidacionRequest): Observable<ObservacionLiquidacionResponse> {
    return this.http.post<ObservacionLiquidacionResponse>(this.apiUrl, requestDTO).pipe(
      tap((response) => {
        if (response.liquidacion?.id) {
          this.cacheService.invalidatePattern(`/liquidaciones/${response.liquidacion.id}`);
        } else if (requestDTO.liquidacionId) {
          this.cacheService.invalidatePattern(`/liquidaciones/${requestDTO.liquidacionId}`);
        }
      })
    );
  }

  update(id: number, requestDTO: ObservacionLiquidacionRequest): Observable<ObservacionLiquidacionResponse> {
    return this.http.put<ObservacionLiquidacionResponse>(`${this.apiUrl}/${id}`, requestDTO).pipe(
      tap((response) => {
        if (response.liquidacion?.id) {
          this.cacheService.invalidatePattern(`/liquidaciones/${response.liquidacion.id}`);
        }
      })
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.cacheService.invalidatePattern(/\/liquidaciones\/\d+/);
      })
    );
  }

  findByLiquidacionId(liquidacionId: number): Observable<ObservacionLiquidacionResponse[]> {
    return this.http.get<ObservacionLiquidacionResponse[]>(`${this.apiUrl}/liquidacion/${liquidacionId}`);
  }
}
