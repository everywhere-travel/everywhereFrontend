import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpContext } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { DocumentoCobranzaDTO, DocumentoCobranzaResponseDTO, DocumentoCobranzaUpdateDTO } from '../../../shared/models/DocumetnoCobranza/documentoCobranza.model';
import { environment } from '../../../../environments/environment';
import { CacheService } from '../cache.service';
import { BYPASS_CACHE } from '../../interceptos/cache.interceptor';

@Injectable({
  providedIn: 'root'
})
export class DocumentoCobranzaService {
  private apiUrl = `${environment.baseURL}/documentos-cobranza`;
  private cacheService = inject(CacheService);

  constructor(private http: HttpClient) { }

  createDocumentoCobranza(
    cotizacionId: number,
    personaJuridicaId?: number,
    sucursalId?: number
  ): Observable<DocumentoCobranzaDTO> {
    let params = new HttpParams().set('cotizacionId', cotizacionId.toString());

    if (personaJuridicaId) {
      params = params.set('personaJuridicaId', personaJuridicaId.toString());
    }
    if (sucursalId) {
      params = params.set('sucursalId', sucursalId.toString());
    }

    return this.http.post<DocumentoCobranzaDTO>(this.apiUrl, null, { params }).pipe(
      tap(() => this.cacheService.invalidateModule('documentos-cobranza'))
    );
  }

  getAllDocumentos(): Observable<DocumentoCobranzaResponseDTO[]> {
    const context = new HttpContext().set(BYPASS_CACHE, true);
    return this.http.get<DocumentoCobranzaResponseDTO[]>(this.apiUrl, { context });
  }

  getDocumentoById(id: number): Observable<DocumentoCobranzaResponseDTO> {
    const context = new HttpContext().set(BYPASS_CACHE, true);
    return this.http.get<DocumentoCobranzaResponseDTO>(`${this.apiUrl}/${id}`, { context });
  }

  getDocumentoByNumero(numero: string): Observable<DocumentoCobranzaResponseDTO> {
    return this.http.get<DocumentoCobranzaResponseDTO>(`${this.apiUrl}/numero/${numero}`);
  }

  getDocumentoByCotizacion(cotizacionId: number): Observable<DocumentoCobranzaResponseDTO> {
    return this.http.get<DocumentoCobranzaResponseDTO>(`${this.apiUrl}/cotizacion/${cotizacionId}`);
  }

  updateDocumento(id: number, updateDTO: DocumentoCobranzaUpdateDTO): Observable<DocumentoCobranzaResponseDTO> {
    return this.http.patch<DocumentoCobranzaResponseDTO>(`${this.apiUrl}/${id}`, updateDTO).pipe(
      tap(() => {
        this.cacheService.invalidatePattern(`${this.apiUrl}/${id}`);
        this.cacheService.invalidateModule('documentos-cobranza');
      })
    );
  }
}
