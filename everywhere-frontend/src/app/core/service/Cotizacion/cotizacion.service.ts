import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CotizacionConDetallesResponseDTO, CotizacionRequest, CotizacionResponse } from '../../../shared/models/Cotizacion/cotizacion.model';
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

  getCotizacionConDetalles(id: number): Observable<CotizacionConDetallesResponseDTO> {
      return this.http.get<CotizacionConDetallesResponseDTO>(`${this.apiUrl}/${id}/con-detalles`);
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

  setPersona(id: number, personaId: number): Observable<CotizacionResponse> {
    return this.http.put<CotizacionResponse>(`${this.apiUrl}/${id}/persona/${personaId}`, {});
  }

  /**
   * Actualiza el estado de selección de múltiples detalles de cotización
   * @param cotizacionId ID de la cotización
   * @param detalleSelecciones Array de objetos con ID del detalle y estado de selección
   */
  actualizarSeleccionesDetalles(cotizacionId: number, detalleSelecciones: {detalleId: number, seleccionado: boolean}[]): Observable<CotizacionResponse> {
    const payload = {
      selecciones: detalleSelecciones
    };
    console.log('🚀 Enviando al backend - URL:', `${this.apiUrl}/${cotizacionId}/detalles/selecciones`);
    console.log('🚀 Enviando al backend - Payload:', payload);

    return this.http.put<CotizacionResponse>(`${this.apiUrl}/${cotizacionId}/detalles/selecciones`, payload);
  }

}
