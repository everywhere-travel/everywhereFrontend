import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, TitleCasePipe, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule,FormsModule } from '@angular/forms';
import { Cotizacion } from '../../models/cotizacion.model';
import { NavbarComponent } from "../shared/navbar/navbar.component";

@Component({
  selector: 'app-cotizaciones',
  standalone: true,
  templateUrl: './cotizaciones.component.html',
  styleUrls: ['./cotizaciones.component.css'],
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe, TitleCasePipe, DatePipe, FormsModule, NavbarComponent]
})
export class CotizacionesComponent implements OnInit {

  // 🔹 Variables principales
  loading = false;
  showForm = false;
  editingId: number | null = null;

  // 🔹 Formularios
  searchForm!: FormGroup;
  cotizacionForm!: FormGroup;

  // 🔹 Datos
  cotizaciones: Cotizacion[] = [];
  personas: any[] = [];
  estados = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'completada', label: 'Completada' },
    { value: 'anulada', label: 'Anulada' }
  ];
  monedas = [
    { value: 'PEN', label: 'Soles (PEN)' },
    { value: 'USD', label: 'Dólares (USD)' }
  ];
  formasPago = [
    { value: 'contado', label: 'Contado' },
    { value: 'tarjeta', label: 'Tarjeta' }
  ];

  // 🔹 Productos y hoteles seleccionados
  productosSeleccionados: any[] = [];
  gruposHoteles: any[] = [];
  gruposSeleccionados: any[] = [];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    console.log('CotizacionesComponent inicializado');

    // Inicializar forms
    this.searchForm = this.fb.group({
      searchType: ['numero'],
      searchValue: ['']
    });

    this.cotizacionForm = this.fb.group({
      numero: [''],
      personaId: [''],
      fechaCotizacion: [''],
      estado: [''],
      fechaViaje: [''],
      fechaRetorno: [''],
      numeroAdultos: [1],
      numeroNinos: [0],
      moneda: ['PEN'],
      tipoCambio: [3.8],
      formaPago: [''],
      observaciones: ['']
    });

    // Datos simulados
    this.personas = [
      { id: 1, nombre: 'Juan', apellido: 'Pérez' },
      { id: 2, nombre: 'María', apellido: 'Gómez' }
    ];

    this.cotizaciones = [
      {
        id: 1,
        numero: 'COT-001',
        fechaCotizacion: new Date(),
        personaId: 1,
        numeroAdultos: 2,
        numeroNinos: 1,
        moneda: 'PEN',
        tipoCambio: 3.8,
        formaPago: 'contado',
        estado: 'pendiente',
        subtotal: 2000,
        impuestos: 360,
        total: 2360
      },
      {
        id: 2,
        numero: 'COT-002',
        fechaCotizacion: new Date(),
        personaId: 2,
        numeroAdultos: 1,
        numeroNinos: 0,
        moneda: 'USD',
        tipoCambio: 3.8,
        formaPago: 'tarjeta',
        estado: 'completada',
        subtotal: 1000,
        impuestos: 180,
        total: 1180
      }
    ];
  }

  getGrupoIndex(id: number): number {
  return this.gruposSeleccionados.findIndex(g => g.id === id);
}


  // Métodos de prueba
  searchCotizaciones(): void { console.log('Buscar cotizaciones'); }
  toggleForm(): void { console.log('Mostrar/Ocultar formulario'); }
  onSubmit(): void { console.log('Formulario enviado'); }
  addProduct(): void { console.log('Agregar producto'); }
  updateProductSubtotal(i: number): void { console.log('Actualizar subtotal producto', i); }
  removeProduct(i: number): void { console.log('Eliminar producto', i); }
  isGrupoSelected(id: number): boolean { console.log('Grupo seleccionado', id); return false; }
  toggleGrupoHotel(grupo: any): void { console.log('Toggle grupo hotel', grupo); }
  toggleHotelInGroup(grupoIndex: number, hotel: any): void { console.log('Toggle hotel en grupo', grupoIndex, hotel); }
  calculateSubtotal(): number { return 0; }
  calculateTaxes(): number { return 0; }
  calculateTotal(): number { return 0; }
  getPersonaName(id: number): string { return this.personas.find(p => p.id === id)?.nombre || ''; }
  getEstadoBadgeClass(estado: string): string { return estado === 'completada' ? 'badge-success' : 'badge-warning'; }
  editCotizacion(c: Cotizacion): void { console.log('Editar cotización', c); }
  deleteCotizacion(id: number): void { console.log('Eliminar cotización', id); }
}
