import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from "../../shared/components/navbar/navbar.component";

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent]
})
export class ReportesComponent implements OnInit {

  // Formularios
  filtrosForm!: FormGroup;

  // Variables de control
  isLoading = false;
  isExporting = false;
  tipoReporte: string = 'cotizaciones';

  // Filtros
  estadosDisponibles = ['Pendiente', 'Completada', 'Anulada'];
  monedasDisponibles = ['PEN', 'USD', 'EUR'];

  // Datos simulados
  cotizacionesData: any[] = [];
  liquidacionesData: any[] = [];
  rentabilidadData: any[] = [];
  tendenciasData: any[] = [];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    console.log('ReportesComponent inicializado');

    this.filtrosForm = this.fb.group({
      fechaInicio: [''],
      fechaFin: [''],
      estado: [''],
      moneda: [''],
      cliente: ['']
    });
  }

  exportarReporte(tipo: string): void {
    console.log('Exportar reporte en formato:', tipo);
  }

  cambiarTipoReporte(tipo: string): void {
    this.tipoReporte = tipo;
    console.log('Tipo de reporte cambiado a:', tipo);
  }

  generarReporte(): void {
    console.log('Generar reporte con filtros:', this.filtrosForm.value);
  }

  getTotalCotizaciones(): number {
    console.log('Calcular total de cotizaciones');
    return 0;
  }

  getTotalComisiones(): number {
    console.log('Calcular total de comisiones');
    return 0;
  }

  getTotalLiquidaciones(): number {
    console.log('Calcular total de liquidaciones');
    return 0;
  }

  getTotalPagado(): number {
    console.log('Calcular total pagado');
    return 0;
  }

  getTotalPendiente(): number {
    console.log('Calcular total pendiente');
    return 0;
  }

  formatCurrency(value: number): string {
    console.log('Formatear moneda:', value);
    return `S/ ${value}`;
  }

  formatDate(value: Date): string {
    console.log('Formatear fecha:', value);
    return value.toLocaleDateString();
  }

  formatPercentage(value: number): string {
    console.log('Formatear porcentaje:', value);
    return `${value}%`;
  }
}
