import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CategoriaRequest, CategoriaResponse } from '../../../shared/models/Categoria/categoria.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private apiUrl = `${environment.baseURL}/categorias`;

  constructor(private http: HttpClient) {
  }

  findAll(): Observable<CategoriaResponse[]> {
    return this.http.get<CategoriaResponse[]>(this.apiUrl);
  }

  findById(id: number): Observable<CategoriaResponse> {
    return this.http.get<CategoriaResponse>(`${this.apiUrl}/${id}`);
  }

  create(categoriaRequest: CategoriaRequest): Observable<CategoriaResponse> {
    return this.http.post<CategoriaResponse>(this.apiUrl, categoriaRequest);
  }

  update(id: number, categoriaRequest: CategoriaRequest): Observable<CategoriaResponse> {
    return this.http.patch<CategoriaResponse>(`${this.apiUrl}/${id}`, categoriaRequest);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
