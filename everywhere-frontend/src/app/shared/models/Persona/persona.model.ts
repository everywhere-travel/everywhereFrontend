export interface PersonaRequest {
  email?: string
  telefono?: string
  direccion?: string
  observacion?: string
}

export interface PersonaResponse {
  id: number
  email?: string
  telefono?: string
  direccion?: string
  observacion?: string
  creado: string
  actualizado: string
}

export interface personaDisplay {
  id: number;
  tipo: string; // 'JURIDICA' | 'NATURAL' | etc.
  identificador: string; // RUC, DNI, etc.
  nombre: string;
}
