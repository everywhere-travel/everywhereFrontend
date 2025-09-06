import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CotizacionRequest, CotizacionResponse } from '../../../shared/models/Cotizacion/cotizacion.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CotizacionService {
  private apiUrl = `${environment.baseURL}/cotizaciones`;

  constructor(private http: HttpClient) { }

  createCotizacion(cotizacionRequest: CotizacionRequest): Observable<CotizacionResponse> {
    return this.http.post<CotizacionResponse>(this.apiUrl, cotizacionRequest);
  }

  createCotizacionWithPersona(personaId: number, cotizacionRequest: CotizacionRequest): Observable<CotizacionResponse> {
    return this.http.post<CotizacionResponse>(`${this.apiUrl}/persona/${personaId}`, cotizacionRequest);
  }

  getByIdCotizacion(id: number): Observable<CotizacionResponse> {
    return this.http.get<CotizacionResponse>(`${this.apiUrl}/${id}`);
  }

  getAllCotizaciones(): Observable<CotizacionResponse[]> {
    return this.http.get<CotizacionResponse[]>(this.apiUrl);
  }

  updateCotizacion(id: number, cotizacionRequest: CotizacionRequest): Observable<CotizacionResponse> {
    return this.http.put<CotizacionResponse>(`${this.apiUrl}/${id}`, cotizacionRequest);
  }

  deleteByIdCotizacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  setFormaPago(id: number, formaPagoId: number): Observable<CotizacionResponse> {
    return this.http.put<CotizacionResponse>(`${this.apiUrl}/${id}/forma-pago/${formaPagoId}`, {});
  }

  setEstadoCotizacion(id: number, estadoId: number): Observable<CotizacionResponse> {
    return this.http.put<CotizacionResponse>(`${this.apiUrl}/${id}/estado/${estadoId}`, {});
  }

  setCounter(id: number, counterId: number): Observable<CotizacionResponse> {
    return this.http.put<CotizacionResponse>(`${this.apiUrl}/${id}/counter/${counterId}`, {});
  }

  setSucursal(id: number, sucursalId: number): Observable<CotizacionResponse> {
    return this.http.put<CotizacionResponse>(`${this.apiUrl}/${id}/sucursal/${sucursalId}`, {});
  }


}
