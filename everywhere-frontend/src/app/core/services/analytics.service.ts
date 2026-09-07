import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface AnalyticsDashboardDTO {
    kpis: {
        ingresoTotal: number;
        comisionesTotales: number;
        totalVentasCerradas: number;
    };
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
    salesChart: {
        fecha: string;
        monto: number;
    }[];
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
    newClientsChart: {
        fecha: string;
        cantidad: number;
    }[];
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = `${environment.baseURL}/analytics`;

  constructor(private http: HttpClient) {}

  getDashboardData(startDate?: string, endDate?: string): Observable<AnalyticsDashboardDTO> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<AnalyticsDashboardDTO>(`${this.apiUrl}/dashboard`, { params });
  }
}
