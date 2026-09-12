import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface KpiSummaryDTO {
  ingresoTotal: number;
  comisionesTotales: number;
  totalVentasCerradas: number;
  expedienteDeVenta: number;  // Promedio por venta
  tasaConversion: number;     // Porcentaje
  cotizacionesAbiertas: number;
  cotizacionesVencidas: number;
}

export interface QuoteFunnelDTO {
  totalCotizaciones: number;
  convertidas: number;
  noConvertidas: number;
  cotizacionesVigentes: number;
  cotizacionesVencidas: number;
  tasaConversion: number;
}

export interface ConversionByVendorDTO {
  nombreVendedor: string;
  totalCotizaciones: number;
  cotizacionesConvertidas: number;
  tasaConversion: number;
  montoVendido: number;
}

export interface AnalyticsDashboardDTO {
  kpis: KpiSummaryDTO;
  topVendors: {
    nombreVendedor: string;
    montoVendido: number;
    cantidadCotizaciones: number;
  }[];
  topProducts: {
    nombreProducto: string;
    cantidadVendida: number;
    ingresoGenerado: number;
  }[];
  salesChart: { fecha: string; monto: number; }[];
  topClients: {
    nombreCliente: string;
    montoComprado: number;
    frecuenciaCompra: number;
  }[];
  clientDemographics: {
    paisNacionalidad: string;
    paisResidencia: string;
    cantidadClientes: number;
  }[];
  topDestinations: {
    destino: string;
    cantidadViajes: number;
    ingresoGenerado: number;
  }[];
  newClientsChart: { fecha: string; cantidad: number; }[];
  // Nuevos
  quoteFunnel: QuoteFunnelDTO;
  conversionByVendor: ConversionByVendorDTO[];
}

export interface DashboardFilters {
  startDate: string;
  endDate: string;
  counterId?: number | null;
  sucursalId?: number | null;
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = `${environment.baseURL}/analytics`;

  constructor(private http: HttpClient) {}

  getDashboardData(filters: DashboardFilters): Observable<AnalyticsDashboardDTO> {
    let params = new HttpParams();
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate)   params = params.set('endDate', filters.endDate);
    if (filters.counterId)   params = params.set('counterId',  filters.counterId.toString());
    if (filters.sucursalId)  params = params.set('sucursalId', filters.sucursalId.toString());

    return this.http.get<AnalyticsDashboardDTO>(`${this.apiUrl}/dashboard`, { params });
  }
}
