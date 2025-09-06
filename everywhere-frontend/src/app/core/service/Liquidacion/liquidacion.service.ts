import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LiquidacionRequest,  LiquidacionResponse} from '../../../shared/models/Liquidacion/liquidacion.model';
import {environment} from '../../../../environments/environment';
import {
  DetalleLiquidacionResponse, DetalleLiquidacionRequest} from '../../../shared/models/Liquidacion/detalleLiquidacion.model';

@Injectable({
  providedIn: 'root'
})
export class LiquidacionService {

  private apiUrl = `${environment.baseURL}/liquidaciones`;
  constructor(private http: HttpClient) {}

  getAllLiquidaciones(): Observable<LiquidacionResponse[]> {
    return this.http.get<LiquidacionResponse[]>(this.apiUrl);
  }

  getLiquidacionById(id: number): Observable<LiquidacionResponse> {
    return this.http.get<LiquidacionResponse>(`${this.apiUrl}/${id}`);
  }

  createLiquidacion(liquidacionRequest: LiquidacionRequest): Observable<LiquidacionResponse> {
    return this.http.post<LiquidacionResponse>(this.apiUrl, liquidacionRequest);
  }

  updateLiquidacion(id: number, liquidacionRequest: LiquidacionRequest): Observable<LiquidacionResponse> {
    return this.http.put<LiquidacionResponse>(`${this.apiUrl}/${id}`, liquidacionRequest);
  }

  getLiquidacionConDetalles(id: number): Observable<DetalleLiquidacionResponse> {
    return this.http.get<DetalleLiquidacionResponse>(`${this.apiUrl}/${id}/con-detalles`);
  }

  deleteLiquidacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  createLiquidacionConCotizacion(cotizacionId: number, liquidacionRequest: LiquidacionRequest): Observable<LiquidacionResponse> {
    return this.http.post<LiquidacionResponse>(`${this.apiUrl}/cotizacion/${cotizacionId}`, liquidacionRequest);
  }

  setCarpeta(liquidacionId: number, carpetaId: number): Observable<LiquidacionResponse> {
    return this.http.put<LiquidacionResponse>(`${this.apiUrl}/${liquidacionId}/carpeta/${carpetaId}`, {});
  }

}
