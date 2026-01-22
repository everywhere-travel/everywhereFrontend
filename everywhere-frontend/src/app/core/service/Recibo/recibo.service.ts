import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpContext } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ReciboResponseDTO, ReciboUpdateDTO } from '../../../shared/models/Recibo/recibo.model';
import { environment } from '../../../../environments/environment';
import { CacheService } from '../cache.service';
import { BYPASS_CACHE } from '../../interceptos/cache.interceptor';

@Injectable({
  providedIn: 'root'
})
export class ReciboService {
  private apiUrl = `${environment.baseURL}/recibos`;
  private cacheService = inject(CacheService);

  constructor(private http: HttpClient) { }

  createRecibo(
    cotizacionId: number,
    personaJuridicaId?: number,
    sucursalId?: number
  ): Observable<ReciboResponseDTO> {
    let params = new HttpParams().set('cotizacionId', cotizacionId.toString());

    if (personaJuridicaId) {
      params = params.set('personaJuridicaId', personaJuridicaId.toString());
    }
    if (sucursalId) {
      params = params.set('sucursalId', sucursalId.toString());
    }

    return this.http.post<ReciboResponseDTO>(this.apiUrl, null, { params }).pipe(
      tap(() => this.cacheService.invalidateModule('recibos'))
    );
  }

  getAllRecibos(): Observable<ReciboResponseDTO[]> {
    const context = new HttpContext().set(BYPASS_CACHE, true);
    return this.http.get<ReciboResponseDTO[]>(this.apiUrl, { context });
  }

  getReciboById(id: number): Observable<ReciboResponseDTO> {
    const context = new HttpContext().set(BYPASS_CACHE, true);
    return this.http.get<ReciboResponseDTO>(`${this.apiUrl}/${id}`, { context });
  }

  getReciboBySerieCorrelativo(serie: string, correlativo: number): Observable<ReciboResponseDTO> {
    return this.http.get<ReciboResponseDTO>(`${this.apiUrl}/serie/${serie}/correlativo/${correlativo}`);
  }

  getReciboByCotizacion(cotizacionId: number): Observable<ReciboResponseDTO> {
    return this.http.get<ReciboResponseDTO>(`${this.apiUrl}/cotizacion/${cotizacionId}`);
  }

  updateRecibo(id: number, updateDTO: ReciboUpdateDTO): Observable<ReciboResponseDTO> {
    return this.http.patch<ReciboResponseDTO>(`${this.apiUrl}/${id}`, updateDTO).pipe(
      tap(() => {
        this.cacheService.invalidatePattern(`${this.apiUrl}/${id}`);
        this.cacheService.invalidateModule('recibos');
      })
    );
  }
}
