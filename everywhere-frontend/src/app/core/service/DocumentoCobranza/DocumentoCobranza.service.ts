import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpContext } from '@angular/common/http';
import { BYPASS_CACHE } from '../../interceptos/cache.interceptor';
import { Observable, tap } from 'rxjs';
import { DocumentoCobranzaDTO, DocumentoCobranzaResponseDTO, DocumentoCobranzaUpdateDTO, SaldoDocumentoCobranzaDTO } from '../../../shared/models/DocumetnoCobranza/documentoCobranza.model';
import { environment } from '../../../../environments/environment';
import { CacheService } from '../cache.service';

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
    return this.http.get<DocumentoCobranzaResponseDTO[]>(this.apiUrl);
  }

  getDocumentosPage(page: number = 0, size: number = 10, sortColumn: string = 'id', sortDirection: string = 'desc'): Observable<{content: DocumentoCobranzaResponseDTO[], totalElements: number, totalPages: number}> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `${sortColumn},${sortDirection}`);
    return this.http.get<{content: DocumentoCobranzaResponseDTO[], totalElements: number, totalPages: number}>(`${this.apiUrl}/page`, { params });
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

  updateDocumento(id: number, updateDTO: DocumentoCobranzaUpdateDTO): Observable<DocumentoCobranzaResponseDTO> {
    return this.http.patch<DocumentoCobranzaResponseDTO>(`${this.apiUrl}/${id}`, updateDTO).pipe(
      tap(() => {
        this.cacheService.invalidatePattern(`${this.apiUrl}/${id}`);
        this.cacheService.invalidateModule('documentos-cobranza');
      })
    );
  }

  // Métodos para gestión de carpetas
  getDocumentosByCarpeta(carpetaId: number): Observable<DocumentoCobranzaResponseDTO[]> {
    return this.http.get<DocumentoCobranzaResponseDTO[]>(`${this.apiUrl}/carpeta/${carpetaId}`);
  }

  getDocumentosSinCarpeta(): Observable<DocumentoCobranzaResponseDTO[]> {
    return this.http.get<DocumentoCobranzaResponseDTO[]>(`${this.apiUrl}/sin-carpeta`);
  }

  updateCarpeta(id: number, carpetaId: number | null): Observable<DocumentoCobranzaResponseDTO> {
    let params = new HttpParams();
    if (carpetaId !== null) {
      params = params.set('carpetaId', carpetaId.toString());
    }
    return this.http.patch<DocumentoCobranzaResponseDTO>(`${this.apiUrl}/${id}/carpeta`, null, { params }).pipe(
      tap(() => this.cacheService.invalidateModule('documentos-cobranza'))
    );
  }

  getSaldo(documentoCobranzaId: number): Observable<SaldoDocumentoCobranzaDTO> {
    const context = new HttpContext().set(BYPASS_CACHE, true);
    return this.http.get<SaldoDocumentoCobranzaDTO>(
      `${this.apiUrl}/${documentoCobranzaId}/saldo`,
      { context }
    );
  }
}
