// src/app/core/service/exchange.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ExchangeRate } from '../../shared/models/exchange-rate.model'; // <-- Importamos el modelo

@Injectable({
  providedIn: 'root'
})
export class ExchangeService {

  private puenteApiUrl = 'http://localhost:3000/api/tipo-de-cambio';

  constructor(private http: HttpClient) { }

  getRates(): Observable<ExchangeRate> {
    return this.http.get<ExchangeRate>(this.puenteApiUrl);
  }
}
