import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PagoPaxRequest, PagoPaxResponse } from '../../../shared/models/PagoPax/pagoPax.model.ts';

@Injectable({
  providedIn: 'root'
})
export class PagoPaxService {
  private baseURL = `${environment.baseURL}/pagos-pax`;
  private http = inject(HttpClient);

  constructor() { }

  /**
   * Crear un nuevo pago pax
   */
  create(request: PagoPaxRequest): Observable<PagoPaxResponse> {
    return this.http.post<PagoPaxResponse>(this.baseURL, request);
  }

  /**
   * Obtener todos los pagos pax
   */
  findAll(): Observable<PagoPaxResponse[]> {
    return this.http.get<PagoPaxResponse[]>(this.baseURL);
  }

  /**
   * Obtener un pago pax por ID
   */
  findById(id: number): Observable<PagoPaxResponse> {
    return this.http.get<PagoPaxResponse>(`${this.baseURL}/${id}`);
  }

  /**
   * Obtener todos los pagos pax de una liquidación
   */
  findByLiquidacionId(liquidacionId: number): Observable<PagoPaxResponse[]> {
    return this.http.get<PagoPaxResponse[]>(`${this.baseURL}/liquidacion/${liquidacionId}`);
  }

  /**
   * Actualizar un pago pax existente
   */
  update(id: number, request: PagoPaxRequest): Observable<PagoPaxResponse> {
    return this.http.patch<PagoPaxResponse>(`${this.baseURL}/${id}`, request);
  }

  /**
   * Eliminar un pago pax
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseURL}/${id}`);
  }
}
