/**
 * Arma el cuerpo de `POST /api/catalogs` a partir de la selección actual.
 *
 * Valida lo mismo que la API (ver OpenAPI) para mostrar el error antes de
 * enviar. Si algo no cumple, lanza un `Error` con el mensaje para el usuario.
 */
import type {
  CreateCatalogRequest,
  OrdenSeleccion,
  ProcesoCapturado,
} from "../../shared/tipos"
import { CANTIDAD_MAXIMA } from "./seleccion"

const LARGO_MAXIMO_NOMBRE = 200

export function armarCatalogo(
  nombre: string,
  capturadaEn: string,
  orden: OrdenSeleccion,
  procesos: ProcesoCapturado[]
): CreateCatalogRequest {
  const nombreLimpio = nombre.trim()
  if (nombreLimpio === "") {
    throw new Error("Escribe un nombre para el catálogo.")
  }
  if (nombreLimpio.length > LARGO_MAXIMO_NOMBRE) {
    throw new Error("El nombre no puede superar 200 caracteres.")
  }
  if (procesos.length === 0) {
    throw new Error("Selecciona al menos un proceso.")
  }
  if (procesos.length > CANTIDAD_MAXIMA) {
    throw new Error("Un catálogo admite como máximo 10.000 procesos.")
  }

  const pids = new Set(procesos.map((p) => p.pid))
  if (pids.size !== procesos.length) {
    throw new Error("Hay PID duplicados en la selección.")
  }

  return {
    name: nombreLimpio,
    capturedAt: capturadaEn,
    selectionOrder: orden,
    processes: procesos.map((p) => ({
      pid: p.pid,
      name: p.nombre,
      user: emisorDe(p),
      description: p.descripcion,
      priority: p.esDelSistema ? 1 : 0,
      cpuUsagePercent: p.cpu,
      memoryUsageBytes: p.memoriaBytes,
    })),
  }
}

/** Emisor que se muestra y se guarda: "Sistema" o el usuario del proceso. */
export function emisorDe(proceso: ProcesoCapturado) {
  return proceso.esDelSistema ? "Sistema" : proceso.usuario
}
