"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Search, Plus, User, Building, Plane } from "lucide-react"
import Link from "next/link"

export default function PersonasPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchType, setSearchType] = useState("nombre")

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
                <h1 className="text-xl font-bold text-foreground">Gestión de Personas</h1>
                <p className="text-sm text-muted-foreground">Registrar y gestionar personas, empresas y viajeros</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buscar Personas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Término de búsqueda</Label>
                <Input
                  id="search"
                  placeholder="Ingrese nombre, documento o RUC..."
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
                    <SelectItem value="nombre">Nombre</SelectItem>
                    <SelectItem value="documento">Documento</SelectItem>
                    <SelectItem value="ruc">RUC</SelectItem>
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

        {/* Registration Tabs */}
        <Tabs defaultValue="natural" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="natural" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Persona Natural
            </TabsTrigger>
            <TabsTrigger value="juridica" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Persona Jurídica
            </TabsTrigger>
            <TabsTrigger value="viajero" className="flex items-center gap-2">
              <Plane className="w-4 h-4" />
              Viajero
            </TabsTrigger>
          </TabsList>

          {/* Persona Natural */}
          <TabsContent value="natural">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-travel-primary" />
                  Registrar Persona Natural
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  {/* Datos Personales */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nat_nomb">Nombres *</Label>
                      <Input id="nat_nomb" placeholder="Ingrese nombres completos" />
                    </div>
                    <div>
                      <Label htmlFor="nat_apell">Apellidos *</Label>
                      <Input id="nat_apell" placeholder="Ingrese apellidos completos" />
                    </div>
                    <div>
                      <Label htmlFor="nat_doc">Número de Documento *</Label>
                      <Input id="nat_doc" placeholder="DNI, CE, Pasaporte" />
                    </div>
                    <div>
                      <Label htmlFor="per_email">Email</Label>
                      <Input id="per_email" type="email" placeholder="correo@ejemplo.com" />
                    </div>
                    <div>
                      <Label htmlFor="per_telf">Teléfono</Label>
                      <Input id="per_telf" placeholder="+51 999 999 999" />
                    </div>
                  </div>

                  {/* Dirección */}
                  <div>
                    <Label htmlFor="per_direc">Dirección</Label>
                    <Input id="per_direc" placeholder="Dirección completa" />
                  </div>

                  {/* Observaciones */}
                  <div>
                    <Label htmlFor="per_obs">Observaciones</Label>
                    <Textarea id="per_obs" placeholder="Notas adicionales..." rows={3} />
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" className="bg-travel-primary hover:bg-travel-primary/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Registrar Persona Natural
                    </Button>
                    <Button type="button" variant="outline">
                      Limpiar Formulario
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Persona Jurídica */}
          <TabsContent value="juridica">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-travel-secondary" />
                  Registrar Persona Jurídica
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  {/* Datos de la Empresa */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="jurd_ruc">RUC *</Label>
                      <Input id="jurd_ruc" placeholder="20123456789" />
                    </div>
                    <div>
                      <Label htmlFor="jurd_razSocial">Razón Social *</Label>
                      <Input id="jurd_razSocial" placeholder="Nombre de la empresa" />
                    </div>
                    <div>
                      <Label htmlFor="per_email_jurd">Email Corporativo</Label>
                      <Input id="per_email_jurd" type="email" placeholder="contacto@empresa.com" />
                    </div>
                    <div>
                      <Label htmlFor="per_telf_jurd">Teléfono</Label>
                      <Input id="per_telf_jurd" placeholder="+51 01 234 5678" />
                    </div>
                  </div>

                  {/* Dirección */}
                  <div>
                    <Label htmlFor="per_direc_jurd">Dirección Fiscal</Label>
                    <Input id="per_direc_jurd" placeholder="Dirección fiscal completa" />
                  </div>

                  {/* Observaciones */}
                  <div>
                    <Label htmlFor="per_obs_jurd">Observaciones</Label>
                    <Textarea id="per_obs_jurd" placeholder="Notas adicionales..." rows={3} />
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" className="bg-travel-secondary hover:bg-travel-secondary/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Registrar Persona Jurídica
                    </Button>
                    <Button type="button" variant="outline">
                      Limpiar Formulario
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Viajero */}
          <TabsContent value="viajero">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="w-5 h-5 text-travel-accent" />
                  Registrar Viajero
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  {/* Datos Personales del Viajero */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="via_nomb">Nombres *</Label>
                      <Input id="via_nomb" placeholder="Nombres completos" />
                    </div>
                    <div>
                      <Label htmlFor="via_ap_pat">Apellido Paterno *</Label>
                      <Input id="via_ap_pat" placeholder="Apellido paterno" />
                    </div>
                    <div>
                      <Label htmlFor="via_ap_mat">Apellido Materno</Label>
                      <Input id="via_ap_mat" placeholder="Apellido materno" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="via_fec_nac">Fecha de Nacimiento *</Label>
                      <Input id="via_fec_nac" type="date" />
                    </div>
                    <div>
                      <Label htmlFor="via_nacio">Nacionalidad *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar nacionalidad" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="peruana">Peruana</SelectItem>
                          <SelectItem value="argentina">Argentina</SelectItem>
                          <SelectItem value="brasileña">Brasileña</SelectItem>
                          <SelectItem value="chilena">Chilena</SelectItem>
                          <SelectItem value="colombiana">Colombiana</SelectItem>
                          <SelectItem value="ecuatoriana">Ecuatoriana</SelectItem>
                          <SelectItem value="otra">Otra</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="via_resi">Residencia</Label>
                      <Input id="via_resi" placeholder="País/Ciudad de residencia" />
                    </div>
                    <div>
                      <Label htmlFor="via_tip_doc">Tipo de Documento *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dni">DNI</SelectItem>
                          <SelectItem value="pasaporte">Pasaporte</SelectItem>
                          <SelectItem value="ce">Carné de Extranjería</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="via_num_doc">Número de Documento *</Label>
                      <Input id="via_num_doc" placeholder="Número del documento" />
                    </div>
                    <div>
                      <Label htmlFor="via_fec_emi_doc">Fecha de Emisión</Label>
                      <Input id="via_fec_emi_doc" type="date" />
                    </div>
                    <div>
                      <Label htmlFor="via_fec_venc_doc">Fecha de Vencimiento</Label>
                      <Input id="via_fec_venc_doc" type="date" />
                    </div>
                  </div>

                  {/* Datos de Contacto */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Datos de Contacto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="per_email_via">Email</Label>
                        <Input id="per_email_via" type="email" placeholder="correo@ejemplo.com" />
                      </div>
                      <div>
                        <Label htmlFor="per_telf_via">Teléfono</Label>
                        <Input id="per_telf_via" placeholder="+51 999 999 999" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="per_direc_via">Dirección</Label>
                      <Input id="per_direc_via" placeholder="Dirección completa" />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" className="bg-travel-accent hover:bg-travel-accent/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Registrar Viajero
                    </Button>
                    <Button type="button" variant="outline">
                      Limpiar Formulario
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recent Registrations */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Registros Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-travel-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-travel-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Juan Carlos Pérez García</p>
                    <p className="text-sm text-muted-foreground">DNI: 12345678 - Persona Natural</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Hace 1 hora</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-travel-secondary/10 flex items-center justify-center">
                    <Building className="w-4 h-4 text-travel-secondary" />
                  </div>
                  <div>
                    <p className="font-medium">Turismo del Sur S.A.C.</p>
                    <p className="text-sm text-muted-foreground">RUC: 20123456789 - Persona Jurídica</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Hace 3 horas</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-travel-accent/10 flex items-center justify-center">
                    <Plane className="w-4 h-4 text-travel-accent" />
                  </div>
                  <div>
                    <p className="font-medium">María Elena Rodríguez</p>
                    <p className="text-sm text-muted-foreground">Pasaporte: AB123456 - Viajero</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Ayer</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
