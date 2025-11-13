export interface TelefonoPersonaRequest {
   numero: string
   codigoPais: string
   tipo: string
   descripcion?: string
}

export interface TelefonoPersonaResponse {
   id: number
   numero: string
   codigoPais: string
   tipo: string
   descripcion?: string
   creado: string
   actualizado: string
}
