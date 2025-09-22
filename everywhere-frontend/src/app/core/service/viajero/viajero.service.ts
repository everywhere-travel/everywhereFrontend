import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ViajeroRequest, ViajeroResponse } from '../../../shared/models/Viajero/viajero.model';

@Injectable({
  providedIn: 'root'
})
export class ViajeroService {
  private baseURL = `${environment.baseURL}/viajeros`;
  private http = inject(HttpClient);

  constructor() { }

  /**
   * Obtiene todos los viajeros
   */
  findAll(): Observable<ViajeroResponse[]> {
    return this.http.get<ViajeroResponse[]>(this.baseURL);
  }

  /**
   * Obtiene un viajero por ID
   */
  findById(id: number): Observable<ViajeroResponse> {
    return this.http.get<ViajeroResponse>(`${this.baseURL}/${id}`);
  }

  /**
   * Busca viajeros por nombres
   */
  findByNombres(nombres: string): Observable<ViajeroResponse[]> {
    const params = new HttpParams().set('nombres', nombres);
    return this.http.get<ViajeroResponse[]>(`${this.baseURL}/nombres`, { params });
  }

  /**
   * Busca viajeros por número de documento
   */
  findByNumeroDocumento(numeroDocumento: string): Observable<ViajeroResponse[]> {
    const params = new HttpParams().set('numeroDocumento', numeroDocumento);
    return this.http.get<ViajeroResponse[]>(`${this.baseURL}/numeroDocumento`, { params });
  }

  /**
   * Busca viajeros por nacionalidad
   */
  findByNacionalidad(nacionalidad: string): Observable<ViajeroResponse[]> {
    const params = new HttpParams().set('nacionalidad', nacionalidad);
    return this.http.get<ViajeroResponse[]>(`${this.baseURL}/nacionalidad`, { params });
  }

  /**
   * Busca viajeros por residencia
   */
  findByResidencia(residencia: string): Observable<ViajeroResponse[]> {
    const params = new HttpParams().set('residencia', residencia);
    return this.http.get<ViajeroResponse[]>(`${this.baseURL}/residencia`, { params });
  }

  /**
   * Busca viajeros por fecha de vencimiento del documento
   */
  findByFechaVencimientoDocumento(fechaVencimiento: string): Observable<ViajeroResponse[]> {
    const params = new HttpParams().set('fechaVencimientoDocumento', fechaVencimiento);
    return this.http.get<ViajeroResponse[]>(`${this.baseURL}/fecha-vencimiento`, { params });
  }

  /**
   * Busca viajeros por rango de fechas de vencimiento del documento
   */
  findByFechaVencimientoDocumentoBetween(fechaInicio: string, fechaFin: string): Observable<ViajeroResponse[]> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);
    return this.http.get<ViajeroResponse[]>(`${this.baseURL}/fecha-vencimiento-rango`, { params });
  }

  /**
   * Crea un nuevo viajero
   */
  save(viajeroRequest: ViajeroRequest): Observable<ViajeroResponse> {
    return this.http.post<ViajeroResponse>(this.baseURL, viajeroRequest);
  }

  /**
   * Actualiza un viajero existente
   */
  update(id: number, viajeroRequest: ViajeroRequest): Observable<ViajeroResponse> {
    return this.http.put<ViajeroResponse>(`${this.baseURL}/${id}`, viajeroRequest);
  }

  /**
   * Elimina un viajero por ID
   */
  deleteById(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseURL}/${id}`);
  }

  /**
   * Exporta viajeros por IDs - llama al endpoint /export/json
   */
  exportViajeros(viajeroIds: number[]): Observable<ViajeroResponse[]> {
    return this.http.post<ViajeroResponse[]>(`${this.baseURL}/export/json`, viajeroIds);
  }
}
