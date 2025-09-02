export interface Persona {
  id?: number
  nombre: string
  apellido: string
  telefono?: string
  email?: string
  direccion?: string
  fechaCreacion?: Date
  fechaActualizacion?: Date
}

export interface PersonaNatural extends Persona {
  tipoDocumento: string
  numeroDocumento: string
  fechaNacimiento?: Date
  nacionalidad?: string
}

export interface PersonaJuridica extends Persona {
  ruc: string
  razonSocial: string
  representanteLegal?: string
  tipoEmpresa?: string
}

export interface Viajero extends Persona {
  pasaporte?: string
  fechaVencimientoPasaporte?: Date
  paisEmisionPasaporte?: string
  contactoEmergencia?: string
  telefonoEmergencia?: string
}
