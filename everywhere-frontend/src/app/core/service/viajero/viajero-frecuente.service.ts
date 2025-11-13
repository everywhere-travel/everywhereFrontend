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

  crear(viajeroId: number, viajeroFrecuenteRequest: ViajeroFrecuenteRequest): Observable<ViajeroFrecuenteResponse> {
    return this.http.post<ViajeroFrecuenteResponse>(`${this.baseURL}/${viajeroId}`, viajeroFrecuenteRequest);
  }

  findAll(): Observable<ViajeroFrecuenteResponse[]> {
    return this.http.get<ViajeroFrecuenteResponse[]>(this.baseURL);
  }

  buscarPorId(id: number): Observable<ViajeroFrecuenteResponse> {
    return this.http.get<ViajeroFrecuenteResponse>(`${this.baseURL}/${id}`);
  }

  listarPorViajero(viajeroId: number): Observable<ViajeroFrecuenteResponse[]> {
    return this.http.get<ViajeroFrecuenteResponse[]>(`${this.baseURL}/viajero/${viajeroId}`);
  }

  actualizar(id: number, viajeroFrecuenteRequest: ViajeroFrecuenteRequest): Observable<ViajeroFrecuenteResponse> {
    return this.http.patch<ViajeroFrecuenteResponse>(`${this.baseURL}/${id}`, viajeroFrecuenteRequest);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseURL}/${id}`);
  }

  buscarPorViajeroId(viajeroId: number): Observable<ViajeroFrecuenteResponse[]> {
    return this.http.get<ViajeroFrecuenteResponse[]>(`${this.baseURL}/search/${viajeroId}`);
  }
}
