import { Loader2Icon, ServerIcon } from "lucide-react"

import { Aviso } from "@/components/aviso"
import { Encabezado } from "@/components/encabezado"
import { PanelCaptura } from "@/components/panel-captura"
import { PanelCatalogos } from "@/components/panel-catalogos"
import { TablaProcesos } from "@/components/tabla-procesos"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  useEspacioTrabajo,
  type Tarea,
  type Vista,
} from "@/hooks/use-espacio-trabajo"
import { etiquetaOrden, formatoFecha } from "@/lib/formato"

/**
 * Pantalla principal. Solo organiza los componentes; el estado y las
 * acciones viven en `useEspacioTrabajo` (src/hooks/use-espacio-trabajo.ts).
 *
 * ┌──────────────────────── Encabezado ────────────────────────┐
 * │ Catálogos       │                                           │
 * │ Nueva captura   │            Tabla de procesos              │
 * │ Aviso           │                                           │
 * └─────────────────┴───────────────────────────────────────────┘
 */
export function App() {
  const espacio = useEspacioTrabajo()
  const { vista, tarea, ocupado, formulario } = espacio
  const tabla = textosTabla(vista, espacio.filas.length)

  return (
    <div className="flex h-svh flex-col">
      <Encabezado estadoApi={espacio.api.estado} urlApi={espacio.api.url} />

      <main className="grid min-h-0 flex-1 gap-6 p-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto *:shrink-0">
          <PanelCatalogos
            catalogos={espacio.catalogos.lista}
            cargando={espacio.catalogos.cargando}
            error={espacio.catalogos.error}
            onReintentar={espacio.catalogos.recargar}
            seleccionado={espacio.catalogoSeleccionado}
            nombreAbierto={
              vista.tipo === "catalogo" ? vista.catalogo.name : null
            }
            puedeEliminar={vista.tipo === "catalogo"}
            deshabilitado={ocupado}
            onAbrir={espacio.abrirCatalogo}
            onEliminar={espacio.eliminarCatalogo}
          />

          <PanelCaptura
            nombre={formulario.nombre}
            onNombre={formulario.setNombre}
            orden={formulario.orden}
            onOrden={formulario.setOrden}
            cantidad={formulario.cantidad}
            onCantidad={formulario.setCantidad}
            onSalirCantidad={formulario.corregirCantidad}
            hayCaptura={vista.tipo === "captura"}
            tarea={tarea}
            onLeer={espacio.leerProcesos}
            onGuardar={espacio.guardarCatalogo}
          />

          {espacio.aviso && (
            <Aviso aviso={espacio.aviso} onCerrar={espacio.cerrarAviso} />
          )}
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col">
          <TablaProcesos
            titulo={tabla.titulo}
            descripcion={tabla.descripcion}
            filas={espacio.filas}
            vacio={<TablaVacia vista={vista} tarea={tarea} />}
          />
        </section>
      </main>
    </div>
  )
}

/** Título y subtítulo de la tabla según lo que se está mostrando. */
function textosTabla(vista: Vista, filasVisibles: number) {
  switch (vista.tipo) {
    case "captura":
      return {
        titulo: "Captura sin guardar",
        descripcion: `${filasVisibles} de ${vista.captura.procesos.length} procesos leídos · ${formatoFecha(vista.captura.capturadaEn)}`,
      }
    case "catalogo":
      return {
        titulo: `#${vista.catalogo.number} · ${vista.catalogo.name}`,
        descripcion: `${vista.catalogo.processCount} procesos · por ${etiquetaOrden(vista.catalogo.selectionOrder)} · ${formatoFecha(vista.catalogo.capturedAt)}`,
      }
    case "inicio":
      return {
        titulo: "Procesos",
        descripcion: "Lee los procesos del sistema o elige un catálogo.",
      }
  }
}

/** Lo que aparece en lugar de la tabla cuando no hay filas. */
function TablaVacia({ vista, tarea }: { vista: Vista; tarea: Tarea | null }) {
  if (tarea === "leyendo" || tarea === "abriendo") {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Loader2Icon className="animate-spin" />
          </EmptyMedia>
          <EmptyTitle>
            {tarea === "leyendo"
              ? "Leyendo procesos del sistema…"
              : "Cargando catálogo…"}
          </EmptyTitle>
        </EmptyHeader>
      </Empty>
    )
  }

  const mensaje =
    vista.tipo === "captura"
      ? "Ningún proceso coincide con la selección."
      : vista.tipo === "catalogo"
        ? "Este catálogo no tiene procesos."
        : "Lee los procesos del sistema o elige un catálogo."

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ServerIcon />
        </EmptyMedia>
        <EmptyTitle>Sin procesos</EmptyTitle>
        <EmptyDescription>{mensaje}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export default App
