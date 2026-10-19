import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { FilaProceso } from "@/lib/filas"
import { formatoBytes, formatoCpu, textoOGuion } from "@/lib/formato"

interface TablaProcesosProps {
  titulo: string
  descripcion: string
  filas: FilaProceso[]
  /** Contenido que se muestra cuando no hay filas. */
  vacio: ReactNode
}

/** Tabla de procesos: sirve tanto para una captura como para un catálogo. */
export function TablaProcesos({
  titulo,
  descripcion,
  filas,
  vacio,
}: TablaProcesosProps) {
  return (
    <Card className="min-h-0 flex-1">
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
        <CardDescription>{descripcion}</CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-auto">
        {filas.length === 0 ? (
          vacio
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead className="text-right">PID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead className="text-right">CPU</TableHead>
                <TableHead className="text-right">Memoria</TableHead>
                <TableHead>Emisor</TableHead>
                <TableHead>Descripción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((fila, indice) => (
                <TableRow key={fila.pid}>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {indice + 1}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fila.pid}
                  </TableCell>
                  <TableCell className="max-w-48 truncate font-medium">
                    {fila.nombre}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={fila.prioridad === 1 ? "secondary" : "outline"}
                    >
                      {fila.prioridad === 1
                        ? "1 · No expulsivo"
                        : "0 · Expulsivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatoCpu(fila.cpu)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatoBytes(fila.memoriaBytes)}
                  </TableCell>
                  <TableCell className="max-w-40 truncate text-muted-foreground">
                    {textoOGuion(fila.emisor)}
                  </TableCell>
                  <TableCell className="max-w-64 truncate text-muted-foreground">
                    {textoOGuion(fila.descripcion)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
