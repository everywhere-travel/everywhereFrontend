import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DetalleCotizacionResponse, DetalleCotizacionRequest } from '../../../shared/models/Cotizacion/detalleCotizacion.model'
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

  updateDetalleCotizacion(id: number, detalleCotizacionRequest: DetalleCotizacionRequest): Observable<DetalleCotizacionResponse> {
    return this.http.put<DetalleCotizacionResponse>(`${this.apiUrl}/${id}`, detalleCotizacionRequest);
  }

  deleteDetalleCotizacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  setCotizacion(detalleId: number, cotizacionId: number): Observable<DetalleCotizacionResponse> {
    return this.http.put<DetalleCotizacionResponse>(`${this.apiUrl}/${detalleId}/cotizacion/${cotizacionId}`, {});
  }

  setProducto(detalleId: number, productoId: number): Observable<DetalleCotizacionResponse> {
    return this.http.put<DetalleCotizacionResponse>(`${this.apiUrl}/${detalleId}/producto/${productoId}`, {});
  }

  setProveedor(detalleId: number, proveedorId: number): Observable<DetalleCotizacionResponse> {
    return this.http.put<DetalleCotizacionResponse>(`${this.apiUrl}/${detalleId}/proveedor/${proveedorId}`, {});
  }


}
