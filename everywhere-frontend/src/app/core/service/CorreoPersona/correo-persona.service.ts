import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CorreoPersonaRequest, CorreoPersonaResponse } from '../../../shared/models/CorreoPersona/correoPersona.model';


@Injectable({
  providedIn: 'root'
})
export class CorreoPersonaService {

  private baseURL = `${environment.baseURL}/correos-persona`;

  constructor(private http: HttpClient) { }

  findByPersonaId(personaId: number): Observable<CorreoPersonaResponse[]> {
    return this.http.get<CorreoPersonaResponse[]>(`${this.baseURL}/personas/${personaId}`);
  }

  findById(correoId: number): Observable<CorreoPersonaResponse> {
    return this.http.get<CorreoPersonaResponse>(`${this.baseURL}/${correoId}`);
  }

  create(personaId: number, correoData: CorreoPersonaRequest): Observable<CorreoPersonaResponse> {
    return this.http.post<CorreoPersonaResponse>(`${this.baseURL}/personas/${personaId}`, correoData);
  }

  update(personaId: number, correoId: number, correoData: CorreoPersonaRequest): Observable<CorreoPersonaResponse> {
    return this.http.patch<CorreoPersonaResponse>(`${this.baseURL}/personas/${personaId}/correo/${correoId}`, correoData);
  }

  delete(correoId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseURL}/${correoId}`);
  }

  listarPorPersona(personaId: number): Observable<CorreoPersonaResponse[]> {
    return this.findByPersonaId(personaId);
  }
}
