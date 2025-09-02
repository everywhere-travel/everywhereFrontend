"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Package } from "lucide-react"

interface Product {
  id: number
  codigo: string
  descripcion: string
  precio: number
  categoria: string
  proveedor: string
}

interface ProductCatalogProps {
  onSelectProduct: (product: Product) => void
  currency: string
}

export function ProductCatalog({ onSelectProduct, currency }: ProductCatalogProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Mock product catalog
  const products: Product[] = [
    {
      id: 1,
      codigo: "TRANS001",
      descripcion: "Vuelo Lima - Cusco (Ida y Vuelta)",
      precio: 450.0,
      categoria: "transporte",
      proveedor: "LATAM Airlines",
    },
    {
      id: 2,
      codigo: "HOTEL001",
      descripcion: "Hotel 4* Centro Histórico Cusco (3 noches)",
      precio: 360.0,
      categoria: "alojamiento",
      proveedor: "Marriott Hotels",
    },
    {
      id: 3,
      codigo: "TOUR001",
      descripcion: "Tour Machu Picchu Full Day",
      precio: 180.0,
      categoria: "tours",
      proveedor: "Condor Travel",
    },
    {
      id: 4,
      codigo: "ALIM001",
      descripcion: "Desayuno Buffet (3 días)",
      precio: 90.0,
      categoria: "alimentacion",
      proveedor: "Hotel Restaurant",
    },
    {
      id: 5,
      codigo: "SEG001",
      descripcion: "Seguro de Viaje Internacional",
      precio: 45.0,
      categoria: "seguros",
      proveedor: "Rimac Seguros",
    },
    {
      id: 6,
      codigo: "TRANS002",
      descripcion: "Transfer Aeropuerto - Hotel",
      precio: 25.0,
      categoria: "transporte",
      proveedor: "Transfer Service",
    },
  ]

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.categoria === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleSelectProduct = (product: Product) => {
    onSelectProduct(product)
    setOpen(false)
  }

  const getCategoryColor = (categoria: string) => {
    const colors = {
      transporte: "bg-blue-100 text-blue-800",
      alojamiento: "bg-green-100 text-green-800",
      tours: "bg-purple-100 text-purple-800",
      alimentacion: "bg-orange-100 text-orange-800",
      seguros: "bg-red-100 text-red-800",
      otros: "bg-gray-100 text-gray-800",
    }
    return colors[categoria as keyof typeof colors] || colors.otros
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Package className="w-4 h-4 mr-2" />
          Catálogo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Catálogo de Productos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar productos</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por nombre o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="category">Categoría</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="transporte">Transporte</SelectItem>
                  <SelectItem value="alojamiento">Alojamiento</SelectItem>
                  <SelectItem value="tours">Tours</SelectItem>
                  <SelectItem value="alimentacion">Alimentación</SelectItem>
                  <SelectItem value="seguros">Seguros</SelectItem>
                  <SelectItem value="otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleSelectProduct(product)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-medium">{product.codigo}</CardTitle>
                    <Badge className={getCategoryColor(product.categoria)}>{product.categoria}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{product.descripcion}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{product.proveedor}</span>
                    <span className="font-semibold text-travel-primary">
                      {currency} {product.precio.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron productos que coincidan con los criterios de búsqueda.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
