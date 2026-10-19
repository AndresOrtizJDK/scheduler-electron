/**
 * Acceso desde React a las funciones del proceso principal (`window.schedulerApp`).
 *
 * El proceso principal responde `{ ok, datos }` o `{ ok: false, mensaje }`.
 * Aquí se convierte en promesas normales: devuelven los datos o lanzan
 * `ErrorScheduler`, que se puede atrapar con try/catch.
 */
import type {
  CreateCatalogRequest,
  Respuesta,
  SchedulerBridge,
} from "../../shared/tipos"

export class ErrorScheduler extends Error {
  /** `true` cuando falló la conexión con la API. */
  readonly sinConexion: boolean

  constructor(mensaje: string, sinConexion = false) {
    super(mensaje)
    this.sinConexion = sinConexion
  }
}

/** Devuelve el puente o falla con un mensaje claro si no se abrió en Electron. */
function puente(): SchedulerBridge {
  if (!window.schedulerApp) {
    throw new ErrorScheduler(
      "Esta interfaz debe abrirse dentro de Electron (bun dev)."
    )
  }
  return window.schedulerApp
}

async function desenvolver<T>(respuesta: Promise<Respuesta<T>>): Promise<T> {
  const resultado = await respuesta
  if (!resultado.ok) {
    throw new ErrorScheduler(resultado.mensaje, resultado.sinConexion)
  }
  return resultado.datos
}

// Son `async` para que el error de `puente()` llegue como promesa rechazada.
export const scheduler = {
  urlApi: async () => puente().urlApi(),
  apiLista: async () => puente().apiLista(),
  listarCatalogos: async () => desenvolver(puente().listarCatalogos()),
  obtenerCatalogo: async (numero: number) =>
    desenvolver(puente().obtenerCatalogo(numero)),
  crearCatalogo: async (solicitud: CreateCatalogRequest) =>
    desenvolver(puente().crearCatalogo(solicitud)),
  eliminarCatalogo: async (numero: number) =>
    desenvolver(puente().eliminarCatalogo(numero)),
  capturarProcesos: async () => desenvolver(puente().capturarProcesos()),
}

/** Mensaje de un error cualquiera, con texto de respaldo. */
export function mensajeDe(error: unknown, respaldo: string) {
  return error instanceof Error && error.message ? error.message : respaldo
}

/** `true` si el error se debió a que no hay conexión con la API. */
export function esSinConexion(error: unknown) {
  return error instanceof ErrorScheduler && error.sinConexion
}
