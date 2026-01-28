import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { DetalleReciboResponseDTO, DetalleReciboRequestDTO } from '../../../shared/models/Recibo/detalleRecibo.model';
import { environment } from '../../../../environments/environment';
import { CacheService } from '../cache.service';
import { BYPASS_CACHE } from '../../interceptos/cache.interceptor';

@Injectable({
  providedIn: 'root'
})
export class DetalleReciboService {
  private apiUrl = `${environment.baseURL}/detalle-recibo`;
  private cacheService = inject(CacheService);

  constructor(private http: HttpClient) { }

  getAllDetalles(): Observable<DetalleReciboResponseDTO[]> {
    const context = new HttpContext().set(BYPASS_CACHE, true);
    return this.http.get<DetalleReciboResponseDTO[]>(this.apiUrl, { context });
  }

  getDetalleById(id: number): Observable<DetalleReciboResponseDTO> {
    const context = new HttpContext().set(BYPASS_CACHE, true);
    return this.http.get<DetalleReciboResponseDTO>(`${this.apiUrl}/${id}`, { context });
  }

  getDetallesByRecibo(reciboId: number): Observable<DetalleReciboResponseDTO[]> {
    const context = new HttpContext().set(BYPASS_CACHE, true);
    return this.http.get<DetalleReciboResponseDTO[]>(`${this.apiUrl}/recibo/${reciboId}`, { context });
  }

  createDetalle(dto: DetalleReciboRequestDTO): Observable<DetalleReciboResponseDTO> {
    return this.http.post<DetalleReciboResponseDTO>(this.apiUrl, dto).pipe(
      tap((response) => {
        if (response.reciboId) {
          this.cacheService.invalidatePattern(`/recibos/${response.reciboId}`);
        }
      })
    );
  }

  updateDetalle(id: number, dto: DetalleReciboRequestDTO): Observable<DetalleReciboResponseDTO> {
    return this.http.patch<DetalleReciboResponseDTO>(`${this.apiUrl}/${id}`, dto).pipe(
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
