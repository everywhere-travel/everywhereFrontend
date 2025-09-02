"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"

interface AddProductModalProps {
  onAddProduct: (product: any) => void
  currency: string
}

export function AddProductModal({ onAddProduct, currency }: AddProductModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    codigo: "",
    descripcion: "",
    cantidad: 1,
    precio: 0,
    proveedor: "",
    categoria: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newProduct = {
      id: Date.now(),
      codigo: formData.codigo,
      descripcion: formData.descripcion,
      cantidad: formData.cantidad,
      precio: formData.precio,
      total: formData.cantidad * formData.precio,
      proveedor: formData.proveedor,
      categoria: formData.categoria,
    }
    onAddProduct(newProduct)
    setFormData({
      codigo: "",
      descripcion: "",
      cantidad: 1,
      precio: 0,
      proveedor: "",
      categoria: "",
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-travel-primary hover:bg-travel-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Producto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Producto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="codigo">Código del Producto *</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="PROD001"
                required
              />
            </div>
            <div>
              <Label htmlFor="categoria">Categoría</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transporte">Transporte</SelectItem>
                  <SelectItem value="alojamiento">Alojamiento</SelectItem>
                  <SelectItem value="alimentacion">Alimentación</SelectItem>
                  <SelectItem value="tours">Tours</SelectItem>
                  <SelectItem value="seguros">Seguros</SelectItem>
                  <SelectItem value="otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción *</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripción detallada del producto o servicio"
              required
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cantidad">Cantidad *</Label>
              <Input
                id="cantidad"
                type="number"
                min="1"
                value={formData.cantidad}
                onChange={(e) => setFormData({ ...formData, cantidad: Number.parseInt(e.target.value) || 1 })}
                required
              />
            </div>
            <div>
              <Label htmlFor="precio">Precio Unitario ({currency}) *</Label>
              <Input
                id="precio"
                type="number"
                step="0.01"
                min="0"
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: Number.parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="proveedor">Proveedor</Label>
            <Select
              value={formData.proveedor}
              onValueChange={(value) => setFormData({ ...formData, proveedor: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar proveedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latam">LATAM Airlines</SelectItem>
                <SelectItem value="avianca">Avianca</SelectItem>
                <SelectItem value="marriott">Marriott Hotels</SelectItem>
                <SelectItem value="hilton">Hilton Hotels</SelectItem>
                <SelectItem value="condor">Condor Travel</SelectItem>
                <SelectItem value="otros">Otros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total:</span>
              <span className="font-semibold">
                {currency} {(formData.cantidad * formData.precio).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1 bg-travel-primary hover:bg-travel-primary/90">
              Agregar Producto
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
