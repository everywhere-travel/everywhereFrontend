import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DetalleLiquidacionRequest, DetalleLiquidacionResponse, DetalleLiquidacionSinLiquidacion } from '../../../shared/models/Liquidacion/detalleLiquidacion.model';
import { environment} from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DetalleLiquidacionService {
  private apiUrl = `${environment.baseURL}/detalles-liquidacion`;
  constructor(private http: HttpClient) {}

  getAllDetallesLiquidacion(): Observable<DetalleLiquidacionResponse[]> {
    return this.http.get<DetalleLiquidacionResponse[]>(this.apiUrl);
  }

  getDetalleLiquidacionById(id: number): Observable<DetalleLiquidacionResponse> {
    return this.http.get<DetalleLiquidacionResponse>(`${this.apiUrl}/${id}`);
  }

  getDetallesByLiquidacionId(liquidacionId: number): Observable<DetalleLiquidacionSinLiquidacion[]> {
    return this.http.get<DetalleLiquidacionSinLiquidacion[]>(`${this.apiUrl}/liquidacion/${liquidacionId}`);
  }

  createDetalleLiquidacion(liquidacionId: number, detalleLiquidacionRequest: DetalleLiquidacionRequest): Observable<DetalleLiquidacionResponse> {
    const requestWithLiquidacionId = {
      ...detalleLiquidacionRequest,
      liquidacionId: liquidacionId
    };
    return this.http.post<DetalleLiquidacionResponse>(this.apiUrl, requestWithLiquidacionId);
  }

  updateDetalleLiquidacion(id: number, detalleLiquidacionRequest: DetalleLiquidacionRequest): Observable<DetalleLiquidacionResponse> {
    return this.http.patch<DetalleLiquidacionResponse>(`${this.apiUrl}/${id}`, detalleLiquidacionRequest);
  }

  deleteDetalleLiquidacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

}
