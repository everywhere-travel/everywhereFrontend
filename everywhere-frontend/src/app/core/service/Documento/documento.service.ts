import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentoRequest, DocumentoResponse } from '../../../shared/models/Documento/documento.model'; // Asegúrate que la ruta sea correcta
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DocumentoService {

  private apiUrl = `${environment.baseURL}/documentos`;
  constructor(private http: HttpClient) { }

  getAllDocumentos(): Observable<DocumentoResponse[]> {
    return this.http.get<DocumentoResponse[]>(this.apiUrl);
  }

  getDocumentoById(id: number): Observable<DocumentoResponse> {
    return this.http.get<DocumentoResponse>(`${this.apiUrl}/${id}`);
  }

  createDocumento(documento: DocumentoRequest): Observable<DocumentoResponse> {
    return this.http.post<DocumentoResponse>(this.apiUrl, documento);
  }

  updateDocumento(id: number, documento: DocumentoRequest): Observable<DocumentoResponse> {
    return this.http.patch<DocumentoResponse>(`${this.apiUrl}/${id}`, documento);
  }

  deleteDocumento(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
