import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuditoriaDetalle, AuditoriaPageResponse, AuditoriaStats } from '../../models/auditoria/auditoria.model';

export interface AuditoriaFilterParams {
  tabla?: string;
  accion?: string;
  username?: string;
  fechaInicio?: string;
  fechaFin?: string;
  search?: string;
  page?: number;
  size?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {
  private http = inject(HttpClient);
  private baseURL = `${environment.baseURL}/auditoria`;

  getAuditorias(filters: AuditoriaFilterParams = {}): Observable<AuditoriaPageResponse> {
    let params = new HttpParams();

    if (filters.tabla) params = params.set('tabla', filters.tabla);
    if (filters.accion) params = params.set('accion', filters.accion);
    if (filters.username) params = params.set('username', filters.username);
    if (filters.fechaInicio) params = params.set('fechaInicio', filters.fechaInicio);
    if (filters.fechaFin) params = params.set('fechaFin', filters.fechaFin);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.page !== undefined) params = params.set('page', filters.page.toString());
    if (filters.size !== undefined) params = params.set('size', filters.size.toString());

    return this.http.get<AuditoriaPageResponse>(this.baseURL, { params });
  }

  getDetalle(id: number): Observable<AuditoriaDetalle> {
    return this.http.get<AuditoriaDetalle>(`${this.baseURL}/${id}`);
  }

  getTablas(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseURL}/tablas`);
  }

  getStats(): Observable<AuditoriaStats> {
    return this.http.get<AuditoriaStats>(`${this.baseURL}/stats`);
  }
}
