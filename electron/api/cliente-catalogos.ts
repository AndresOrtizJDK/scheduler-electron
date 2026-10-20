/**
 * Cliente HTTP de la API de catálogos.
 *
 * Corre en el proceso principal (Node.js), no en la ventana. Así:
 * - no hay problemas de CORS (la API solo acepta navegadores desde localhost:5173);
 * - la ventana no necesita permisos de red, solo llama a `window.schedulerApp`.
 *
 * Endpoints usados (ver OpenAPI):
 *   GET    /health                  Estado de la API y la base de datos
 *   GET    /api/catalogs            Lista paginada de catálogos
 *   GET    /api/catalogs/{number}   Catálogo con sus procesos
 *   POST   /api/catalogs            Guardar un catálogo nuevo
 *   DELETE /api/catalogs/{number}   Eliminar un catálogo
 */
import type {
  CatalogDetail,
  CatalogPage,
  CatalogSummary,
  CreateCatalogRequest,
} from "../../shared/tipos"
import { urlBaseApi } from "../config"

/** Máximo permitido por la API para `pageSize`. */
const TAMANO_PAGINA = 100
/** Tiempo máximo de espera de cada petición. */
const TIEMPO_LIMITE_MS = 40_000

/** Error de la API con un mensaje listo para mostrar al usuario. */
export class ErrorApi extends Error {
  /** Código HTTP; 0 significa que no hubo respuesta (sin conexión). */
  readonly estado: number

  constructor(estado: number, mensaje: string) {
    super(mensaje)
    this.estado = estado
  }
}

/**
 * `true` si `GET /health` responde 200, ya sea sin cuerpo o con
 * `{ status: "ready" }`.
 */
export async function apiLista(): Promise<boolean> {
  try {
    const respuesta = await pedir("GET", "/health")
    if (!respuesta.ok) return false
    const texto = (await respuesta.text()).trim()
    if (texto === "") return true
    const cuerpo = JSON.parse(texto) as { status?: string }
    return cuerpo.status?.toLowerCase() === "ready"
  } catch {
    return false
  }
}

/**
 * Trae todos los catálogos recorriendo las páginas hasta completar
 * `totalCount`. La API los devuelve del más nuevo al más viejo.
 */
export async function listarCatalogos(): Promise<CatalogSummary[]> {
  const todos: CatalogSummary[] = []
  let pagina = 1
  let total = Infinity

  while (todos.length < total) {
    const resultado = await pedirJson<CatalogPage>(
      "GET",
      `/api/catalogs?page=${pagina}&pageSize=${TAMANO_PAGINA}`
    )
    total = resultado.totalCount
    if (resultado.items.length === 0) break

    todos.push(...resultado.items)
    pagina++
  }
  return todos
}

export function obtenerCatalogo(numero: number): Promise<CatalogDetail> {
  return pedirJson<CatalogDetail>("GET", `/api/catalogs/${numero}`)
}

export async function crearCatalogo(
  solicitud: CreateCatalogRequest
): Promise<CatalogDetail> {
  const creado = await pedirJson<CatalogDetail | undefined>(
    "POST",
    "/api/catalogs",
    solicitud
  )
  if (creado) return creado

  // La API respondió sin cuerpo ni `Location`: se toma el más reciente.
  const { items } = await pedirJson<CatalogPage>(
    "GET",
    "/api/catalogs?page=1&pageSize=1"
  )
  if (items.length === 0) {
    throw new ErrorApi(0, "El catálogo se guardó, pero no se pudo recuperar.")
  }
  return obtenerCatalogo(items[0].number)
}

export async function eliminarCatalogo(numero: number): Promise<void> {
  await pedirJson<void>("DELETE", `/api/catalogs/${numero}`)
}

// ---------------------------------------------------------------------------
// Utilidades internas
// ---------------------------------------------------------------------------

/** Hace la petición y devuelve el JSON, o lanza `ErrorApi` si falló. */
async function pedirJson<T>(
  metodo: string,
  ruta: string,
  cuerpo?: unknown
): Promise<T> {
  const respuesta = await pedir(metodo, ruta, cuerpo)
  if (!respuesta.ok) {
    throw new ErrorApi(respuesta.status, await describirError(respuesta))
  }
  const texto = await respuesta.text()
  if (texto.trim() === "") {
    // Sin cuerpo: 204 (eliminar) o 201 (crear) con el recurso en `Location`.
    const ubicacion = respuesta.headers.get("Location")
    if (ubicacion) {
      return pedirJson<T>("GET", new URL(ubicacion, urlBaseApi()).pathname)
    }
    return undefined as T
  }
  try {
    return JSON.parse(texto) as T
  } catch {
    throw new ErrorApi(
      respuesta.status,
      "La respuesta de la API no se pudo leer."
    )
  }
}

/** `fetch` con JSON, tiempo límite y mensaje claro si no hay conexión. */
async function pedir(
  metodo: string,
  ruta: string,
  cuerpo?: unknown
): Promise<Response> {
  try {
    return await fetch(urlBaseApi() + ruta, {
      method: metodo,
      headers: {
        Accept: "application/json",
        ...(cuerpo === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(TIEMPO_LIMITE_MS),
    })
  } catch {
    throw new ErrorApi(0, "No se pudo conectar con la API.")
  }
}

/**
 * Convierte la respuesta de error de la API (formato ProblemDetails de .NET)
 * en un texto legible. Prioridad: lista de `errors` → `detail` → `title` →
 * mensaje genérico según el código HTTP.
 */
async function describirError(respuesta: Response): Promise<string> {
  const problema = (await respuesta.json().catch(() => null)) as {
    errors?: Record<string, string[]>
    detail?: string
    title?: string
  } | null

  const errores = Object.values(problema?.errors ?? {})
    .flat()
    .filter((texto) => texto?.trim())
  if (errores.length > 0) return errores.join("\n")
  if (problema?.detail?.trim()) return problema.detail
  if (problema?.title?.trim()) return problema.title

  switch (respuesta.status) {
    case 404:
      return "El catálogo no existe."
    case 400:
      return "La API rechazó los datos enviados."
    case 415:
      return "La API no aceptó el formato de la solicitud."
    default:
      return `La API respondió con estado ${respuesta.status}.`
  }
}
