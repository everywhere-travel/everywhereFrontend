import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CotizacionConDetallesResponseDTO, CotizacionRequest, CotizacionResponse, CotizacionPatchRequest } from '../../../shared/models/Cotizacion/cotizacion.model';
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

  /**
   * Actualiza una cotización con PATCH (actualización parcial)
   * @param id - ID de la cotización
   * @param cotizacionPatchRequest - Objeto con solo los campos a actualizar (p.ej. { observacion: "nuevo valor" })
   * @returns Observable con la cotización actualizada
   *
   * Ejemplo de uso:
   * cotizacionService.updateCotizacion(1, { observacion: 'Cotización revisada' })
   * cotizacionService.updateCotizacion(1, { cantAdultos: 2, moneda: 'USD' })
   */
  updateCotizacion(id: number, cotizacionPatchRequest: CotizacionPatchRequest): Observable<CotizacionResponse> {
    return this.http.patch<CotizacionResponse>(`${this.apiUrl}/${id}`, cotizacionPatchRequest);
  }

  deleteByIdCotizacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  // NOTE: Relationship setters (setFormaPago, setEstadoCotizacion, setCounter, setSucursal, setPersona)
  // were removed in favor of including relationship IDs in the create/update payloads (POST / PATCH).
  // If you need to use separate endpoints for relationships, reintroduce the methods here.

  actualizarSeleccionesDetalles(cotizacionId: number, detalleSelecciones: {detalleId: number, seleccionado: boolean}[]): Observable<CotizacionResponse> {
    const payload = {
      selecciones: detalleSelecciones
    };
    console.log('🚀 Enviando al backend - URL:', `${this.apiUrl}/${cotizacionId}/detalles/selecciones`);
    console.log('🚀 Enviando al backend - Payload:', payload);

    return this.http.put<CotizacionResponse>(`${this.apiUrl}/${cotizacionId}/detalles/selecciones`, payload);
  }

  getCotizacionSinLiquidacion(): Observable<CotizacionResponse[]> {
    return this.http.get<CotizacionResponse[]>(`${this.apiUrl}/sin-liquidacion`);
  }

}
