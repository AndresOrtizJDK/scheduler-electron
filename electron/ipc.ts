/**
 * Canales IPC: lo que la ventana (React) le puede pedir al proceso principal.
 *
 * Flujo de una llamada:
 *   React → window.schedulerApp.listarCatalogos()       (src/lib/scheduler.ts)
 *         → ipcRenderer.invoke("catalogos:listar")      (electron/preload.ts)
 *         → ipcMain.handle("catalogos:listar", ...)     (este archivo)
 *         → fetch a la API                              (electron/api/cliente-catalogos.ts)
 */
import { ipcMain } from "electron"

import { CANALES, type Respuesta } from "../shared/tipos"
import {
  ErrorApi,
  apiLista,
  crearCatalogo,
  eliminarCatalogo,
  listarCatalogos,
  obtenerCatalogo,
} from "./api/cliente-catalogos"
import { capturarProcesos } from "./captura/capturar-procesos"
import { urlBaseApi } from "./config"

export function registrarCanales() {
  ipcMain.handle(CANALES.urlApi, () => urlBaseApi())
  ipcMain.handle(CANALES.apiLista, () => apiLista())

  ipcMain.handle(CANALES.listarCatalogos, () => responder(listarCatalogos))

  ipcMain.handle(CANALES.obtenerCatalogo, (_evento, numero: number) =>
    responder(() => obtenerCatalogo(numero))
  )

  ipcMain.handle(CANALES.crearCatalogo, (_evento, solicitud) =>
    responder(() => crearCatalogo(solicitud))
  )

  ipcMain.handle(CANALES.eliminarCatalogo, (_evento, numero: number) =>
    responder(async () => {
      await eliminarCatalogo(numero)
      return null
    })
  )

  ipcMain.handle(CANALES.capturarProcesos, () =>
    responder(capturarProcesos, "No se pudieron leer los procesos del sistema.")
  )
}

/**
 * Ejecuta `tarea` y empaqueta el resultado en una `Respuesta`, para que la
 * ventana reciba siempre un objeto y nunca una excepción.
 */
async function responder<T>(
  tarea: () => Promise<T>,
  mensajePorDefecto = "Ocurrió un error inesperado."
): Promise<Respuesta<T>> {
  try {
    return { ok: true, datos: await tarea() }
  } catch (error) {
    return {
      ok: false,
      mensaje: error instanceof Error ? error.message : mensajePorDefecto,
      sinConexion: error instanceof ErrorApi && error.estado === 0,
    }
  }
}
