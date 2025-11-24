import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { CotizacionConDetallesResponseDTO, CotizacionRequest, CotizacionResponse, CotizacionPatchRequest } from '../../../shared/models/Cotizacion/cotizacion.model';
import { environment } from '../../../../environments/environment';
import { CacheService } from '../cache.service';
import { BYPASS_CACHE } from '../../interceptos/cache.interceptor';

@Injectable({
  providedIn: 'root'
})
export class CotizacionService {
  private apiUrl = `${environment.baseURL}/cotizaciones`;
  private cacheService = inject(CacheService);

  constructor(private http: HttpClient) { }

  createCotizacion(cotizacionRequest: CotizacionRequest): Observable<CotizacionResponse> {
    return this.http.post<CotizacionResponse>(this.apiUrl, cotizacionRequest).pipe(
      tap(() => this.cacheService.invalidateModule('cotizaciones'))
    );
  }

  createCotizacionWithPersona(personaId: number, cotizacionRequest: CotizacionRequest): Observable<CotizacionResponse> {
    return this.http.post<CotizacionResponse>(`${this.apiUrl}/persona/${personaId}`, cotizacionRequest).pipe(
      tap(() => this.cacheService.invalidateModule('cotizaciones'))
    );
  }

  getByIdCotizacion(id: number): Observable<CotizacionResponse> {
    return this.http.get<CotizacionResponse>(`${this.apiUrl}/${id}`);
  }

  getAllCotizaciones(): Observable<CotizacionResponse[]> {
    return this.http.get<CotizacionResponse[]>(this.apiUrl);
  }

  getCotizacionConDetalles(id: number): Observable<CotizacionConDetallesResponseDTO> {
      return this.http.get<CotizacionConDetallesResponseDTO>(`${this.apiUrl}/${id}/con-detalles`);
    }

  updateCotizacion(id: number, cotizacionPatchRequest: CotizacionPatchRequest): Observable<CotizacionResponse> {
    return this.http.patch<CotizacionResponse>(`${this.apiUrl}/${id}`, cotizacionPatchRequest).pipe(
      tap(() => this.cacheService.invalidateModule('cotizaciones'))
    );
  }

  deleteByIdCotizacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.cacheService.invalidateModule('cotizaciones'))
    );
  }

  actualizarSeleccionesDetalles(cotizacionId: number, detalleSelecciones: {detalleId: number, seleccionado: boolean}[]): Observable<CotizacionResponse> {
    const payload = {
      selecciones: detalleSelecciones
    };

    return this.http.put<CotizacionResponse>(`${this.apiUrl}/${cotizacionId}/detalles/selecciones`, payload).pipe(
      tap(() => this.cacheService.invalidateModule('cotizaciones'))
    );
  }

  getCotizacionSinLiquidacion(bypassCache: boolean = false): Observable<CotizacionResponse[]> {
    const options = bypassCache ? {
      context: new HttpContext().set(BYPASS_CACHE, true)
    } : {};

    return this.http.get<CotizacionResponse[]>(`${this.apiUrl}/sin-liquidacion`, options);
  }
}
