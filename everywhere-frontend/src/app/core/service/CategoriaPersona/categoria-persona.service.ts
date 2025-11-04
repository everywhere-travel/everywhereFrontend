import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CategoriaPersonaRequest, CategoriaPersonaResponse } from '../../../shared/models/CategoriaPersona/categoriaPersona.models';
import { PersonaNaturalResponse } from '../../../shared/models/Persona/personaNatural.model';

@Injectable({
  providedIn: 'root'
})
export class CategoriaPersonaService {
  private baseURL = `${environment.baseURL}/categorias-personas`;

  constructor(private http: HttpClient) { }

  findAll(): Observable<CategoriaPersonaResponse[]> {
    return this.http.get<CategoriaPersonaResponse[]>(this.baseURL);
  }

  findByNombre(nombre: string): Observable<CategoriaPersonaResponse[]> {
    const params = new HttpParams().set('nombre', nombre);
    return this.http.get<CategoriaPersonaResponse[]>(`${this.baseURL}/nombre`, { params });
  }

  findById(id: number): Observable<CategoriaPersonaResponse> {
    return this.http.get<CategoriaPersonaResponse>(`${this.baseURL}/${id}`);
  }

  save(categoriaPersonaRequest: CategoriaPersonaRequest): Observable<CategoriaPersonaResponse> {
    return this.http.post<CategoriaPersonaResponse>(this.baseURL, categoriaPersonaRequest);
  }

  patch(id: number, categoriaPersonaRequest: CategoriaPersonaRequest): Observable<CategoriaPersonaResponse> {
    return this.http.patch<CategoriaPersonaResponse>(`${this.baseURL}/${id}`, categoriaPersonaRequest);
  }

  deleteById(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseURL}/${id}`);
  }

  asignarCategoria(personaNaturalId: number, categoriaId: number): Observable<PersonaNaturalResponse> {
    return this.http.patch<PersonaNaturalResponse>(`${this.baseURL}/persona-natural/${personaNaturalId}/asignar`, { categoriaId });
  }

  desasignarCategoria(personaNaturalId: number): Observable<PersonaNaturalResponse> {
    return this.http.delete<PersonaNaturalResponse>(`${this.baseURL}/persona-natural/${personaNaturalId}/desasignar`);
  }

  findPersonasPorCategoria(categoriaId: number): Observable<PersonaNaturalResponse[]> {
    return this.http.get<PersonaNaturalResponse[]>(`${this.baseURL}/categoria/${categoriaId}`);
  }

  getCategoriaDePersona(personaNaturalId: number): Observable<CategoriaPersonaResponse> {
    return this.http.get<CategoriaPersonaResponse>(`${this.baseURL}/persona-natural/${personaNaturalId}/categoria`);
  }
}
