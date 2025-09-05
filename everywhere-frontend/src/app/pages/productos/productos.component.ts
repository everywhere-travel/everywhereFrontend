import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NavbarComponent } from "../../shared/components/navbar/navbar.component";

@Component({
  selector: 'app-productos',
  standalone: true,
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NavbarComponent]
})
export class ProductosComponent implements OnInit {

    currentData: any[] = [];

  // Control
  searchQuery: string = '';
  activeTab: string = 'productos';
  showForm: boolean = false;
  editingId: number | null = null;
  loading: boolean = false;

  // Formularios
  productoForm!: FormGroup;
  proveedorForm!: FormGroup;
  operadorForm!: FormGroup;
  hotelForm!: FormGroup;

  // Datos
  productos: any[] = [];
  proveedores: any[] = [];
  operadores: any[] = [];
  hoteles: any[] = [];

  categorias = [
    { value: 'transporte', label: 'Transporte' },
    { value: 'tour', label: 'Tour' },
    { value: 'hotel', label: 'Hotel' }
  ];

  monedas = [
    { value: 'PEN', label: 'Soles (PEN)' },
    { value: 'USD', label: 'Dólares (USD)' },
    { value: 'EUR', label: 'Euros (EUR)' }
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    console.log('ProductosComponent inicializado');

    // Formularios
    this.productoForm = this.fb.group({
      codigo: [''],
      nombre: [''],
      descripcion: [''],
      categoria: [''],
      activo: [true],
      precio: [0],
      moneda: ['PEN'],
      proveedorId: [''],
      operadorId: ['']
    });

    this.proveedorForm = this.fb.group({
      nombre: [''],
      contacto: [''],
      telefono: [''],
      email: [''],
      direccion: ['']
    });

    this.operadorForm = this.fb.group({
      nombre: [''],
      codigo: [''],
      contacto: [''],
      telefono: [''],
      email: ['']
    });

    this.hotelForm = this.fb.group({
      nombre: [''],
      categoria: [''],
      ubicacion: [''],
      precioNoche: [0],
      descripcion: [''],
      servicios: [''],
      activo: [true]
    });
  }

  // Métodos de acción
  searchItems(): void {
    console.log('Buscando ítems con query:', this.searchQuery);
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    console.log('Mostrar/Ocultar formulario:', this.showForm);
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    console.log('Pestaña activa:', this.activeTab);
  }

  onSubmit(): void {
    console.log('Formulario enviado en pestaña:', this.activeTab);
  }

  editItem(item: any): void {
    console.log('Editar item:', item);
  }

  deleteItem(id: number): void {
    console.log('Eliminar item con ID:', id);
  }

  // Helpers
  getCategoriaLabel(value: string): string {
    const cat = this.categorias.find(c => c.value === value);
    return cat ? cat.label : 'Desconocido';
  }

  getProveedorName(id: number): string {
    const prov = this.proveedores.find(p => p.id === id);
    return prov ? prov.nombre : '-';
  }

  getStarRating(categoria: number): string {
    return '★'.repeat(categoria) + '☆'.repeat(5 - categoria);
  }
}
