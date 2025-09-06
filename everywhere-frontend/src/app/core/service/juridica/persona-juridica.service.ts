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

  /**
   * Obtiene todas las personas jurídicas
   */
  findAll(): Observable<PersonaJuridicaResponse[]> {
    return this.http.get<PersonaJuridicaResponse[]>(this.baseURL);
  }

  /**
   * Obtiene una persona jurídica por ID
   */
  findById(id: number): Observable<PersonaJuridicaResponse> {
    return this.http.get<PersonaJuridicaResponse>(`${this.baseURL}/${id}`);
  }

  /**
   * Busca personas jurídicas por RUC
   */
  findByRuc(ruc: string): Observable<PersonaJuridicaResponse[]> {
    const params = new HttpParams().set('ruc', ruc);
    return this.http.get<PersonaJuridicaResponse[]>(`${this.baseURL}/ruc`, { params });
  }

  /**
   * Busca personas jurídicas por razón social
   */
  findByRazonSocial(razonSocial: string): Observable<PersonaJuridicaResponse[]> {
    const params = new HttpParams().set('razonSocial', razonSocial);
    return this.http.get<PersonaJuridicaResponse[]>(`${this.baseURL}/razSocial`, { params });
  }

  /**
   * Crea una nueva persona jurídica
   */
  save(personaJuridicaRequest: PersonaJuridicaRequest): Observable<PersonaJuridicaResponse> {
    return this.http.post<PersonaJuridicaResponse>(this.baseURL, personaJuridicaRequest);
  }

  /**
   * Actualiza una persona jurídica existente
   */
  update(id: number, personaJuridicaRequest: PersonaJuridicaRequest): Observable<PersonaJuridicaResponse> {
    return this.http.put<PersonaJuridicaResponse>(`${this.baseURL}/${id}`, personaJuridicaRequest);
  }

  /**
   * Elimina una persona jurídica por ID
   */
  deleteById(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseURL}/${id}`);
  }
}
