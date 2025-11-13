import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { DocumentoCobranzaDTO, DocumentoCobranzaResponseDTO, DocumentoCobranzaUpdateDTO } from '../../../shared/models/DocumetnoCobranza/documentoCobranza.model';
import { environment } from '../../../../environments/environment';
import { CacheService } from '../cache.service';

@Injectable({
  providedIn: 'root'
})
export class DocumentoCobranzaService {
  private apiUrl = `${environment.baseURL}/documentos-cobranza`;
  private cacheService = inject(CacheService);

  constructor(private http: HttpClient) { }

  createDocumentoCobranza(cotizacionId: number, fileVenta: string, costoEnvio: number): Observable<DocumentoCobranzaDTO> {
    const params = new HttpParams().set('cotizacionId', cotizacionId.toString()).set('fileVenta', fileVenta).set('costoEnvio', costoEnvio.toString());
    return this.http.post<DocumentoCobranzaDTO>(this.apiUrl, null, { params }).pipe(
      tap(() => this.cacheService.invalidateModule('documentos-cobranza'))
    );
  }

  getAllDocumentos(): Observable<DocumentoCobranzaResponseDTO[]> {
    return this.http.get<DocumentoCobranzaResponseDTO[]>(this.apiUrl);
  }

  getDocumentoById(id: number): Observable<DocumentoCobranzaResponseDTO> {
    return this.http.get<DocumentoCobranzaResponseDTO>(`${this.apiUrl}/${id}`);
  }

  getDocumentoByNumero(numero: string): Observable<DocumentoCobranzaResponseDTO> {
    return this.http.get<DocumentoCobranzaResponseDTO>(`${this.apiUrl}/numero/${numero}`);
  }

  getDocumentoByCotizacion(cotizacionId: number): Observable<DocumentoCobranzaResponseDTO> {
    return this.http.get<DocumentoCobranzaResponseDTO>(`${this.apiUrl}/cotizacion/${cotizacionId}`);
  }

  updateDocumento(id: number, updateDTO: DocumentoCobranzaUpdateDTO): Observable<DocumentoCobranzaDTO> {
    return this.http.patch<DocumentoCobranzaDTO>(`${this.apiUrl}/${id}`, updateDTO).pipe(
      tap(() => this.cacheService.invalidateModule('documentos-cobranza'))
    );
  }
}
