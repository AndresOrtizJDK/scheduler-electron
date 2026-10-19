import { useMemo, useState } from "react"

import type { Captura, CatalogDetail, OrdenSeleccion } from "../../shared/tipos"
import { useCatalogos } from "@/hooks/use-catalogos"
import { useEstadoApi } from "@/hooks/use-estado-api"
import { armarCatalogo } from "@/lib/armar-catalogo"
import { filaDeCaptura, filaDeCatalogo } from "@/lib/filas"
import { mensajeDe, scheduler } from "@/lib/scheduler"
import {
  CANTIDAD_POR_DEFECTO,
  cantidadValida,
  seleccionarProcesos,
} from "@/lib/seleccion"

/** Qué se ve en la tabla de la derecha. */
export type Vista =
  | { tipo: "inicio" }
  | { tipo: "captura"; captura: Captura }
  | { tipo: "catalogo"; catalogo: CatalogDetail }

/** Operación en curso. Mientras hay una, los controles quedan bloqueados. */
export type Tarea = "leyendo" | "guardando" | "abriendo" | "eliminando"

export interface Aviso {
  tipo: "exito" | "error"
  texto: string
}

/**
 * Toda la lógica de la pantalla principal. `App.tsx` solo se encarga de
 * dibujar; aquí están el estado y las acciones:
 *
 * - leerProcesos     → captura los procesos del sistema (2 s de medición)
 * - guardarCatalogo  → envía la selección actual a la API
 * - abrirCatalogo    → trae un catálogo guardado y lo muestra
 * - eliminarCatalogo → borra el catálogo abierto
 */
export function useEspacioTrabajo() {
  const api = useEstadoApi()
  const catalogos = useCatalogos(api)

  const [vista, setVista] = useState<Vista>({ tipo: "inicio" })
  const [tarea, setTarea] = useState<Tarea | null>(null)
  const [aviso, setAviso] = useState<Aviso | null>(null)
  /** Catálogo que se está abriendo (para marcarlo en el selector). */
  const [abriendo, setAbriendo] = useState<number | null>(null)

  // Formulario de captura
  const [nombre, setNombre] = useState("")
  const [orden, setOrden] = useState<OrdenSeleccion>("cpu")
  const [cantidad, setCantidad] = useState(String(CANTIDAD_POR_DEFECTO))

  const ocupado = tarea !== null

  /** Procesos elegidos de la captura según el criterio y la cantidad. */
  const seleccion = useMemo(
    () =>
      vista.tipo === "captura"
        ? seleccionarProcesos(
            vista.captura.procesos,
            orden,
            cantidadValida(cantidad)
          )
        : [],
    [vista, orden, cantidad]
  )

  const filas = useMemo(() => {
    if (vista.tipo === "captura") return seleccion.map(filaDeCaptura)
    if (vista.tipo === "catalogo") {
      return vista.catalogo.processes.map(filaDeCatalogo)
    }
    return []
  }, [vista, seleccion])

  const catalogoSeleccionado =
    abriendo ?? (vista.tipo === "catalogo" ? vista.catalogo.number : null)

  /** Muestra el error al usuario y actualiza el estado de la API. */
  function mostrarError(error: unknown, respaldo: string) {
    setAviso({ tipo: "error", texto: mensajeDe(error, respaldo) })
    api.revisarError(error)
  }

  async function leerProcesos() {
    if (ocupado) return
    setTarea("leyendo")
    setAviso(null)
    setVista({ tipo: "inicio" })
    try {
      const captura = await scheduler.capturarProcesos()
      setVista({ tipo: "captura", captura })
    } catch (error) {
      mostrarError(error, "No se pudieron leer los procesos del sistema.")
    } finally {
      setTarea(null)
    }
  }

  async function guardarCatalogo() {
    if (ocupado || vista.tipo !== "captura") return
    setAviso(null)

    let solicitud
    try {
      solicitud = armarCatalogo(
        nombre,
        vista.captura.capturadaEn,
        orden,
        seleccion
      )
    } catch (error) {
      mostrarError(error, "Revisa los datos del catálogo.")
      return
    }

    setTarea("guardando")
    try {
      const guardado = await scheduler.crearCatalogo(solicitud)
      api.marcarConectada()
      setVista({ tipo: "catalogo", catalogo: guardado })
      setAviso({
        tipo: "exito",
        texto: `Catálogo #${guardado.number} guardado.`,
      })
      catalogos.recargar()
    } catch (error) {
      mostrarError(error, "No se pudo guardar el catálogo.")
    } finally {
      setTarea(null)
    }
  }

  async function abrirCatalogo(numero: number) {
    if (ocupado) return
    if (vista.tipo === "catalogo" && vista.catalogo.number === numero) return

    setTarea("abriendo")
    setAbriendo(numero)
    setAviso(null)
    setVista({ tipo: "inicio" })
    try {
      const catalogo = await scheduler.obtenerCatalogo(numero)
      api.marcarConectada()
      setVista({ tipo: "catalogo", catalogo })
    } catch (error) {
      mostrarError(error, "No se pudo abrir el catálogo.")
    } finally {
      setAbriendo(null)
      setTarea(null)
    }
  }

  async function eliminarCatalogo() {
    if (ocupado || vista.tipo !== "catalogo") return
    const numero = vista.catalogo.number

    setTarea("eliminando")
    setAviso(null)
    try {
      await scheduler.eliminarCatalogo(numero)
      api.marcarConectada()
      setVista({ tipo: "inicio" })
      setAviso({ tipo: "exito", texto: `Catálogo #${numero} eliminado.` })
      catalogos.recargar()
    } catch (error) {
      mostrarError(error, "No se pudo eliminar el catálogo.")
    } finally {
      setTarea(null)
    }
  }

  return {
    api,
    catalogos,
    vista,
    tarea,
    ocupado,
    aviso,
    cerrarAviso: () => setAviso(null),
    filas,
    catalogoSeleccionado,
    formulario: {
      nombre,
      setNombre,
      orden,
      setOrden,
      cantidad,
      setCantidad,
      /** Al salir del campo, corrige la cantidad al rango 1–10.000. */
      corregirCantidad: () => setCantidad(String(cantidadValida(cantidad))),
    },
    leerProcesos,
    guardarCatalogo,
    abrirCatalogo,
    eliminarCatalogo,
  }
}
