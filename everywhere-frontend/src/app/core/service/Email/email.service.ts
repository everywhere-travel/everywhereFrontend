import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { EmailRequestDTO } from '../../../shared/models/Email/email.model';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private apiUrl = `${environment.baseURL}/emails`;

  constructor(private http: HttpClient) { }

  sendEmail(formData: FormData): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/send`, formData);
  }
}
