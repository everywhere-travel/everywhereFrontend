import { Injectable } from "@angular/core"
import type { Observable } from "rxjs"
import type { ApiService } from "./api.service"
import type { Persona, PersonaNatural, PersonaJuridica, Viajero } from "../models/persona.model"

@Injectable({
  providedIn: "root",
})
export class PersonaService {
  constructor(private apiService: ApiService) {}

  // Persona Natural operations
  getPersonasNaturales(): Observable<PersonaNatural[]> {
    return this.apiService.get<PersonaNatural[]>("personas-naturales")
  }

  getPersonaNatural(id: number): Observable<PersonaNatural> {
    return this.apiService.get<PersonaNatural>(`personas-naturales/${id}`)
  }

  createPersonaNatural(persona: PersonaNatural): Observable<PersonaNatural> {
    return this.apiService.post<PersonaNatural>("personas-naturales", persona)
  }

  updatePersonaNatural(id: number, persona: PersonaNatural): Observable<PersonaNatural> {
    return this.apiService.put<PersonaNatural>(`personas-naturales/${id}`, persona)
  }

  deletePersonaNatural(id: number): Observable<void> {
    return this.apiService.delete<void>(`personas-naturales/${id}`)
  }

  // Persona Juridica operations
  getPersonasJuridicas(): Observable<PersonaJuridica[]> {
    return this.apiService.get<PersonaJuridica[]>("personas-juridicas")
  }

  createPersonaJuridica(persona: PersonaJuridica): Observable<PersonaJuridica> {
    return this.apiService.post<PersonaJuridica>("personas-juridicas", persona)
  }

  // Viajero operations
  getViajeros(): Observable<Viajero[]> {
    return this.apiService.get<Viajero[]>("viajeros")
  }

  createViajero(viajero: Viajero): Observable<Viajero> {
    return this.apiService.post<Viajero>("viajeros", viajero)
  }

  // Search operations
  searchPersonas(query: string, tipo: string): Observable<Persona[]> {
    return this.apiService.search<Persona[]>("personas/search", { q: query, tipo: tipo })
  }
}
