import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CounterRequest, CounterResponse } from '../../../shared/models/Counter/counter.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CounterService {
  private apiUrl = `${environment.baseURL}/counters`;

  constructor(private http: HttpClient) {
  }

  createCounter(request: CounterRequest): Observable<CounterResponse> {
    return this.http.post<CounterResponse>(this.apiUrl, request);
  }

  updateCounter(request: CounterRequest): Observable<CounterResponse> {
    return this.http.put<CounterResponse>(this.apiUrl, request);
  }

  activateCounter(request: CounterRequest): Observable<CounterResponse> {
    return this.http.patch<CounterResponse>(`${this.apiUrl}/activate`, request);
  }

  getByCodeAndNameCounter(request: CounterRequest): Observable<CounterResponse> {
    return this.http.request<CounterResponse>('GET', `${this.apiUrl}/search`, { body: request });
  }

  getAllCounters(): Observable<CounterResponse[]> {
    return this.http.get<CounterResponse[]>(this.apiUrl);
  }

  getActivosCounters(): Observable<CounterResponse[]> {
    return this.http.get<CounterResponse[]>(`${this.apiUrl}/activos`);
  }

  getInactivosCounters(): Observable<CounterResponse[]> {
    return this.http.get<CounterResponse[]>(`${this.apiUrl}/inactivos`);
  }

  deactivateCounter(request: CounterRequest): Observable<CounterResponse> {
    return this.http.patch<CounterResponse>(`${this.apiUrl}/desactivate`, request);
  }

}
