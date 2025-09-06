import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ObservacionLiquidacionRequest,ObservacionLiquidacionResponse } from '../../../shared/models/Liquidacion/observacionLiquidacion.model';

@Injectable({
  providedIn: 'root'
})
export class ObservacionLiquidacionService {
  private apiUrl = `${environment.baseURL}/observaciones-liquidacion`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<ObservacionLiquidacionResponse[]> {
    return this.http.get<ObservacionLiquidacionResponse[]>(this.apiUrl);
  }

  findById(id: number): Observable<ObservacionLiquidacionResponse> {
    return this.http.get<ObservacionLiquidacionResponse>(`${this.apiUrl}/${id}`);
  }

  create(requestDTO: ObservacionLiquidacionRequest): Observable<ObservacionLiquidacionResponse> {
    return this.http.post<ObservacionLiquidacionResponse>(this.apiUrl, requestDTO);
  }

  update(id: number, requestDTO: ObservacionLiquidacionRequest): Observable<ObservacionLiquidacionResponse> {
    return this.http.put<ObservacionLiquidacionResponse>(`${this.apiUrl}/${id}`, requestDTO);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  findByLiquidacionId(liquidacionId: number): Observable<ObservacionLiquidacionResponse[]> {
    return this.http.get<ObservacionLiquidacionResponse[]>(`${this.apiUrl}/liquidacion/${liquidacionId}`);
  }


}
