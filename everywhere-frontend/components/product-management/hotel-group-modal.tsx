"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"

interface Hotel {
  id: number
  nombre: string
  precio: number
  descripcion?: string
}

interface HotelGroupModalProps {
  onAddGroup: (group: any) => void
  currency: string
}

export function HotelGroupModal({ onAddGroup, currency }: HotelGroupModalProps) {
  const [open, setOpen] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [hotels, setHotels] = useState<Hotel[]>([{ id: 1, nombre: "", precio: 0, descripcion: "" }])

  const addHotel = () => {
    setHotels([...hotels, { id: Date.now(), nombre: "", precio: 0, descripcion: "" }])
  }

  const removeHotel = (id: number) => {
    if (hotels.length > 1) {
      setHotels(hotels.filter((hotel) => hotel.id !== id))
    }
  }

  const updateHotel = (id: number, field: keyof Hotel, value: string | number) => {
    setHotels(hotels.map((hotel) => (hotel.id === id ? { ...hotel, [field]: value } : hotel)))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupName.trim() || hotels.some((h) => !h.nombre.trim() || h.precio <= 0)) {
      return
    }

    const newGroup = {
      id: Date.now(),
      nombre: groupName,
      hoteles: hotels.map((hotel) => ({
        ...hotel,
        selected: false,
      })),
    }

    onAddGroup(newGroup)
    setGroupName("")
    setHotels([{ id: 1, nombre: "", precio: 0, descripcion: "" }])
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-travel-accent hover:bg-travel-accent/90">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Grupo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Grupo de Hoteles</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="groupName">Nombre del Grupo *</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Ej: Hoteles Cusco Centro Histórico"
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Hoteles del Grupo</Label>
              <Button type="button" size="sm" variant="outline" onClick={addHotel}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Hotel
              </Button>
            </div>

            {hotels.map((hotel, index) => (
              <Card key={hotel.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`hotel-name-${hotel.id}`}>Nombre del Hotel *</Label>
                          <Input
                            id={`hotel-name-${hotel.id}`}
                            value={hotel.nombre}
                            onChange={(e) => updateHotel(hotel.id, "nombre", e.target.value)}
                            placeholder="Nombre del hotel"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor={`hotel-price-${hotel.id}`}>Precio por Noche ({currency}) *</Label>
                          <Input
                            id={`hotel-price-${hotel.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={hotel.precio}
                            onChange={(e) => updateHotel(hotel.id, "precio", Number.parseFloat(e.target.value) || 0)}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`hotel-desc-${hotel.id}`}>Descripción</Label>
                        <Textarea
                          id={`hotel-desc-${hotel.id}`}
                          value={hotel.descripcion}
                          onChange={(e) => updateHotel(hotel.id, "descripcion", e.target.value)}
                          placeholder="Características del hotel (opcional)"
                          rows={2}
                        />
                      </div>
                    </div>
                    {hotels.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removeHotel(hotel.id)}
                        className="mt-6"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1 bg-travel-accent hover:bg-travel-accent/90">
              Crear Grupo
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
