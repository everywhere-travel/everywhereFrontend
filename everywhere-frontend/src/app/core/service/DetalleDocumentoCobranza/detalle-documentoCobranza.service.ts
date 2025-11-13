import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  DetalleDocumentoCobranzaRequestDTO,
  DetalleDocumentoCobranzaResponseDTO
} from '../../../shared/models/DocumetnoCobranza/detalleDocumentoCobranza.model';
import { environment } from '../../../../environments/environment';
import { CacheService } from '../cache.service';

@Injectable({
  providedIn: 'root'
})
export class DetalleDocumentoCobranzaService {
  private apiUrl = `${environment.baseURL}/detalle-documento-cobranza`;
  private cacheService = inject(CacheService);

  constructor(private http: HttpClient) { }

  getAllDetalles(): Observable<DetalleDocumentoCobranzaResponseDTO[]> {
    return this.http.get<DetalleDocumentoCobranzaResponseDTO[]>(this.apiUrl);
  }

  getDetalleById(id: number): Observable<DetalleDocumentoCobranzaResponseDTO> {
    return this.http.get<DetalleDocumentoCobranzaResponseDTO>(`${this.apiUrl}/${id}`);
  }

  getDetallesByDocumentoCobranza(documentoId: number): Observable<DetalleDocumentoCobranzaResponseDTO[]> {
    return this.http.get<DetalleDocumentoCobranzaResponseDTO[]>(`${this.apiUrl}/documento-cobranza/${documentoId}`);
  }

  createDetalle(dto: DetalleDocumentoCobranzaRequestDTO): Observable<DetalleDocumentoCobranzaResponseDTO> {
    return this.http.post<DetalleDocumentoCobranzaResponseDTO>(this.apiUrl, dto).pipe(
      tap((response) => {
        if (response.documentoCobranzaId) {
          this.cacheService.invalidatePattern(`/documentos-cobranza/${response.documentoCobranzaId}`);
        }
      })
    );
  }

  updateDetalle(id: number, dto: DetalleDocumentoCobranzaRequestDTO): Observable<DetalleDocumentoCobranzaResponseDTO> {
    return this.http.put<DetalleDocumentoCobranzaResponseDTO>(`${this.apiUrl}/${id}`, dto).pipe(
      tap((response) => {
        if (response.documentoCobranzaId) {
          this.cacheService.invalidatePattern(`/documentos-cobranza/${response.documentoCobranzaId}`);
        }
      })
    );
  }
  
  deleteDetalle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.cacheService.invalidateModule('documentos-cobranza');
      })
    );
  }
}
