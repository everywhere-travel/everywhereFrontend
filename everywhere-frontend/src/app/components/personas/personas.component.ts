import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavbarComponent } from "../shared/navbar/navbar.component";

@Component({
  selector: 'app-personas',
  standalone: true,
  templateUrl: './personas.component.html',
  styleUrls: ['./personas.component.css'],
  imports: [
    CommonModule,
    FormsModule, // 👈 Para [(ngModel)]
    ReactiveFormsModule // 👈 Para [formGroup] y formControlName
    ,
    NavbarComponent
]
})
export class PersonasComponent implements OnInit {

  // Formularios
  personaNaturalForm!: FormGroup;
  personaJuridicaForm!: FormGroup;
  viajeroForm!: FormGroup;

  // Variables de control
  searchQuery: string = '';
  showForm: boolean = false;
  activeTab: string = 'natural';
  editingId: number | null = null;
  loading: boolean = false;

  // Datos simulados
  currentData: any[] = [];
  personasNaturales: any[] = [];
  personasJuridicas: any[] = [];
  viajeros: any[] = [];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    console.log('PersonasComponent inicializado');

    // Inicializar formularios
    this.personaNaturalForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', Validators.required],
      tipoDocumento: ['', Validators.required],
      numeroDocumento: ['', Validators.required],
      telefono: [''],
      email: [''],
      direccion: [''],
      fechaNacimiento: [''],
      nacionalidad: ['']
    });

    this.personaJuridicaForm = this.fb.group({
      ruc: ['', Validators.required],
      razonSocial: ['', Validators.required],
      representanteLegal: [''],
      tipoEmpresa: [''],
      telefono: [''],
      email: [''],
      direccion: ['']
    });

    this.viajeroForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      telefono: [''],
      email: [''],
      direccion: [''],
      pasaporte: [''],
      fechaVencimientoPasaporte: [''],
      paisEmisionPasaporte: [''],
      contactoEmergencia: [''],
      telefonoEmergencia: ['']
    });
  }

  // Métodos vacíos con console.log
  searchPersonas(): void { console.log('Buscar personas:', this.searchQuery); }
  setActiveTab(tab: string): void { this.activeTab = tab; console.log('Tab activo:', tab); }
  toggleForm(): void { this.showForm = !this.showForm; console.log('Mostrar formulario:', this.showForm); }
  onSubmit(): void { console.log('Formulario enviado, tab activo:', this.activeTab); }
  editPersona(persona: any): void { this.editingId = persona.id; this.showForm = true; console.log('Editar persona:', persona); }
  deletePersona(id: number): void { console.log('Eliminar persona con ID:', id); }
}
