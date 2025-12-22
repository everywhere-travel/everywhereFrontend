import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private apiUrl = `${environment.baseURL}/pdf`;

  constructor(private http: HttpClient) { }

  // Generar PDF de documento de cobranza
  generateDocumentoCobranzaPdf(id: number): Observable<Blob> {
    const headers = new HttpHeaders({
      'Accept': 'application/pdf'
    });

    return this.http.get(`${this.apiUrl}/documento-cobranza/${id}`, {
      headers,
      responseType: 'blob'
    });
  }

  // Método auxiliar para descargar el PDF
  downloadDocumentoCobranzaPdf(id: number, nroSerie?: string): void {
    this.generateDocumentoCobranzaPdf(id).subscribe({
      next: (pdfBlob: Blob) => {
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${nroSerie || id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error descargando PDF:', error);
      }
    });
  }

  // Método auxiliar para abrir el PDF en nueva pestaña
  viewDocumentoCobranzaPdf(id: number): void {
    this.generateDocumentoCobranzaPdf(id).subscribe({
      next: (pdfBlob: Blob) => {
        const url = window.URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');
      },
      error: (error) => {
        console.error('Error visualizando PDF:', error);
      }
    });
  }
}
