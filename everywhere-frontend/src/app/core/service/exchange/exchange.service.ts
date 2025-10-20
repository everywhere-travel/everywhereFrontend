import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Exchange } from '../../../shared/models/Exchange/exchange.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExchangeService {

  private apiUrl = `${environment.baseURL}/exchange`;

  constructor(private http: HttpClient) { }

  getExchangeRates(): Observable<Exchange> {
    return this.http.get<Exchange>(`${this.apiUrl}/tipo-de-cambio`);
  }
}
