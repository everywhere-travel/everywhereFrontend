"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, Plus, FileText, Trash2, Edit, DollarSign } from "lucide-react"
import Link from "next/link"
import { AddProductModal } from "@/components/product-management/add-product-modal"
import { HotelGroupModal } from "@/components/product-management/hotel-group-modal"
import { ProductCatalog } from "@/components/product-management/product-catalog"

export default function CotizacionesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchType, setSearchType] = useState("numero")
  const [selectedCurrency, setSelectedCurrency] = useState("USD")
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [adultsCount, setAdultsCount] = useState(2)
  const [childrenCount, setChildrenCount] = useState(0)

  // Mock data for demonstration
  const [fixedProducts, setFixedProducts] = useState([
    {
      id: 1,
      codigo: "TRANS001",
      descripcion: "Transporte Aereo Lima-Cusco",
      cantidad: 2,
      precio: 450.0,
      total: 900.0,
      categoria: "transporte",
      proveedor: "LATAM Airlines",
    },
    {
      id: 2,
      codigo: "HOTEL001",
      descripcion: "Hotel 4* Centro Historico",
      cantidad: 3,
      precio: 120.0,
      total: 360.0,
      categoria: "alojamiento",
      proveedor: "Marriott Hotels",
    },
  ])

  const [hotelGroups, setHotelGroups] = useState([
    {
      id: 1,
      nombre: "Grupo Hoteles Cusco",
      hoteles: [
        {
          id: 1,
          nombre: "Hotel Monasterio",
          precio: 280.0,
          selected: true,
          descripcion: "Hotel de lujo en centro histórico",
        },
        {
          id: 2,
          nombre: "Hotel Libertador",
          precio: 220.0,
          selected: false,
          descripcion: "Hotel 4 estrellas con vista a la plaza",
        },
        {
          id: 3,
          nombre: "Hotel Casa Andina",
          precio: 180.0,
          selected: false,
          descripcion: "Hotel boutique tradicional",
        },
      ],
    },
    {
      id: 2,
      nombre: "Grupo Hoteles Machu Picchu",
      hoteles: [
        { id: 4, nombre: "Inkaterra Machu Picchu", precio: 450.0, selected: false, descripcion: "Eco-lodge de lujo" },
        { id: 5, nombre: "Sumaq Machu Picchu", precio: 380.0, selected: true, descripcion: "Hotel boutique con spa" },
      ],
    },
  ])

  const addProduct = (product: any) => {
    setFixedProducts([...fixedProducts, product])
  }

  const addProductFromCatalog = (product: any) => {
    const newProduct = {
      ...product,
      id: Date.now(),
      cantidad: 1,
      total: product.precio,
    }
    setFixedProducts([...fixedProducts, newProduct])
  }

  const addHotelGroup = (group: any) => {
    setHotelGroups([...hotelGroups, group])
  }

  const removeFixedProduct = (id: number) => {
    setFixedProducts((prev) => prev.filter((product) => product.id !== id))
  }

  const toggleHotelSelection = (groupId: number, hotelId: number) => {
    setHotelGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              hoteles: group.hoteles.map((hotel) =>
                hotel.id === hotelId ? { ...hotel, selected: !hotel.selected } : hotel,
              ),
            }
          : group,
      ),
    )
  }

  const calculateTotal = () => {
    const fixedTotal = fixedProducts.reduce((sum, product) => sum + product.total, 0)
    const hotelTotal = hotelGroups.reduce(
      (sum, group) =>
        sum + group.hoteles.filter((hotel) => hotel.selected).reduce((hotelSum, hotel) => hotelSum + hotel.precio, 0),
      0,
    )
    return fixedTotal + hotelTotal
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">Gestión de Cotizaciones</h1>
                <p className="text-sm text-muted-foreground">Crear y gestionar cotizaciones de paquetes turísticos</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button className="bg-travel-secondary hover:bg-travel-secondary/90">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Cotización
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buscar Cotizaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Término de búsqueda</Label>
                <Input
                  id="search"
                  placeholder="Ingrese número de cotización o nombre del cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full md:w-48">
                <Label htmlFor="searchType">Buscar por</Label>
                <Select value={searchType} onValueChange={setSearchType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="numero">Número</SelectItem>
                    <SelectItem value="nombre">Nombre Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button className="bg-travel-primary hover:bg-travel-primary/90">
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quotation Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-travel-secondary" />
              Nueva Cotización
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cot_num">Número de Cotización</Label>
                  <Input id="cot_num" placeholder="COT-2024-001" />
                </div>
                <div>
                  <Label htmlFor="cot_dest">Destino</Label>
                  <Input id="cot_dest" placeholder="Cusco - Machu Picchu" />
                </div>
                <div>
                  <Label htmlFor="cot_mon">Moneda</Label>
                  <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - Dólares</SelectItem>
                      <SelectItem value="PEN">PEN - Soles</SelectItem>
                      <SelectItem value="EUR">EUR - Euros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="cot_fec_emi">Fecha Emisión</Label>
                  <Input id="cot_fec_emi" type="date" />
                </div>
                <div>
                  <Label htmlFor="cot_fec_venc">Fecha Vencimiento</Label>
                  <Input id="cot_fec_venc" type="date" />
                </div>
                <div>
                  <Label htmlFor="cot_fec_sal">Fecha Salida</Label>
                  <Input id="cot_fec_sal" type="date" />
                </div>
                <div>
                  <Label htmlFor="cot_fec_reg">Fecha Regreso</Label>
                  <Input id="cot_fec_reg" type="date" />
                </div>
              </div>

              {/* Passengers and Payment */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="cot_cant_adt">Adultos</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAdultsCount(Math.max(1, adultsCount - 1))}
                    >
                      -
                    </Button>
                    <Input
                      id="cot_cant_adt"
                      value={adultsCount}
                      onChange={(e) => setAdultsCount(Number.parseInt(e.target.value) || 1)}
                      className="text-center"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => setAdultsCount(adultsCount + 1)}>
                      +
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="cot_cant_chd">Niños</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                    >
                      -
                    </Button>
                    <Input
                      id="cot_cant_chd"
                      value={childrenCount}
                      onChange={(e) => setChildrenCount(Number.parseInt(e.target.value) || 0)}
                      className="text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setChildrenCount(childrenCount + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="form_pago">Forma de Pago</Label>
                  <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta de Crédito</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="deposito">Depósito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="borrador">Borrador</SelectItem>
                      <SelectItem value="enviada">Enviada</SelectItem>
                      <SelectItem value="aprobada">Aprobada</SelectItem>
                      <SelectItem value="rechazada">Rechazada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Observations */}
              <div>
                <Label htmlFor="cot_obs">Observaciones</Label>
                <Textarea id="cot_obs" placeholder="Notas adicionales sobre la cotización..." rows={3} />
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Enhanced Fixed Products Table */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Productos Fijos</CardTitle>
              <div className="flex gap-2">
                <ProductCatalog onSelectProduct={addProductFromCatalog} currency={selectedCurrency} />
                <AddProductModal onAddProduct={addProduct} currency={selectedCurrency} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Precio Unit.</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fixedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.codigo}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.descripcion}</p>
                        {product.proveedor && <p className="text-xs text-muted-foreground">{product.proveedor}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.categoria && (
                        <Badge className={getCategoryColor(product.categoria)}>{product.categoria}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{product.cantidad}</TableCell>
                    <TableCell>
                      {selectedCurrency} {product.precio.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {selectedCurrency} {product.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => removeFixedProduct(product.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {fixedProducts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay productos agregados. Use los botones de arriba para agregar productos.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Dynamic Hotel Groups */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Grupos de Hoteles (Dinámico)</CardTitle>
              <HotelGroupModal onAddGroup={addHotelGroup} currency={selectedCurrency} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {hotelGroups.map((group) => (
                <div key={group.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{group.nombre}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {group.hoteles.filter((hotel) => hotel.selected).length} seleccionados
                      </Badge>
                      <Badge variant="secondary">
                        {selectedCurrency}{" "}
                        {group.hoteles
                          .filter((hotel) => hotel.selected)
                          .reduce((sum, hotel) => sum + hotel.precio, 0)
                          .toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.hoteles.map((hotel) => (
                      <div
                        key={hotel.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          hotel.selected
                            ? "border-travel-primary bg-travel-primary/5"
                            : "border-border hover:border-travel-primary/50"
                        }`}
                        onClick={() => toggleHotelSelection(group.id, hotel.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium">{hotel.nombre}</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedCurrency} {hotel.precio.toFixed(2)} / noche
                            </p>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                              hotel.selected ? "bg-travel-primary border-travel-primary" : "border-border"
                            }`}
                          />
                        </div>
                        {hotel.descripcion && <p className="text-xs text-muted-foreground">{hotel.descripcion}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {hotelGroups.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No hay grupos de hoteles creados. Use el botón "Nuevo Grupo" para crear uno.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary and Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-travel-success" />
              Resumen de Cotización
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Productos Fijos</p>
                  <p className="text-xl font-bold text-travel-primary">
                    {selectedCurrency} {fixedProducts.reduce((sum, product) => sum + product.total, 0).toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Hoteles Seleccionados</p>
                  <p className="text-xl font-bold text-travel-secondary">
                    {selectedCurrency}{" "}
                    {hotelGroups
                      .reduce(
                        (sum, group) =>
                          sum +
                          group.hoteles
                            .filter((hotel) => hotel.selected)
                            .reduce((hotelSum, hotel) => hotelSum + hotel.precio, 0),
                        0,
                      )
                      .toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-travel-success/10 rounded-lg border border-travel-success/20">
                  <p className="text-sm text-muted-foreground">Total General</p>
                  <p className="text-2xl font-bold text-travel-success">
                    {selectedCurrency} {calculateTotal().toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {adultsCount} adultos, {childrenCount} niños
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button className="bg-travel-secondary hover:bg-travel-secondary/90">Guardar Cotización</Button>
                <Button variant="outline">Generar PDF</Button>
                <Button variant="outline">Enviar por Email</Button>
                <Button variant="outline">Limpiar Formulario</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
