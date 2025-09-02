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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Search, Calculator, FileText, Edit, Save, Plus, Trash2 } from "lucide-react"
import Link from "next/link"

export default function LiquidacionesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchType, setSearchType] = useState("numero")
  const [selectedCurrency, setSelectedCurrency] = useState("USD")
  const [isEditing, setIsEditing] = useState(false)

  // Mock liquidation data
  const [liquidationData, setLiquidationData] = useState({
    liq_num_vac: "LIQ-2024-001",
    liq_fec_comp_tmp: "2024-01-15",
    liq_dest_vac: "Cusco - Machu Picchu",
    liq_nro_pasj_int: 4,
    liq_obsv_vac: "Grupo familiar con niños",
    cotizacion: {
      cot_num_vac: "COT-2024-001",
      cot_dest_vac: "Cusco - Machu Picchu",
      cot_cant_adt_int: 2,
      cot_cant_chd_int: 2,
      cot_mon_vac: "USD",
    },
  })

  const [travelers, setTravelers] = useState([
    {
      id: 1,
      via_nomb_vac: "Juan Carlos",
      via_ap_pat_vac: "Pérez",
      via_ap_mat_vac: "García",
      via_tip_doc_vac: "DNI",
      via_num_doc_vac: "12345678",
      via_nacio_vac: "Peruana",
    },
    {
      id: 2,
      via_nomb_vac: "María Elena",
      via_ap_pat_vac: "Pérez",
      via_ap_mat_vac: "García",
      via_tip_doc_vac: "DNI",
      via_num_doc_vac: "87654321",
      via_nacio_vac: "Peruana",
    },
  ])

  const [liquidationDetails, setLiquidationDetails] = useState([
    {
      id: 1,
      dtliq_tick_vac: "LATAM-001",
      dtliq_opera_vac: "LATAM Airlines",
      dtliq_cost_tick_dc: 450.0,
      dtliq_carg_serv_dc: 25.0,
      dtliq_val_vent_dc: 500.0,
      dtliq_fac_comp_vac: "FAC-001",
      dtliq_bol_fac_pasj_vac: "BOL-001",
      dtliq_mont_desct_dc: 0.0,
      dtliq_pag_pax_dol_dc: 500.0,
      dtliq_pag_pax_sol_dc: 1850.0,
      viajero: "Juan Carlos Pérez García",
      producto: "Vuelo Lima-Cusco",
      proveedor: "LATAM Airlines",
    },
    {
      id: 2,
      dtliq_tick_vac: "HOTEL-001",
      dtliq_opera_vac: "Marriott Hotels",
      dtliq_cost_tick_dc: 360.0,
      dtliq_carg_serv_dc: 15.0,
      dtliq_val_vent_dc: 400.0,
      dtliq_fac_comp_vac: "FAC-002",
      dtliq_bol_fac_pasj_vac: "BOL-002",
      dtliq_mont_desct_dc: 25.0,
      dtliq_pag_pax_dol_dc: 375.0,
      dtliq_pag_pax_sol_dc: 1387.5,
      viajero: "María Elena Pérez García",
      producto: "Hotel 4* Centro Histórico",
      proveedor: "Marriott Hotels",
    },
  ])

  const [observations, setObservations] = useState([
    {
      id: 1,
      obliq_desc_vac: "Descuento por grupo familiar",
      obliq_val_dc: -50.0,
      obliq_doc_vac: "Nota de Crédito",
      obliq_nro_doc_vac: "NC-001",
    },
    {
      id: 2,
      obliq_desc_vac: "Cargo por equipaje adicional",
      obliq_val_dc: 30.0,
      obliq_doc_vac: "Factura",
      obliq_nro_doc_vac: "FAC-003",
    },
  ])

  const addLiquidationDetail = () => {
    const newDetail = {
      id: Date.now(),
      dtliq_tick_vac: "",
      dtliq_opera_vac: "",
      dtliq_cost_tick_dc: 0,
      dtliq_carg_serv_dc: 0,
      dtliq_val_vent_dc: 0,
      dtliq_fac_comp_vac: "",
      dtliq_bol_fac_pasj_vac: "",
      dtliq_mont_desct_dc: 0,
      dtliq_pag_pax_dol_dc: 0,
      dtliq_pag_pax_sol_dc: 0,
      viajero: "",
      producto: "",
      proveedor: "",
    }
    setLiquidationDetails([...liquidationDetails, newDetail])
  }

  const addObservation = () => {
    const newObservation = {
      id: Date.now(),
      obliq_desc_vac: "",
      obliq_val_dc: 0,
      obliq_doc_vac: "",
      obliq_nro_doc_vac: "",
    }
    setObservations([...observations, newObservation])
  }

  const calculateTotals = () => {
    const detailsTotal = liquidationDetails.reduce((sum, detail) => sum + detail.dtliq_val_vent_dc, 0)
    const observationsTotal = observations.reduce((sum, obs) => sum + obs.obliq_val_dc, 0)
    return {
      subtotal: detailsTotal,
      adjustments: observationsTotal,
      total: detailsTotal + observationsTotal,
    }
  }

  const totals = calculateTotals()

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
                <h1 className="text-xl font-bold text-foreground">Gestión de Liquidaciones</h1>
                <p className="text-sm text-muted-foreground">Procesar liquidaciones y gestionar pagos</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isEditing ? "default" : "outline"}
                onClick={() => setIsEditing(!isEditing)}
                className={isEditing ? "bg-travel-success hover:bg-travel-success/90" : ""}
              >
                {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                {isEditing ? "Guardar Cambios" : "Editar Liquidación"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buscar Liquidaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Término de búsqueda</Label>
                <Input
                  id="search"
                  placeholder="Ingrese número de liquidación o cotización..."
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
                    <SelectItem value="cotizacion">Cotización</SelectItem>
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

        {/* Liquidation Header Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-travel-accent" />
              Liquidación {liquidationData.liq_num_vac}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="liq_num">Número de Liquidación</Label>
                <Input id="liq_num" value={liquidationData.liq_num_vac} disabled={!isEditing} />
              </div>
              <div>
                <Label htmlFor="liq_fec_comp">Fecha de Compra</Label>
                <Input id="liq_fec_comp" type="date" value={liquidationData.liq_fec_comp_tmp} disabled={!isEditing} />
              </div>
              <div>
                <Label htmlFor="liq_dest">Destino</Label>
                <Input id="liq_dest" value={liquidationData.liq_dest_vac} disabled={!isEditing} />
              </div>
              <div>
                <Label htmlFor="liq_nro_pasj">Número de Pasajeros</Label>
                <Input id="liq_nro_pasj" type="number" value={liquidationData.liq_nro_pasj_int} disabled={!isEditing} />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="liq_obsv">Observaciones Generales</Label>
              <Textarea id="liq_obsv" value={liquidationData.liq_obsv_vac} disabled={!isEditing} rows={2} />
            </div>
          </CardContent>
        </Card>

        {/* Quotation Reference */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-travel-secondary" />
              Cotización de Referencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Número de Cotización</Label>
                <Input value={liquidationData.cotizacion.cot_num_vac} disabled />
              </div>
              <div>
                <Label>Destino Original</Label>
                <Input value={liquidationData.cotizacion.cot_dest_vac} disabled />
              </div>
              <div>
                <Label>Adultos</Label>
                <Input value={liquidationData.cotizacion.cot_cant_adt_int} disabled />
              </div>
              <div>
                <Label>Niños</Label>
                <Input value={liquidationData.cotizacion.cot_cant_chd_int} disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Detalles de Liquidación</TabsTrigger>
            <TabsTrigger value="travelers">Viajeros</TabsTrigger>
            <TabsTrigger value="observations">Observaciones</TabsTrigger>
          </TabsList>

          {/* Liquidation Details */}
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Detalles de Liquidación</CardTitle>
                  {isEditing && (
                    <Button
                      size="sm"
                      onClick={addLiquidationDetail}
                      className="bg-travel-primary hover:bg-travel-primary/90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Detalle
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticket</TableHead>
                        <TableHead>Operador</TableHead>
                        <TableHead>Costo Ticket</TableHead>
                        <TableHead>Cargo Servicio</TableHead>
                        <TableHead>Valor Venta</TableHead>
                        <TableHead>Factura</TableHead>
                        <TableHead>Descuento</TableHead>
                        <TableHead>Pago USD</TableHead>
                        <TableHead>Pago PEN</TableHead>
                        {isEditing && <TableHead>Acciones</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {liquidationDetails.map((detail) => (
                        <TableRow key={detail.id}>
                          <TableCell>
                            <Input value={detail.dtliq_tick_vac} disabled={!isEditing} className="w-24" />
                          </TableCell>
                          <TableCell>
                            <Input value={detail.dtliq_opera_vac} disabled={!isEditing} className="w-32" />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={detail.dtliq_cost_tick_dc}
                              disabled={!isEditing}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={detail.dtliq_carg_serv_dc}
                              disabled={!isEditing}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={detail.dtliq_val_vent_dc}
                              disabled={!isEditing}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input value={detail.dtliq_fac_comp_vac} disabled={!isEditing} className="w-24" />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={detail.dtliq_mont_desct_dc}
                              disabled={!isEditing}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={detail.dtliq_pag_pax_dol_dc}
                              disabled={!isEditing}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={detail.dtliq_pag_pax_sol_dc}
                              disabled={!isEditing}
                              className="w-24"
                            />
                          </TableCell>
                          {isEditing && (
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setLiquidationDetails(liquidationDetails.filter((d) => d.id !== detail.id))
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Travelers */}
          <TabsContent value="travelers">
            <Card>
              <CardHeader>
                <CardTitle>Viajeros Registrados</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombres</TableHead>
                      <TableHead>Apellido Paterno</TableHead>
                      <TableHead>Apellido Materno</TableHead>
                      <TableHead>Tipo Documento</TableHead>
                      <TableHead>Número Documento</TableHead>
                      <TableHead>Nacionalidad</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {travelers.map((traveler) => (
                      <TableRow key={traveler.id}>
                        <TableCell className="font-medium">{traveler.via_nomb_vac}</TableCell>
                        <TableCell>{traveler.via_ap_pat_vac}</TableCell>
                        <TableCell>{traveler.via_ap_mat_vac}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{traveler.via_tip_doc_vac}</Badge>
                        </TableCell>
                        <TableCell>{traveler.via_num_doc_vac}</TableCell>
                        <TableCell>{traveler.via_nacio_vac}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Observations */}
          <TabsContent value="observations">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Observaciones y Ajustes</CardTitle>
                  {isEditing && (
                    <Button size="sm" onClick={addObservation} className="bg-travel-accent hover:bg-travel-accent/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Observación
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Tipo Documento</TableHead>
                      <TableHead>Número Documento</TableHead>
                      {isEditing && <TableHead>Acciones</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {observations.map((obs) => (
                      <TableRow key={obs.id}>
                        <TableCell>
                          <Input value={obs.obliq_desc_vac} disabled={!isEditing} className="w-64" />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={obs.obliq_val_dc}
                              disabled={!isEditing}
                              className="w-24"
                            />
                            <Badge variant={obs.obliq_val_dc >= 0 ? "default" : "destructive"}>
                              {obs.obliq_val_dc >= 0 ? "Cargo" : "Descuento"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select disabled={!isEditing}>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder={obs.obliq_doc_vac} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="factura">Factura</SelectItem>
                              <SelectItem value="boleta">Boleta</SelectItem>
                              <SelectItem value="nota_credito">Nota de Crédito</SelectItem>
                              <SelectItem value="nota_debito">Nota de Débito</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input value={obs.obliq_nro_doc_vac} disabled={!isEditing} className="w-32" />
                        </TableCell>
                        {isEditing && (
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setObservations(observations.filter((o) => o.id !== obs.id))}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-travel-success" />
              Resumen de Liquidación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Subtotal Servicios</p>
                <p className="text-xl font-bold text-travel-primary">USD {totals.subtotal.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Ajustes</p>
                <p
                  className={`text-xl font-bold ${totals.adjustments >= 0 ? "text-travel-warning" : "text-travel-success"}`}
                >
                  USD {totals.adjustments.toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-travel-success/10 rounded-lg border border-travel-success/20">
                <p className="text-sm text-muted-foreground">Total Final</p>
                <p className="text-2xl font-bold text-travel-success">USD {totals.total.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge className="bg-travel-accent text-travel-accent-foreground">En Proceso</Badge>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button className="bg-travel-accent hover:bg-travel-accent/90">Finalizar Liquidación</Button>
              <Button variant="outline">Generar Reporte</Button>
              <Button variant="outline">Exportar PDF</Button>
              <Button variant="outline">Enviar por Email</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
