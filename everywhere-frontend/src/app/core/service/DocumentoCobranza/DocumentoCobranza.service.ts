import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentoCobranzaDTO, DocumentoCobranzaResponseDTO, DocumentoCobranzaUpdateDTO } from '../../../shared/models/DocumetnoCobranza/documentoCobranza.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DocumentoCobranzaService {
  private apiUrl = `${environment.baseURL}/documentos-cobranza`;

  constructor(private http: HttpClient) { }

  // Crear documento de cobranza desde cotización
  createDocumentoCobranza(cotizacionId: number, fileVenta: string, costoEnvio: number): Observable<DocumentoCobranzaDTO> {
    const params = new HttpParams()
      .set('cotizacionId', cotizacionId.toString())
      .set('fileVenta', fileVenta)
      .set('costoEnvio', costoEnvio.toString());

    return this.http.post<DocumentoCobranzaDTO>(this.apiUrl, null, { params });
  }

  // Obtener todos los documentos de cobranza
  getAllDocumentos(): Observable<DocumentoCobranzaResponseDTO[]> {
    return this.http.get<DocumentoCobranzaResponseDTO[]>(this.apiUrl);
  }

  // Obtener documento por ID
  getDocumentoById(id: number): Observable<DocumentoCobranzaResponseDTO> {
    return this.http.get<DocumentoCobranzaResponseDTO>(`${this.apiUrl}/${id}`);
  }

  // Obtener documento por número
  getDocumentoByNumero(numero: string): Observable<DocumentoCobranzaResponseDTO> {
    return this.http.get<DocumentoCobranzaResponseDTO>(`${this.apiUrl}/numero/${numero}`);
  }

  // Obtener documento por cotización ID
  getDocumentoByCotizacion(cotizacionId: number): Observable<DocumentoCobranzaResponseDTO> {
    return this.http.get<DocumentoCobranzaResponseDTO>(`${this.apiUrl}/cotizacion/${cotizacionId}`);
  }

  // Actualizar documento de cobranza
  updateDocumento(id: number, updateDTO: DocumentoCobranzaUpdateDTO): Observable<DocumentoCobranzaDTO> {
    return this.http.put<DocumentoCobranzaDTO>(`${this.apiUrl}/${id}`, updateDTO);
  }
}
