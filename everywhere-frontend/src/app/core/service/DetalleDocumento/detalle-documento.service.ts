import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DetalleDocumentoRequest, DetalleDocumentoResponse } from '../../../shared/models/Documento/detalleDocumento.model'; // Asegúrate que la ruta sea correcta
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DetalleDocumentoService {

  private apiUrl = `${environment.baseURL}/detalle-documento`;

  constructor(private http: HttpClient) { }

  getAllDetalles(): Observable<DetalleDocumentoResponse[]> {
    return this.http.get<DetalleDocumentoResponse[]>(this.apiUrl);
  }

  getDetalleById(id: number): Observable<DetalleDocumentoResponse> {
    return this.http.get<DetalleDocumentoResponse>(`${this.apiUrl}/${id}`);
  }

  findByDocumento(documentoId: number): Observable<DetalleDocumentoResponse[]> {
    return this.http.get<DetalleDocumentoResponse[]>(`${this.apiUrl}/documento/${documentoId}`);
  }

  findByNumero(numero: string): Observable<DetalleDocumentoResponse[]> {
    return this.http.get<DetalleDocumentoResponse[]>(`${this.apiUrl}/numero/${numero}`);
  }

  findByPersonaNaturalId(personaNaturalId: number): Observable<DetalleDocumentoResponse[]> {
    return this.http.get<DetalleDocumentoResponse[]>(`${this.apiUrl}/persona-natural/${personaNaturalId}`);
  }

  findByPersonaId(personaId: number): Observable<DetalleDocumentoResponse[]> {
    return this.http.get<DetalleDocumentoResponse[]>(`${this.apiUrl}/persona/${personaId}`);
  }

  saveDetalle(detalle: DetalleDocumentoRequest): Observable<DetalleDocumentoResponse> {
    return this.http.post<DetalleDocumentoResponse>(this.apiUrl, detalle);
  }

  updateDetalle(id: number, detalle: DetalleDocumentoRequest): Observable<DetalleDocumentoResponse> {
    return this.http.patch<DetalleDocumentoResponse>(`${this.apiUrl}/${id}`, detalle);
  }

  deleteDetalle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
