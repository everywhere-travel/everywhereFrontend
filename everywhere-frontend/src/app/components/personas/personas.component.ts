import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule, ReactiveFormsModule, type FormBuilder, type FormGroup, Validators } from "@angular/forms"
import type { PersonaService } from "../../services/persona.service"
import type { PersonaNatural, PersonaJuridica, Viajero } from "../../models/persona.model"

@Component({
  selector: "app-personas",
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: "./personas.component.html",
  styleUrls: ["./personas.component.css"],
})
export class PersonasComponent implements OnInit {
  activeTab: "natural" | "juridica" | "viajero" = "natural"
  searchQuery = ""

  // Forms
  personaNaturalForm: FormGroup
  personaJuridicaForm: FormGroup
  viajeroForm: FormGroup

  // Data
  personasNaturales: PersonaNatural[] = []
  personasJuridicas: PersonaJuridica[] = []
  viajeros: Viajero[] = []

  // UI State
  showForm = false
  editingId: number | null = null
  loading = false

  constructor(
    private personaService: PersonaService,
    private fb: FormBuilder,
  ) {
    this.personaNaturalForm = this.createPersonaNaturalForm()
    this.personaJuridicaForm = this.createPersonaJuridicaForm()
    this.viajeroForm = this.createViajeroForm()
  }

  ngOnInit() {
    this.loadData()
  }

  private createPersonaNaturalForm(): FormGroup {
    return this.fb.group({
      nombre: ["", [Validators.required, Validators.minLength(2)]],
      apellido: ["", [Validators.required, Validators.minLength(2)]],
      tipoDocumento: ["DNI", Validators.required],
      numeroDocumento: ["", [Validators.required, Validators.minLength(8)]],
      telefono: [""],
      email: ["", [Validators.email]],
      direccion: [""],
      fechaNacimiento: [""],
      nacionalidad: ["Peruana"],
    })
  }

  private createPersonaJuridicaForm(): FormGroup {
    return this.fb.group({
      nombre: ["", [Validators.required, Validators.minLength(2)]],
      apellido: [""],
      ruc: ["", [Validators.required, Validators.minLength(11)]],
      razonSocial: ["", [Validators.required, Validators.minLength(3)]],
      representanteLegal: [""],
      tipoEmpresa: [""],
      telefono: [""],
      email: ["", [Validators.email]],
      direccion: [""],
    })
  }

  private createViajeroForm(): FormGroup {
    return this.fb.group({
      nombre: ["", [Validators.required, Validators.minLength(2)]],
      apellido: ["", [Validators.required, Validators.minLength(2)]],
      telefono: [""],
      email: ["", [Validators.email]],
      direccion: [""],
      pasaporte: [""],
      fechaVencimientoPasaporte: [""],
      paisEmisionPasaporte: [""],
      contactoEmergencia: [""],
      telefonoEmergencia: [""],
    })
  }

  loadData() {
    this.loading = true

    this.personaService.getPersonasNaturales().subscribe({
      next: (data) => (this.personasNaturales = data),
      error: (error) => console.error("Error loading personas naturales:", error),
    })

    this.personaService.getPersonasJuridicas().subscribe({
      next: (data) => (this.personasJuridicas = data),
      error: (error) => console.error("Error loading personas juridicas:", error),
    })

    this.personaService.getViajeros().subscribe({
      next: (data) => {
        this.viajeros = data
        this.loading = false
      },
      error: (error) => {
        console.error("Error loading viajeros:", error)
        this.loading = false
      },
    })
  }

  setActiveTab(tab: "natural" | "juridica" | "viajero") {
    this.activeTab = tab
    this.showForm = false
    this.editingId = null
  }

  toggleForm() {
    this.showForm = !this.showForm
    this.editingId = null
    this.resetCurrentForm()
  }

  resetCurrentForm() {
    switch (this.activeTab) {
      case "natural":
        this.personaNaturalForm.reset()
        break
      case "juridica":
        this.personaJuridicaForm.reset()
        break
      case "viajero":
        this.viajeroForm.reset()
        break
    }
  }

  onSubmit() {
    const currentForm = this.getCurrentForm()
    if (currentForm.valid) {
      const formData = currentForm.value

      switch (this.activeTab) {
        case "natural":
          this.savePersonaNatural(formData)
          break
        case "juridica":
          this.savePersonaJuridica(formData)
          break
        case "viajero":
          this.saveViajero(formData)
          break
      }
    }
  }

  private getCurrentForm(): FormGroup {
    switch (this.activeTab) {
      case "natural":
        return this.personaNaturalForm
      case "juridica":
        return this.personaJuridicaForm
      case "viajero":
        return this.viajeroForm
    }
  }

  private savePersonaNatural(data: PersonaNatural) {
    if (this.editingId) {
      this.personaService.updatePersonaNatural(this.editingId, data).subscribe({
        next: () => {
          this.loadData()
          this.showForm = false
          this.editingId = null
        },
        error: (error) => console.error("Error updating persona natural:", error),
      })
    } else {
      this.personaService.createPersonaNatural(data).subscribe({
        next: () => {
          this.loadData()
          this.showForm = false
        },
        error: (error) => console.error("Error creating persona natural:", error),
      })
    }
  }

  private savePersonaJuridica(data: PersonaJuridica) {
    this.personaService.createPersonaJuridica(data).subscribe({
      next: () => {
        this.loadData()
        this.showForm = false
      },
      error: (error) => console.error("Error creating persona juridica:", error),
    })
  }

  private saveViajero(data: Viajero) {
    this.personaService.createViajero(data).subscribe({
      next: () => {
        this.loadData()
        this.showForm = false
      },
      error: (error) => console.error("Error creating viajero:", error),
    })
  }

  editPersona(persona: any) {
    this.editingId = persona.id
    this.showForm = true

    switch (this.activeTab) {
      case "natural":
        this.personaNaturalForm.patchValue(persona)
        break
      case "juridica":
        this.personaJuridicaForm.patchValue(persona)
        break
      case "viajero":
        this.viajeroForm.patchValue(persona)
        break
    }
  }

  deletePersona(id: number) {
    if (confirm("¿Está seguro de eliminar esta persona?")) {
      this.personaService.deletePersonaNatural(id).subscribe({
        next: () => this.loadData(),
        error: (error) => console.error("Error deleting persona:", error),
      })
    }
  }

  searchPersonas() {
    if (this.searchQuery.trim()) {
      this.personaService.searchPersonas(this.searchQuery, this.activeTab).subscribe({
        next: (results) => {
          switch (this.activeTab) {
            case "natural":
              this.personasNaturales = results as PersonaNatural[]
              break
            case "juridica":
              this.personasJuridicas = results as PersonaJuridica[]
              break
            case "viajero":
              this.viajeros = results as Viajero[]
              break
          }
        },
        error: (error) => console.error("Error searching personas:", error),
      })
    } else {
      this.loadData()
    }
  }

  get currentData() {
    switch (this.activeTab) {
      case "natural":
        return this.personasNaturales
      case "juridica":
        return this.personasJuridicas
      case "viajero":
        return this.viajeros
    }
  }

  get currentForm() {
    return this.getCurrentForm()
  }
}
