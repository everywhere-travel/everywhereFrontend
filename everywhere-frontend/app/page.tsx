import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, FileText, Calculator, Settings } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-travel-primary flex items-center justify-center">
                <span className="text-travel-primary-foreground font-bold text-lg">ET</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Everywhere Travel</h1>
                <p className="text-sm text-muted-foreground">Sistema de Cotizaciones</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Configuración
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Panel Principal</h2>
          <p className="text-muted-foreground">Gestiona cotizaciones, liquidaciones y registros de personas</p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-travel-primary" />
                Personas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Registrar personas naturales, jurídicas y viajeros</p>
              <Link href="/personas">
                <Button className="w-full bg-travel-primary hover:bg-travel-primary/90 text-travel-primary-foreground">
                  Gestionar Personas
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-travel-secondary" />
                Cotizaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Crear y gestionar cotizaciones de paquetes turísticos
              </p>
              <Link href="/cotizaciones">
                <Button className="w-full bg-travel-secondary hover:bg-travel-secondary/90 text-travel-secondary-foreground">
                  Nueva Cotización
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="w-5 h-5 text-travel-accent" />
                Liquidaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Procesar liquidaciones y gestionar pagos</p>
              <Link href="/liquidaciones">
                <Button className="w-full bg-travel-accent hover:bg-travel-accent/90 text-travel-accent-foreground">
                  Ver Liquidaciones
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="w-5 h-5 text-travel-neutral" />
                Configuración
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Gestionar productos, proveedores y configuraciones</p>
              <Button className="w-full bg-travel-neutral hover:bg-travel-neutral/90 text-travel-neutral-foreground">
                Configurar Sistema
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Cotización #COT-2024-001</p>
                  <p className="text-sm text-muted-foreground">Paquete turístico a Cusco - 5 días</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">$2,500.00</p>
                  <p className="text-xs text-muted-foreground">Hace 2 horas</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Liquidación #LIQ-2024-015</p>
                  <p className="text-sm text-muted-foreground">Procesada para grupo familiar</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">$1,800.00</p>
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
