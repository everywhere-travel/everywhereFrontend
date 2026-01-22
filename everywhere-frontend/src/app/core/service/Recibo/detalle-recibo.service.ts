import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { DetalleRecibo, DetalleReciboRequestDTO } from '../../../shared/models/Recibo/detalleRecibo.model';
import { environment } from '../../../../environments/environment';
import { CacheService } from '../cache.service';
import { BYPASS_CACHE } from '../../interceptos/cache.interceptor';

@Injectable({
  providedIn: 'root'
})
export class DetalleReciboService {
  private apiUrl = `${environment.baseURL}/detalles-recibo`;
  private cacheService = inject(CacheService);

  constructor(private http: HttpClient) { }

  getAllDetalles(): Observable<DetalleRecibo[]> {
    const context = new HttpContext().set(BYPASS_CACHE, true);
    return this.http.get<DetalleRecibo[]>(this.apiUrl, { context });
  }

  getDetalleById(id: number): Observable<DetalleRecibo> {
    const context = new HttpContext().set(BYPASS_CACHE, true);
    return this.http.get<DetalleRecibo>(`${this.apiUrl}/${id}`, { context });
  }

  getDetallesByRecibo(reciboId: number): Observable<DetalleRecibo[]> {
    const context = new HttpContext().set(BYPASS_CACHE, true);
    return this.http.get<DetalleRecibo[]>(`${this.apiUrl}/recibo/${reciboId}`, { context });
  }

  createDetalle(dto: DetalleReciboRequestDTO): Observable<DetalleRecibo> {
    return this.http.post<DetalleRecibo>(this.apiUrl, dto).pipe(
      tap((response) => {
        if (response.reciboId) {
          this.cacheService.invalidatePattern(`/recibos/${response.reciboId}`);
        }
      })
    );
  }

  updateDetalle(id: number, dto: DetalleReciboRequestDTO): Observable<DetalleRecibo> {
    return this.http.patch<DetalleRecibo>(`${this.apiUrl}/${id}`, dto).pipe(
      tap((response) => {
        if (response.reciboId) {
          this.cacheService.invalidatePattern(`/recibos/${response.reciboId}`);
        }
      })
    );
  }

  deleteDetalle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.cacheService.invalidateModule('recibos');
      })
    );
  }
}
