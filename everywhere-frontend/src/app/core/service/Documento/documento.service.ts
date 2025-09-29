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

  /**
   * Obtiene todos los tipos de documentos.
   * Corresponde a: GET /documentos
   */
  getAllDocumentos(): Observable<DocumentoResponse[]> {
    return this.http.get<DocumentoResponse[]>(this.apiUrl);
  }

  /**
   * Obtiene un tipo de documento por su ID.
   * Corresponde a: GET /documentos/{id}
   * @param id - El ID del documento a obtener.
   */
  getDocumentoById(id: number): Observable<DocumentoResponse> {
    return this.http.get<DocumentoResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea un nuevo tipo de documento.
   * Corresponde a: POST /documentos
   * @param documento - El objeto con los datos del nuevo documento.
   */
  createDocumento(documento: DocumentoRequest): Observable<DocumentoResponse> {
    return this.http.post<DocumentoResponse>(this.apiUrl, documento);
  }

  /**
   * Actualiza un tipo de documento existente.
   * Corresponde a: PUT /documentos/{id}
   * @param id - El ID del documento a actualizar.
   * @param documento - El objeto con los datos actualizados del documento.
   */
  updateDocumento(id: number, documento: DocumentoRequest): Observable<DocumentoResponse> {
    return this.http.put<DocumentoResponse>(`${this.apiUrl}/${id}`, documento);
  }

  /**
   * Elimina un tipo de documento por su ID.
   * Corresponde a: DELETE /documentos/{id}
   * @param id - El ID del documento a eliminar.
   */
  deleteDocumento(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
