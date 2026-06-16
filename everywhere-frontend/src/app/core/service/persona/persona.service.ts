import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { personaDisplay, PersonaRequest, PersonaResponse } from '../../../shared/models/Persona/persona.model';
import { CacheService } from '../cache.service';

@Injectable({
  providedIn: 'root'
})
export class PersonaService {
  private baseURL = `${environment.baseURL}/personas`;
  private http = inject(HttpClient);
  private cacheService = inject(CacheService);

  constructor() { }

  findAll(): Observable<PersonaResponse[]> {
    return this.http.get<PersonaResponse[]>(this.baseURL);
  }

  getPersonasPage(page: number = 0, size: number = 10, sortColumn: string = 'id', sortDirection: string = 'desc', searchTerm?: string, typeFilter?: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortColumn},${sortDirection}`);
      
    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }
    if (typeFilter) {
      params = params.set('typeFilter', typeFilter);
    }
    
    return this.http.get<any>(`${this.baseURL}/page`, { params });
  }

  getPersonaStats(): Observable<{totalNaturales: number, totalJuridicas: number}> {
    return this.http.get<{totalNaturales: number, totalJuridicas: number}>(`${this.baseURL}/stats`);
  }

  findById(id: number): Observable<PersonaResponse> {
    return this.http.get<PersonaResponse>(`${this.baseURL}/${id}`);
  }

  findByEmail(email: string): Observable<PersonaResponse[]> {
    const params = new HttpParams().set('email', email);
    return this.http.get<PersonaResponse[]>(`${this.baseURL}/email`, { params });
  }

  findByTelefono(telefono: string): Observable<PersonaResponse[]> {
    const params = new HttpParams().set('telefono', telefono);
    return this.http.get<PersonaResponse[]>(`${this.baseURL}/telefono`, { params });
  }

  save(personaRequest: PersonaRequest): Observable<PersonaResponse> {
    return this.http.post<PersonaResponse>(this.baseURL, personaRequest).pipe(
      tap(() => this.cacheService.invalidateModule('personas'))
    );
  }

  update(id: number, personaRequest: PersonaRequest): Observable<PersonaResponse> {
    return this.http.patch<PersonaResponse>(`${this.baseURL}/${id}`, personaRequest).pipe(
      tap(() => this.cacheService.invalidateModule('personas'))
    );
  }

  deleteById(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseURL}/${id}`).pipe(
      tap(() => this.cacheService.invalidateModule('personas'))
    );
  }

  findPersonaNaturalOrJuridicaById(id: number): Observable<personaDisplay> {
    return this.http.get<personaDisplay>(`${this.baseURL}/${id}/NaturalOrJuridica`);
  }
}
