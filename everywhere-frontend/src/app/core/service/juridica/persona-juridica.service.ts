import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PersonaJuridicaRequest, PersonaJuridicaResponse } from '../../../shared/models/Persona/personaJuridica.models';

@Injectable({
  providedIn: 'root'
})
export class PersonaJuridicaService {
  private baseURL = `${environment.baseURL}/personas-juridicas`;
  private http = inject(HttpClient);

  constructor() { }

  findAll(): Observable<PersonaJuridicaResponse[]> {
    return this.http.get<PersonaJuridicaResponse[]>(this.baseURL);
  }

  findByRuc(ruc: string): Observable<PersonaJuridicaResponse[]> {
    const params = new HttpParams().set('ruc', ruc);
    return this.http.get<PersonaJuridicaResponse[]>(`${this.baseURL}/ruc`, { params });
  }

  findByRazonSocial(razonSocial: string): Observable<PersonaJuridicaResponse[]> {
    const params = new HttpParams().set('razonSocial', razonSocial);
    return this.http.get<PersonaJuridicaResponse[]>(`${this.baseURL}/razSocial`, { params });
  }

  findById(id: number): Observable<PersonaJuridicaResponse> {
    return this.http.get<PersonaJuridicaResponse>(`${this.baseURL}/${id}`);
  }

  save(personaJuridicaRequest: PersonaJuridicaRequest): Observable<PersonaJuridicaResponse> {
    return this.http.post<PersonaJuridicaResponse>(this.baseURL, personaJuridicaRequest);
  }

  update(id: number, personaJuridicaRequest: PersonaJuridicaRequest): Observable<PersonaJuridicaResponse> {
    return this.http.patch<PersonaJuridicaResponse>(`${this.baseURL}/${id}`, personaJuridicaRequest);
  }

  deleteById(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseURL}/${id}`);
  }
}
