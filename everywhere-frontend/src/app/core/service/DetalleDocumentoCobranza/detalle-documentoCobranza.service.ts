import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DetalleDocumentoCobranzaRequestDTO,
  DetalleDocumentoCobranzaResponseDTO
} from '../../../shared/models/DocumetnoCobranza/detalleDocumentoCobranza.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DetalleDocumentoCobranzaService {
  private apiUrl = `${environment.baseURL}/detalle-documento-cobranza`;

  constructor(private http: HttpClient) { }

  // Obtener todos los detalles
  getAllDetalles(): Observable<DetalleDocumentoCobranzaResponseDTO[]> {
    return this.http.get<DetalleDocumentoCobranzaResponseDTO[]>(this.apiUrl);
  }

  // Obtener detalle por ID
  getDetalleById(id: number): Observable<DetalleDocumentoCobranzaResponseDTO> {
    return this.http.get<DetalleDocumentoCobranzaResponseDTO>(`${this.apiUrl}/${id}`);
  }

  // Obtener detalles por documento cobranza ID
  getDetallesByDocumentoCobranza(documentoId: number): Observable<DetalleDocumentoCobranzaResponseDTO[]> {
    return this.http.get<DetalleDocumentoCobranzaResponseDTO[]>(`${this.apiUrl}/documento-cobranza/${documentoId}`);
  }

  // Crear nuevo detalle
  createDetalle(dto: DetalleDocumentoCobranzaRequestDTO): Observable<DetalleDocumentoCobranzaResponseDTO> {
    return this.http.post<DetalleDocumentoCobranzaResponseDTO>(this.apiUrl, dto);
  }

  // Actualizar detalle existente
  updateDetalle(id: number, dto: DetalleDocumentoCobranzaRequestDTO): Observable<DetalleDocumentoCobranzaResponseDTO> {
    return this.http.put<DetalleDocumentoCobranzaResponseDTO>(`${this.apiUrl}/${id}`, dto);
  }

  // Eliminar detalle
  deleteDetalle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
