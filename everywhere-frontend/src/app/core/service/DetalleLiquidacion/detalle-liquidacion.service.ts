import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DetalleLiquidacionRequest, DetalleLiquidacionResponse } from '../../../shared/models/Liquidacion/detalleLiquidacion.model';
import { environment} from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DetalleLiquidacionService {
  private apiUrl = `${environment.baseURL}/liquidaciones`;
  constructor(private http: HttpClient) {}

  getAllDetallesLiquidacion(): Observable<DetalleLiquidacionResponse[]> {
    return this.http.get<DetalleLiquidacionResponse[]>(this.apiUrl);
  }

  getDetalleLiquidacionById(id: number): Observable<DetalleLiquidacionResponse> {
    return this.http.get<DetalleLiquidacionResponse>(`${this.apiUrl}/${id}`);
  }

  getDetallesByLiquidacionId(liquidacionId: number): Observable<DetalleLiquidacionResponse[]> {
    return this.http.get<DetalleLiquidacionResponse[]>(`${this.apiUrl}/liquidacion/${liquidacionId}`);
  }

  createDetalleLiquidacion(detalleLiquidacionRequest: DetalleLiquidacionRequest): Observable<DetalleLiquidacionResponse> {
    return this.http.post<DetalleLiquidacionResponse>(this.apiUrl, detalleLiquidacionRequest);
  }

  updateDetalleLiquidacion(id: number, detalleLiquidacionRequest: DetalleLiquidacionRequest): Observable<DetalleLiquidacionResponse> {
    return this.http.put<DetalleLiquidacionResponse>(`${this.apiUrl}/${id}`, detalleLiquidacionRequest);
  }

  deleteDetalleLiquidacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

}
