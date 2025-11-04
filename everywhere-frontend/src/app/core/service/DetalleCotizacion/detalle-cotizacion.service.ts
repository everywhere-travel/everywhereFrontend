import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DetalleCotizacionResponse, DetalleCotizacionRequest, DetalleCotizacionPatchRequest } from '../../../shared/models/Cotizacion/detalleCotizacion.model'
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DetalleCotizacionService {
  private apiUrl = `${environment.baseURL}/detalles-cotizacion`;

  constructor(private http: HttpClient) { }

  getAllDetallesCotizacion(): Observable<DetalleCotizacionResponse[]> {
    return this.http.get<DetalleCotizacionResponse[]>(this.apiUrl);
  }

  getByIdDetalleCotizacion(id: number): Observable<DetalleCotizacionResponse> {
    return this.http.get<DetalleCotizacionResponse>(`${this.apiUrl}/${id}`);
  }

  getByCotizacionId(cotizacionId: number): Observable<DetalleCotizacionResponse[]> {
    return this.http.get<DetalleCotizacionResponse[]>(`${this.apiUrl}/cotizacion/${cotizacionId}`);
  }

  createDetalleCotizacion(cotizacionId: number, detalleCotizacionRequest: DetalleCotizacionRequest): Observable<DetalleCotizacionResponse> {
    return this.http.post<DetalleCotizacionResponse>(`${this.apiUrl}/cotizacion/${cotizacionId}`, detalleCotizacionRequest);
  }

  /**
   * Actualiza un detalle de cotización con PATCH (payloads parciales)
   * 
   * @param id ID del detalle a actualizar
   * @param patchPayload Contiene solo los campos a actualizar
   * @returns Observable con la respuesta actualizada
   * 
   * @example
   * // Actualizar solo cantidad y descripción
   * updateDetalleCotizacion(1, { cantidad: 5, descripcion: 'Nuevo valor' })
   * 
   * // Actualizar producto y proveedor
   * updateDetalleCotizacion(1, { productoId: 10, proveedorId: 20 })
   * 
   * // Marcar como seleccionado
   * updateDetalleCotizacion(1, { seleccionado: true })
   */
  updateDetalleCotizacion(id: number, patchPayload: DetalleCotizacionPatchRequest): Observable<DetalleCotizacionResponse> {
    return this.http.patch<DetalleCotizacionResponse>(`${this.apiUrl}/${id}`, patchPayload);
  }

  deleteDetalleCotizacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

}
