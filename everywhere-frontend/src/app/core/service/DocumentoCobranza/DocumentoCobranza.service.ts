import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentoCobranzaDTO } from '../../../shared/models/DocumetnoCobranza/documentoCobranza.model';
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
  getAllDocumentos(): Observable<DocumentoCobranzaDTO[]> {
    return this.http.get<DocumentoCobranzaDTO[]>(this.apiUrl);
  }

  // Obtener documento por ID
  getDocumentoById(id: number): Observable<DocumentoCobranzaDTO> {
    return this.http.get<DocumentoCobranzaDTO>(`${this.apiUrl}/${id}`);
  }

  // Obtener documento por número
  getDocumentoByNumero(numero: string): Observable<DocumentoCobranzaDTO> {
    return this.http.get<DocumentoCobranzaDTO>(`${this.apiUrl}/numero/${numero}`);
  }

  // Obtener documento por cotización ID
  getDocumentoByCotizacion(cotizacionId: number): Observable<DocumentoCobranzaDTO> {
    return this.http.get<DocumentoCobranzaDTO>(`${this.apiUrl}/cotizacion/${cotizacionId}`);
  }
}
