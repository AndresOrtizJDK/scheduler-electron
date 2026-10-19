import { useCallback, useEffect, useState } from "react"

import type { CatalogSummary } from "../../shared/tipos"
import type { ConexionApi } from "@/hooks/use-estado-api"
import { mensajeDe, scheduler } from "@/lib/scheduler"

/**
 * Lista de catálogos guardados en la API.
 *
 * Se carga al abrir la app y se vuelve a pedir con `recargar()` después de
 * guardar o eliminar un catálogo.
 */
export function useCatalogos({ marcarConectada, revisarError }: ConexionApi) {
  const [lista, setLista] = useState<CatalogSummary[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  /** Cada vez que cambia, el efecto vuelve a pedir la lista. */
  const [version, setVersion] = useState(0)

  useEffect(() => {
    // Si llega una recarga nueva antes de que responda esta, se ignora esta.
    let vigente = true
    scheduler
      .listarCatalogos()
      .then((catalogos) => {
        if (!vigente) return
        setLista(catalogos)
        setError(null)
        marcarConectada()
      })
      .catch((falla) => {
        if (!vigente) return
        setError(mensajeDe(falla, "No se pudieron cargar los catálogos."))
        revisarError(falla)
      })
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
  }, [version, marcarConectada, revisarError])

  const recargar = useCallback(() => {
    setCargando(true)
    setVersion((n) => n + 1)
  }, [])

  return { lista, cargando, error, recargar }
}
