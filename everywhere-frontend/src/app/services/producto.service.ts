import { Injectable } from "@angular/core"
import type { Observable } from "rxjs"
import type { ApiService } from "./api.service"
import type { Producto, Proveedor, Operador } from "../models/producto.model"

@Injectable({
  providedIn: "root",
})
export class ProductoService {
  constructor(private apiService: ApiService) {}

  // Product operations
  getProductos(): Observable<Producto[]> {
    return this.apiService.get<Producto[]>("productos")
  }

  getProducto(id: number): Observable<Producto> {
    return this.apiService.get<Producto>(`productos/${id}`)
  }

  createProducto(producto: Producto): Observable<Producto> {
    return this.apiService.post<Producto>("productos", producto)
  }

  updateProducto(id: number, producto: Producto): Observable<Producto> {
    return this.apiService.put<Producto>(`productos/${id}`, producto)
  }

  deleteProducto(id: number): Observable<void> {
    return this.apiService.delete<void>(`productos/${id}`)
  }

  // Provider operations
  getProveedores(): Observable<Proveedor[]> {
    return this.apiService.get<Proveedor[]>("proveedores")
  }

  createProveedor(proveedor: Proveedor): Observable<Proveedor> {
    return this.apiService.post<Proveedor>("proveedores", proveedor)
  }

  // Operator operations
  getOperadores(): Observable<Operador[]> {
    return this.apiService.get<Operador[]>("operadores")
  }

  createOperador(operador: Operador): Observable<Operador> {
    return this.apiService.post<Operador>("operadores", operador)
  }

  // Search operations
  searchProductos(query: string, categoria?: string): Observable<Producto[]> {
    const params: any = { q: query }
    if (categoria) params.categoria = categoria
    return this.apiService.search<Producto[]>("productos/search", params)
  }
}
