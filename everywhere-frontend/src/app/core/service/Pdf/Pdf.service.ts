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
  downloadDocumentoCobranzaPdf(id: number, serie?: string, correlativo?: number): void {
    this.generateDocumentoCobranzaPdf(id).subscribe({
      next: (pdfBlob: Blob) => {
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;

        // Generar nombre de archivo con serie-correlativo
        let filename = `documento-${id}.pdf`;
        if (serie && correlativo !== undefined && correlativo !== null) {
          filename = `${serie}-${String(correlativo).padStart(9, '0')}.pdf`;
        }

        link.download = filename;
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

  // ==================== MÉTODOS PARA RECIBO ====================

  // Generar PDF de recibo
  generateReciboPdf(id: number): Observable<Blob> {
    const headers = new HttpHeaders({
      'Accept': 'application/pdf'
    });

    return this.http.get(`${this.apiUrl}/recibo/${id}`, {
      headers,
      responseType: 'blob'
    });
  }

  // Método auxiliar para descargar el PDF de recibo
  downloadReciboPdf(id: number, serie?: string, correlativo?: number): void {
    this.generateReciboPdf(id).subscribe({
      next: (pdfBlob: Blob) => {
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;

        // Generar nombre de archivo con serie-correlativo
        let filename = `recibo-${id}.pdf`;
        if (serie && correlativo !== undefined && correlativo !== null) {
          filename = `${serie}-${String(correlativo).padStart(9, '0')}.pdf`;
        }

        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error descargando PDF de recibo:', error);
      }
    });
  }

  // Método auxiliar para abrir el PDF de recibo en nueva pestaña
  viewReciboPdf(id: number): void {
    this.generateReciboPdf(id).subscribe({
      next: (pdfBlob: Blob) => {
        const url = window.URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');
      },
      error: (error) => {
        console.error('Error visualizando PDF de recibo:', error);
      }
    });
  }
}
