import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ChatMessageRequest {
  message: string;
  history?: Array<{ sender: string; text: string }>;
}

export interface ChatMessageResponse {
  reply: string;
  suggestions?: string[];
  timestamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AsistenteService {
  private http = inject(HttpClient);
  private baseURL = `${environment.baseURL}/asistente`;

  sendMessage(message: string, history?: Array<{ sender: string; text: string }>): Observable<ChatMessageResponse> {
    const payload: ChatMessageRequest = { message, history };
    return this.http.post<ChatMessageResponse>(`${this.baseURL}/chat`, payload);
  }
}
