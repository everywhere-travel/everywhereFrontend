import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Liquidacion } from '../../models/liquidacion.model';
import { NavbarComponent } from "../shared/navbar/navbar.component";


@Component({
  selector: 'app-liquidaciones',
  standalone: true,
  templateUrl: './liquidaciones.component.html',
  styleUrls: ['./liquidaciones.component.css'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NavbarComponent]
})
export class LiquidacionesComponent implements OnInit {

  // Formularios
  searchForm!: FormGroup;
  liquidacionForm!: FormGroup;

  // Variables de control
  showForm = false;
  editingId: number | null = null;
  loading = false;

  // Datos principales
  liquidaciones: Liquidacion[] = [];
  cotizaciones: any[] = [];
  viajeros: any[] = [];
  operadores: any[] = [];
  proveedores: any[] = [];
  estados = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'completada', label: 'Completada' },
    { value: 'anulada', label: 'Anulada' }
  ];

  // Otros
  detallesLiquidacion: any[] = [];
  selectedCotizacion: any = null;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    console.log('LiquidacionesComponent inicializado');

    // Inicializar formularios
    this.searchForm = this.fb.group({
      searchType: ['numero'],
      searchValue: ['']
    });

    this.liquidacionForm = this.fb.group({
      numero: [''],
      fechaLiquidacion: [''],
      cotizacionId: [''],
      estado: [''],
      viajeroId: [''],
      numeroTicket: [''],
      operadorId: [''],
      proveedorId: [''],
      costoServicio: [0],
      cargoServicio: [0],
      valorVenta: [0],
      cargoAdicional: [0],
      descuento: [0],
      numeroFactura: [''],
      numeroRecibo: [''],
      pagoSoles: [0],
      pagoDolares: [0],
      pagoEuros: [0],
      observaciones: ['']
    });

    this.cotizaciones = [
      { id: 1, numero: 'COT-001', total: 5000, fechaViaje: new Date(), numeroAdultos: 2, numeroNinos: 1 },
      { id: 2, numero: 'COT-002', total: 8000, fechaViaje: new Date(), numeroAdultos: 4, numeroNinos: 0 }
    ];

    this.viajeros = [
      { id: 1, nombre: 'Juan', apellido: 'Pérez' },
      { id: 2, nombre: 'María', apellido: 'Gómez' }
    ];
  }

  // Métodos con console.log
  searchLiquidaciones(): void { console.log('Buscar liquidaciones'); }
  toggleForm(): void { console.log('Mostrar/Ocultar formulario de liquidación'); }
  onSubmit(): void { console.log('Formulario de liquidación enviado'); }
  onCotizacionChange(): void { console.log('Cambio de cotización en el formulario'); }
  calculateTotal(): number { console.log('Calcular total de la liquidación'); return 0; }
  calculateTotalPayments(): number { console.log('Calcular total de pagos'); return 0; }
  getPaymentBalance(): number { console.log('Calcular saldo de la liquidación'); return 0; }
  updateDetailSubtotal(i: number): void { console.log('Actualizar subtotal del detalle en posición:', i); }
  getCotizacionNumber(id: number): string { console.log('Obtener número de cotización con ID:', id); return ''; }
  getViajeroName(id: number): string { console.log('Obtener nombre del viajero con ID:', id); return ''; }
  getEstadoBadgeClass(estado: string): string { console.log('Obtener clase CSS para estado:', estado); return ''; }
  editLiquidacion(liquidacion: any): void { console.log('Editar liquidación:', liquidacion); }
  deleteLiquidacion(id: number): void { console.log('Eliminar liquidación con ID:', id); }
}
