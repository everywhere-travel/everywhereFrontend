import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PersonaRequest, PersonaResponse } from '../../../shared/models/Persona/persona.model';

@Injectable({
  providedIn: 'root'
})
export class PersonaService {
  private baseURL = `${environment.baseURL}/personas`;
  private http = inject(HttpClient);

  constructor() { }

  /**
   * Obtiene todas las personas
   */
  findAll(): Observable<PersonaResponse[]> {
    return this.http.get<PersonaResponse[]>(this.baseURL);
  }

  /**
   * Obtiene una persona por ID
   */
  findById(id: number): Observable<PersonaResponse> {
    return this.http.get<PersonaResponse>(`${this.baseURL}/${id}`);
  }

  /**
   * Busca personas por email
   */
  findByEmail(email: string): Observable<PersonaResponse[]> {
    const params = new HttpParams().set('email', email);
    return this.http.get<PersonaResponse[]>(`${this.baseURL}/email`, { params });
  }

  /**
   * Busca personas por teléfono
   */
  findByTelefono(telefono: string): Observable<PersonaResponse[]> {
    const params = new HttpParams().set('telefono', telefono);
    return this.http.get<PersonaResponse[]>(`${this.baseURL}/telefono`, { params });
  }

  /**
   * Crea una nueva persona
   */
  save(personaRequest: PersonaRequest): Observable<PersonaResponse> {
    return this.http.post<PersonaResponse>(this.baseURL, personaRequest);
  }

  /**
   * Actualiza una persona existente
   */
  update(id: number, personaRequest: PersonaRequest): Observable<PersonaResponse> {
    return this.http.put<PersonaResponse>(`${this.baseURL}/${id}`, personaRequest);
  }

  /**
   * Elimina una persona por ID
   */
  deleteById(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseURL}/${id}`);
  }

  findPersonaNaturalOrJuridicaById(id: number): Observable<PersonaResponse> {
    return this.http.get<PersonaResponse>(`${this.baseURL}/with-details/${id}`);
  }
}
