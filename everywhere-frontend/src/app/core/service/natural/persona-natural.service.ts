import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PersonaNaturalRequest, PersonaNaturalResponse } from '../../../shared/models/Persona/personaNatural.model';

@Injectable({
  providedIn: 'root'
})
export class PersonaNaturalService {
  private baseURL = `${environment.baseURL}/personas-naturales`;
  private http = inject(HttpClient);

  constructor() { }

  /**
   * Obtiene todas las personas naturales
   */
  findAll(): Observable<PersonaNaturalResponse[]> {
    return this.http.get<PersonaNaturalResponse[]>(this.baseURL);
  }

  /**
   * Obtiene una persona natural por ID
   */
  findById(id: number): Observable<PersonaNaturalResponse> {
    return this.http.get<PersonaNaturalResponse>(`${this.baseURL}/${id}`);
  }

  /**
   * Busca personas naturales por documento
   */
  findByDocumento(documento: string): Observable<PersonaNaturalResponse[]> {
    const params = new HttpParams().set('documento', documento);
    return this.http.get<PersonaNaturalResponse[]>(`${this.baseURL}/documento`, { params });
  }

  /**
   * Busca personas naturales por nombres
   */
  findByNombres(nombres: string): Observable<PersonaNaturalResponse[]> {
    const params = new HttpParams().set('nombres', nombres);
    return this.http.get<PersonaNaturalResponse[]>(`${this.baseURL}/nombres`, { params });
  }

  /**
   * Busca personas naturales por apellidos
   */
  findByApellidos(apellidos: string): Observable<PersonaNaturalResponse[]> {
    const params = new HttpParams().set('apellidos', apellidos);
    return this.http.get<PersonaNaturalResponse[]>(`${this.baseURL}/apellidos`, { params });
  }

  /**
   * Crea una nueva persona natural
   */
  save(personaNaturalRequest: PersonaNaturalRequest): Observable<PersonaNaturalResponse> {
    return this.http.post<PersonaNaturalResponse>(this.baseURL, personaNaturalRequest);
  }

  /**
   * Actualiza una persona natural existente
   */
  update(id: number, personaNaturalRequest: PersonaNaturalRequest): Observable<PersonaNaturalResponse> {
    return this.http.put<PersonaNaturalResponse>(`${this.baseURL}/${id}`, personaNaturalRequest);
  }

  /**
   * Elimina una persona natural por ID
   */
  deleteById(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseURL}/${id}`);
  }
}
