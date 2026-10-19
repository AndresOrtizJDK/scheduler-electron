import { CpuIcon, Loader2Icon, MemoryStickIcon, SaveIcon } from "lucide-react"

import type { OrdenSeleccion } from "../../shared/tipos"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { Tarea } from "@/hooks/use-espacio-trabajo"
import { CANTIDAD_MAXIMA, CANTIDAD_MINIMA } from "@/lib/seleccion"

interface PanelCapturaProps {
  nombre: string
  onNombre: (valor: string) => void
  orden: OrdenSeleccion
  onOrden: (valor: OrdenSeleccion) => void
  cantidad: string
  onCantidad: (valor: string) => void
  onSalirCantidad: () => void
  /** Hay una captura en pantalla que se puede guardar. */
  hayCaptura: boolean
  tarea: Tarea | null
  onLeer: () => void
  onGuardar: () => void
}

/**
 * Tarjeta "Nueva captura": nombre del catálogo, criterio de orden, cantidad de
 * procesos y los botones "Leer procesos" y "Guardar catálogo".
 */
export function PanelCaptura({
  nombre,
  onNombre,
  orden,
  onOrden,
  cantidad,
  onCantidad,
  onSalirCantidad,
  hayCaptura,
  tarea,
  onLeer,
  onGuardar,
}: PanelCapturaProps) {
  const ocupado = tarea !== null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva captura</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <FieldGroup>
          <Field data-disabled={ocupado || undefined}>
            <FieldLabel htmlFor="nombre">Nombre del catálogo</FieldLabel>
            <Input
              id="nombre"
              placeholder="Captura de la mañana"
              maxLength={200}
              value={nombre}
              disabled={ocupado}
              onChange={(evento) => onNombre(evento.target.value)}
            />
          </Field>

          <Field data-disabled={ocupado || undefined}>
            <FieldLabel>Ordenar por</FieldLabel>
            <ToggleGroup
              variant="outline"
              spacing={0}
              className="w-full"
              value={[orden]}
              disabled={ocupado}
              // Base UI permite des-seleccionar todo; se ignora ese caso.
              onValueChange={(valores) =>
                valores[0] && onOrden(valores[0] as OrdenSeleccion)
              }
            >
              <ToggleGroupItem value="cpu" className="flex-1">
                <CpuIcon />
                CPU
              </ToggleGroupItem>
              <ToggleGroupItem value="memory" className="flex-1">
                <MemoryStickIcon />
                Memoria
              </ToggleGroupItem>
            </ToggleGroup>
          </Field>

          <Field data-disabled={ocupado || undefined}>
            <FieldLabel htmlFor="cantidad">Cantidad de procesos</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="cantidad"
                type="number"
                inputMode="numeric"
                min={CANTIDAD_MINIMA}
                max={CANTIDAD_MAXIMA}
                step={1}
                value={cantidad}
                disabled={ocupado}
                onChange={(evento) => onCantidad(evento.target.value)}
                onBlur={onSalirCantidad}
                className="tabular-nums"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>procesos</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <FieldDescription>
              La lectura mide el CPU durante 2 segundos. Después puedes cambiar
              la cantidad y el criterio sin volver a leer. Los procesos del
              sistema se guardan con emisor Sistema y prioridad 1.
            </FieldDescription>
          </Field>
        </FieldGroup>

        <div className="flex flex-col gap-2">
          <Button
            variant={hayCaptura ? "outline" : "default"}
            disabled={ocupado}
            onClick={onLeer}
          >
            {tarea === "leyendo" ? (
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
            ) : (
              <CpuIcon data-icon="inline-start" />
            )}
            {tarea === "leyendo" ? "Leyendo…" : "Leer procesos"}
          </Button>
          <Button
            variant={hayCaptura ? "default" : "outline"}
            disabled={ocupado || !hayCaptura}
            onClick={onGuardar}
          >
            {tarea === "guardando" ? (
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
            ) : (
              <SaveIcon data-icon="inline-start" />
            )}
            {tarea === "guardando" ? "Guardando…" : "Guardar catálogo"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
