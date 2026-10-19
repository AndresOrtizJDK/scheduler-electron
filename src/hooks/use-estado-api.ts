import { useCallback, useEffect, useState } from "react"

import { esSinConexion, scheduler } from "@/lib/scheduler"

export type EstadoApi = "comprobando" | "lista" | "caida"

/**
 * Estado de la conexión con la API que se muestra en el encabezado.
 *
 * Al abrir la app se consulta `GET /health`. Después, cada petición informa
 * si funcionó (`marcarConectada`) o si falló por falta de conexión
 * (`revisarError`).
 */
export function useEstadoApi() {
  const [estado, setEstado] = useState<EstadoApi>("comprobando")
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let vigente = true
    scheduler
      .urlApi()
      .then((valor) => vigente && setUrl(valor))
      .catch(() => {})
    scheduler
      .apiLista()
      .then((lista) => vigente && setEstado(lista ? "lista" : "caida"))
      .catch(() => vigente && setEstado("caida"))
    return () => {
      vigente = false
    }
  }, [])

  const marcarConectada = useCallback(() => setEstado("lista"), [])

  const revisarError = useCallback((error: unknown) => {
    if (esSinConexion(error)) setEstado("caida")
  }, [])

  return { estado, url, marcarConectada, revisarError }
}

export type ConexionApi = ReturnType<typeof useEstadoApi>
