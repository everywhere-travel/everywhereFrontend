import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LiquidacionConDetallesResponse, LiquidacionRequest,  LiquidacionResponse} from '../../../shared/models/Liquidacion/liquidacion.model';
import {environment} from '../../../../environments/environment';
import { CacheService } from '../cache.service';

@Injectable({
  providedIn: 'root'
})
export class LiquidacionService {

  private apiUrl = `${environment.baseURL}/liquidaciones`;
  private cacheService = inject(CacheService);

  constructor(private http: HttpClient) {}

  getAllLiquidaciones(): Observable<LiquidacionResponse[]> {
    return this.http.get<LiquidacionResponse[]>(this.apiUrl);
  }

  getLiquidacionById(id: number): Observable<LiquidacionResponse> {
    return this.http.get<LiquidacionResponse>(`${this.apiUrl}/${id}`);
  }

  createLiquidacion(liquidacionRequest: LiquidacionRequest): Observable<LiquidacionResponse> {
    return this.http.post<LiquidacionResponse>(this.apiUrl, liquidacionRequest).pipe(
      tap(() => this.cacheService.invalidateModule('liquidaciones'))
    );
  }

  updateLiquidacion(id: number, liquidacionRequest: LiquidacionRequest): Observable<LiquidacionResponse> {
    return this.http.patch<LiquidacionResponse>(`${this.apiUrl}/${id}`, liquidacionRequest).pipe(
      tap(() => this.cacheService.invalidateModule('liquidaciones'))
    );
  }

  getLiquidacionConDetalles(id: number): Observable<LiquidacionConDetallesResponse> {
    return this.http.get<LiquidacionConDetallesResponse>(`${this.apiUrl}/${id}/con-detalles`);
  }

  deleteLiquidacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.cacheService.invalidateModule('liquidaciones'))
    );
  }

  createLiquidacionConCotizacion(cotizacionId: number, liquidacionRequest: LiquidacionRequest): Observable<LiquidacionResponse> {
    return this.http.post<LiquidacionResponse>(`${this.apiUrl}/cotizacion/${cotizacionId}`, liquidacionRequest).pipe(
      tap(() => this.cacheService.invalidateModule('liquidaciones'))
    );
  }
}
