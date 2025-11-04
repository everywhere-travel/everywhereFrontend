import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TelefonoPersonaRequest, TelefonoPersonaResponse } from '../../../shared/models/TelefonoPersona/telefonoPersona.models';

@Injectable({
  providedIn: 'root'
})
export class TelefonoPersonaService {
  private baseURL = `${environment.baseURL}/telefonos-persona`;

  constructor(private http: HttpClient) { }

  findByPersonaId(personaId: number): Observable<TelefonoPersonaResponse[]> {
    return this.http.get<TelefonoPersonaResponse[]>(`${this.baseURL}/personas/${personaId}`);
  }

  findById(personaId: number, telefonoId: number): Observable<TelefonoPersonaResponse> {
    return this.http.get<TelefonoPersonaResponse>(`${this.baseURL}/personas/${personaId}/telefono/${telefonoId}`);
  }

  create(telefonoData: TelefonoPersonaRequest): Observable<TelefonoPersonaResponse> {
    return this.http.post<TelefonoPersonaResponse>(`${this.baseURL}`, telefonoData);
  }

  update(personaId: number, telefonoId: number, telefonoData: TelefonoPersonaRequest): Observable<TelefonoPersonaResponse> {
    return this.http.patch<TelefonoPersonaResponse>(`${this.baseURL}/personas/${personaId}/telefono/${telefonoId}`, telefonoData);
  }

  delete(telefonoId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseURL}/${telefonoId}`);
  }

  listarPorPersona(personaId: number): Observable<TelefonoPersonaResponse[]> {
    return this.findByPersonaId(personaId);
  }
}
