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

  /**
   * Obtiene todos los detalles de documentos.
   * Corresponde a: GET /detalle-documento
   */
  getAllDetalles(): Observable<DetalleDocumentoResponse[]> {
    return this.http.get<DetalleDocumentoResponse[]>(this.apiUrl);
  }

  /**
   * Obtiene un detalle de documento por su ID.
   * Corresponde a: GET /detalle-documento/{id}
   * @param id - El ID del detalle del documento.
   */
  getDetalleById(id: number): Observable<DetalleDocumentoResponse> {
    return this.http.get<DetalleDocumentoResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Busca todos los documentos asociados a un viajero específico.
   * Corresponde a: GET /detalle-documento/viajero/{viajeroId}
   * @param viajeroId - El ID del viajero.
   */
  findByViajero(viajeroId: number): Observable<DetalleDocumentoResponse[]> {
    return this.http.get<DetalleDocumentoResponse[]>(`${this.apiUrl}/viajero/${viajeroId}`);
  }

  /**
   * Busca todos los detalles de un tipo de documento específico.
   * Corresponde a: GET /detalle-documento/documento/{documentoId}
   * @param documentoId - El ID del tipo de documento.
   */
  findByDocumento(documentoId: number): Observable<DetalleDocumentoResponse[]> {
    return this.http.get<DetalleDocumentoResponse[]>(`${this.apiUrl}/documento/${documentoId}`);
  }

  /**
   * Busca documentos por su número.
   * Corresponde a: GET /detalle-documento/numero/{numero}
   * @param numero - El número de documento a buscar.
   */
  findByNumero(numero: string): Observable<DetalleDocumentoResponse[]> {
    return this.http.get<DetalleDocumentoResponse[]>(`${this.apiUrl}/numero/${numero}`);
  }

  /**
   * Guarda un nuevo detalle de documento.
   * Corresponde a: POST /detalle-documento
   * @param detalle - El objeto con los datos del nuevo detalle.
   */
  saveDetalle(detalle: DetalleDocumentoRequest): Observable<DetalleDocumentoResponse> {
    return this.http.post<DetalleDocumentoResponse>(this.apiUrl, detalle);
  }

  /**
   * Actualiza un detalle de documento existente.
   * Corresponde a: PUT /detalle-documento/{id}
   * @param id - El ID del detalle a actualizar.
   * @param detalle - El objeto con los datos actualizados.
   */
  updateDetalle(id: number, detalle: DetalleDocumentoRequest): Observable<DetalleDocumentoResponse> {
    return this.http.put<DetalleDocumentoResponse>(`${this.apiUrl}/${id}`, detalle);
  }

  /**
   * Elimina un detalle de documento por su ID.
   * Corresponde a: DELETE /detalle-documento/{id}
   * @param id - El ID del detalle a eliminar.
   */
  deleteDetalle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
