import { useState } from "react"
import { RotateCwIcon, Trash2Icon } from "lucide-react"

import type { CatalogSummary } from "../../shared/tipos"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"

interface PanelCatalogosProps {
  catalogos: CatalogSummary[]
  cargando: boolean
  error: string | null
  onReintentar: () => void
  /** Número del catálogo abierto, o `null`. */
  seleccionado: number | null
  /** Nombre del catálogo abierto, para el diálogo de confirmación. */
  nombreAbierto: string | null
  puedeEliminar: boolean
  deshabilitado: boolean
  onAbrir: (numero: number) => void
  onEliminar: () => void
}

/** Texto con el que se muestra y se busca cada catálogo. */
export function etiquetaCatalogo(catalogo: CatalogSummary) {
  return `#${catalogo.number}  ${catalogo.name.trim() || "Sin nombre"}`
}

/** Tarjeta "Catálogos": buscador para abrir uno guardado y botón para eliminarlo. */
export function PanelCatalogos({
  catalogos,
  cargando,
  error,
  onReintentar,
  seleccionado,
  nombreAbierto,
  puedeEliminar,
  deshabilitado,
  onAbrir,
  onEliminar,
}: PanelCatalogosProps) {
  const valor = catalogos.find((c) => c.number === seleccionado) ?? null
  /** Diálogo "¿Eliminar el catálogo?" abierto o cerrado. */
  const [confirmando, setConfirmando] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Catálogos</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field data-disabled={deshabilitado || undefined}>
            <FieldLabel htmlFor="catalogo">Abrir catálogo</FieldLabel>
            {cargando && catalogos.length === 0 ? (
              <Skeleton className="h-8 w-full rounded-2xl" />
            ) : error ? (
              <Alert variant="destructive">
                <AlertTitle>No se pudo cargar</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                <AlertAction>
                  <Button size="xs" variant="outline" onClick={onReintentar}>
                    <RotateCwIcon data-icon="inline-start" />
                    Reintentar
                  </Button>
                </AlertAction>
              </Alert>
            ) : (
              <Combobox
                items={catalogos}
                value={valor}
                onValueChange={(catalogo) =>
                  catalogo && onAbrir(catalogo.number)
                }
                itemToStringLabel={etiquetaCatalogo}
                isItemEqualToValue={(a, b) => a.number === b.number}
                disabled={deshabilitado}
              >
                <ComboboxInput
                  id="catalogo"
                  placeholder="Buscar catálogo"
                  disabled={deshabilitado}
                  className="w-full"
                />
                <ComboboxContent>
                  <ComboboxEmpty>Ningún catálogo coincide.</ComboboxEmpty>
                  <ComboboxList>
                    {(catalogo: CatalogSummary) => (
                      <ComboboxItem key={catalogo.number} value={catalogo}>
                        <span className="truncate">
                          {etiquetaCatalogo(catalogo)}
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                          {catalogo.processCount}
                        </span>
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            )}
          </Field>

          <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
            <AlertDialogTrigger
              render={
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={!puedeEliminar || deshabilitado}
                />
              }
            >
              <Trash2Icon data-icon="inline-start" />
              Eliminar catálogo
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  ¿Eliminar el catálogo #{seleccionado}?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Se borrarán el catálogo “{nombreAbierto}” y todos sus
                  procesos. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => {
                    setConfirmando(false)
                    onEliminar()
                  }}
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
