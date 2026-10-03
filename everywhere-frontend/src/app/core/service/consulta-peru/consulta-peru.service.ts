import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface DniConsultaResponse {
  dni: string;
  nombres?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  nombreCompleto?: string;
  codigoVerificacion?: number;
  origen: 'LOCAL' | 'APIPERU';
  encontrado: boolean;
  personaNaturalId?: number;
  personaId?: number;
  mensaje?: string;
}

export interface RucConsultaResponse {
  ruc: string;
  razonSocial?: string;
  estado?: string;
  condicion?: string;
  direccion?: string;
  departamento?: string;
  origen: 'LOCAL' | 'APIPERU';
  encontrado: boolean;
  personaJuridicaId?: number;
  personaId?: number;
  mensaje?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConsultaPeruService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.baseURL}/consultas`;

  consultarDni(dni: string): Observable<DniConsultaResponse> {
    return this.http.get<DniConsultaResponse>(`${this.apiUrl}/dni/${dni}`);
  }

  consultarRuc(ruc: string): Observable<RucConsultaResponse> {
    return this.http.get<RucConsultaResponse>(`${this.apiUrl}/ruc/${ruc}`);
  }
}
