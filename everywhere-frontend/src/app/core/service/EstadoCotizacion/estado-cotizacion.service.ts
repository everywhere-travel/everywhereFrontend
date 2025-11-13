import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EstadoCotizacionResponse, EstadoCotizacionRequest } from '../../../shared/models/Cotizacion/estadoCotizacion.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EstadoCotizacionService {
  private apiUrl = `${environment.baseURL}/estados-cotizacion`;

  constructor(private http: HttpClient) {
  }

  createEstadoCotizacion(request: EstadoCotizacionRequest): Observable<EstadoCotizacionResponse> {
    return this.http.post<EstadoCotizacionResponse>(this.apiUrl, request);
  }

  updateEstadoCotizacion(id: number, request: EstadoCotizacionRequest): Observable<EstadoCotizacionResponse> {
    return this.http.patch<EstadoCotizacionResponse>(`${this.apiUrl}/${id}`, request);
  }

  getByIdEstadoCotizacion(id: number): Observable<EstadoCotizacionResponse> {
    return this.http.get<EstadoCotizacionResponse>(`${this.apiUrl}/${id}`);
  }

  getAllEstadosCotizacion(): Observable<EstadoCotizacionResponse[]> {
    return this.http.get<EstadoCotizacionResponse[]>(this.apiUrl);
  }

  deleteByIdEstadoCotizacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
