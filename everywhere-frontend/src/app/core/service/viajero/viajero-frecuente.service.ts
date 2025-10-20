import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ViajeroFrecuenteRequest, ViajeroFrecuenteResponse } from '../../../shared/models/Viajero/viajeroFrecuente.model';

@Injectable({
  providedIn: 'root'
})
export class ViajeroFrecuenteService {
  private baseURL = `${environment.baseURL}/viajeros-frecuentes`;
  private http = inject(HttpClient);

  constructor() { }

  /**
   * Crea un viajero frecuente asociándolo a un viajero existente
   */
  crear(viajeroId: number, viajeroFrecuenteRequest: ViajeroFrecuenteRequest): Observable<ViajeroFrecuenteResponse> {
    return this.http.post<ViajeroFrecuenteResponse>(`${this.baseURL}/${viajeroId}`, viajeroFrecuenteRequest);
  }

  /**
   * Busca un viajero frecuente por ID
   */
  buscarPorId(id: number): Observable<ViajeroFrecuenteResponse> {
    return this.http.get<ViajeroFrecuenteResponse>(`${this.baseURL}/${id}`);
  }

  /**
   * Lista todos los viajeros frecuentes de un viajero
   */
  listarPorViajero(viajeroId: number): Observable<ViajeroFrecuenteResponse[]> {
    return this.http.get<ViajeroFrecuenteResponse[]>(`${this.baseURL}/viajero/${viajeroId}`);
  }

  /**
   * Busca todos los viajeros frecuentes por ID de viajero
   */
  buscarPorViajeroId(viajeroId: number): Observable<ViajeroFrecuenteResponse[]> {
    return this.http.get<ViajeroFrecuenteResponse[]>(`${this.baseURL}/search/${viajeroId}`);
  }

  /**
   * Actualiza un viajero frecuente
   */
  actualizar(id: number, viajeroFrecuenteRequest: ViajeroFrecuenteRequest): Observable<ViajeroFrecuenteResponse> {
    return this.http.put<ViajeroFrecuenteResponse>(`${this.baseURL}/${id}`, viajeroFrecuenteRequest);
  }

  /**
   * Elimina un viajero frecuente
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseURL}/${id}`);
  }
}
