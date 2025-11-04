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

  findAll(): Observable<ViajeroResponse[]> {
    return this.http.get<ViajeroResponse[]>(this.baseURL);
  }

  findByNacionalidad(nacionalidad: string): Observable<ViajeroResponse[]> {
    const params = new HttpParams().set('nacionalidad', nacionalidad);
    return this.http.get<ViajeroResponse[]>(`${this.baseURL}/nacionalidad`, { params });
  }

  findByResidencia(residencia: string): Observable<ViajeroResponse[]> {
    const params = new HttpParams().set('residencia', residencia);
    return this.http.get<ViajeroResponse[]>(`${this.baseURL}/residencia`, { params });
  }

  findById(id: number): Observable<ViajeroResponse> {
    return this.http.get<ViajeroResponse>(`${this.baseURL}/${id}`);
  }

  save(viajeroRequest: ViajeroRequest): Observable<ViajeroResponse> {
    return this.http.post<ViajeroResponse>(this.baseURL, viajeroRequest);
  }

  update(id: number, viajeroRequest: ViajeroRequest): Observable<ViajeroResponse> {
    return this.http.patch<ViajeroResponse>(`${this.baseURL}/${id}`, viajeroRequest);
  }

  deleteById(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseURL}/${id}`);
  }
 /*
  exportViajeros(viajeroIds: number[]): Observable<ViajeroResponse[]> {
    return this.http.post<ViajeroResponse[]>(`${this.baseURL}/export/json`, viajeroIds);
  }*/
}
