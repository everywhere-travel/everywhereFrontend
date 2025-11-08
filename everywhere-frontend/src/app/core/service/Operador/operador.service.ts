import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OperadorResponse} from '../../../shared/models/Operador/operador.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OperadorService {

  private apiUrl = `${environment.baseURL}/operadores`;
  constructor(private http: HttpClient) { }

  findAllOperador(): Observable<OperadorResponse[]> {
    return this.http.get<OperadorResponse[]>(this.apiUrl);
  }

  getByIdOperador(id: number): Observable<OperadorResponse> {
    return this.http.get<OperadorResponse>(`${this.apiUrl}/${id}`);
  }

  createOperador(operadorRequest: any): Observable<OperadorResponse> {
    return this.http.post<OperadorResponse>(this.apiUrl, operadorRequest);
  }

  updateOperador(id: number, operadorRequest: any): Observable<OperadorResponse> {
    return this.http.patch<OperadorResponse>(`${this.apiUrl}/${id}`, operadorRequest);
  }

  deleteByIdOperador(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
