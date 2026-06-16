import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpContext } from '@angular/common/http';
import { BYPASS_CACHE } from '../../interceptos/cache.interceptor';
import { Observable, tap } from 'rxjs';
import { ReciboResponseDTO, ReciboUpdateDTO } from '../../../shared/models/Recibo/recibo.model';
import { environment } from '../../../../environments/environment';
import { CacheService } from '../cache.service';

@Injectable({
  providedIn: 'root'
})
export class ReciboService {
  private apiUrl = `${environment.baseURL}/recibos`;
  private cacheService = inject(CacheService);

  constructor(private http: HttpClient) { }

  createRecibo(
    documentoCobranzaId: number,
    personaJuridicaId?: number,
    sucursalId?: number,
    montoPago?: number
  ): Observable<ReciboResponseDTO> {
    let params = new HttpParams().set(
      'documentoCobranzaId',
      documentoCobranzaId.toString()
    );

    if (personaJuridicaId) {
      params = params.set('personaJuridicaId', personaJuridicaId.toString());
    }

    if (sucursalId) {
      params = params.set('sucursalId', sucursalId.toString());
    }

    if (montoPago) {
      params = params.set('montoPago', montoPago.toString());
    }

    return this.http.post<ReciboResponseDTO>(this.apiUrl, null, { params }).pipe(
      tap(() => this.cacheService.invalidateModule('recibos'))
    );
  }

  getAllRecibos(): Observable<ReciboResponseDTO[]> {
    return this.http.get<ReciboResponseDTO[]>(this.apiUrl);
  }

  getReciboById(id: number): Observable<ReciboResponseDTO> {
    return this.http.get<ReciboResponseDTO>(`${this.apiUrl}/${id}`);
  }

  updateRecibo(id: number, updateDTO: ReciboUpdateDTO): Observable<ReciboResponseDTO> {
    return this.http.patch<ReciboResponseDTO>(`${this.apiUrl}/${id}`, updateDTO).pipe(
      tap(() => {
        this.cacheService.invalidatePattern(`${this.apiUrl}/${id}`);
        this.cacheService.invalidateModule('recibos');
      })
    );
  }

  // Métodos para gestión de carpetas
  getRecibosByCarpeta(carpetaId: number): Observable<ReciboResponseDTO[]> {
    return this.http.get<ReciboResponseDTO[]>(`${this.apiUrl}/carpeta/${carpetaId}`);
  }

  getRecibosSinCarpeta(): Observable<ReciboResponseDTO[]> {
    return this.http.get<ReciboResponseDTO[]>(`${this.apiUrl}/sin-carpeta`);
  }

  updateCarpeta(id: number, carpetaId: number | null): Observable<ReciboResponseDTO> {
    let params = new HttpParams();
    if (carpetaId !== null) {
      params = params.set('carpetaId', carpetaId.toString());
    }
    return this.http.patch<ReciboResponseDTO>(`${this.apiUrl}/${id}/carpeta`, null, { params }).pipe(
      tap(() => this.cacheService.invalidateModule('recibos'))
    );
  }

  getRecibosByDocumentoCobranza(
    documentoCobranzaId: number
  ): Observable<ReciboResponseDTO[]> {
    const context = new HttpContext().set(BYPASS_CACHE, true);

    return this.http.get<ReciboResponseDTO[]>(
      `${this.apiUrl}/documento-cobranza/${documentoCobranzaId}`,
      { context }
    );
  }

  getRecibosByCotizacion(
    cotizacionId: number
  ): Observable<ReciboResponseDTO[]> {
    const context = new HttpContext().set(BYPASS_CACHE, true);

    return this.http.get<ReciboResponseDTO[]>(
      `${this.apiUrl}/cotizacion/${cotizacionId}`,
      { context }
    );
  }
}
