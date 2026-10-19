/**
 * Tipos compartidos entre el proceso principal de Electron (carpeta `electron/`)
 * y la interfaz en React (carpeta `src/`).
 *
 * Los nombres de los campos de la API se dejan en inglés porque así los define
 * el contrato OpenAPI: https://api-schedule.salesconnect.dev/openapi/v1.json
 */

// ---------------------------------------------------------------------------
// Datos de la API
// ---------------------------------------------------------------------------

/** Criterio con el que se eligieron los procesos del catálogo. */
export type OrdenSeleccion = "cpu" | "memory"

/** Prioridad de simulación: 0 = expulsivo, 1 = no expulsivo (sistema). */
export type Prioridad = 0 | 1

/** Catálogo sin la lista de procesos (`GET /api/catalogs`). */
export interface CatalogSummary {
  number: number
  name: string
  capturedAt: string
  createdAt: string
  selectionOrder: OrdenSeleccion
  processCount: number
}

/** Una página de catálogos (`GET /api/catalogs?page=&pageSize=`). */
export interface CatalogPage {
  items: CatalogSummary[]
  totalCount: number
  page: number
  pageSize: number
}

/** Proceso tal como lo devuelve la API dentro de un catálogo. */
export interface ProcessSnapshotResponse {
  position: number
  pid: number
  name: string
  user: string | null
  description: string | null
  priority: Prioridad
  cpuUsagePercent: number | null
  memoryUsageBytes: number | null
}

/** Catálogo completo con sus procesos (`GET /api/catalogs/{number}`). */
export interface CatalogDetail extends CatalogSummary {
  processes: ProcessSnapshotResponse[]
}

/** Proceso que se envía al guardar un catálogo. */
export interface ProcessSnapshotRequest {
  pid: number
  name: string
  user: string | null
  description: string | null
  priority: Prioridad
  cpuUsagePercent: number | null
  memoryUsageBytes: number
}

/** Cuerpo de `POST /api/catalogs`. */
export interface CreateCatalogRequest {
  name: string
  capturedAt: string
  selectionOrder: OrdenSeleccion
  processes: ProcessSnapshotRequest[]
}

// ---------------------------------------------------------------------------
// Captura de procesos del sistema operativo
// ---------------------------------------------------------------------------

/** Un proceso leído del sistema operativo, antes de guardarlo. */
export interface ProcesoCapturado {
  pid: number
  nombre: string
  /** Cuenta dueña del proceso; `null` si el sistema no la expone. */
  usuario: string | null
  /** En Windows es la "Descripción del archivo" del ejecutable. */
  descripcion: string | null
  /** Porcentaje de CPU de toda la máquina (0–100); `null` si no se pudo medir. */
  cpu: number | null
  memoriaBytes: number
  /** Procesos del sistema: se guardan con emisor "Sistema" y prioridad 1. */
  esDelSistema: boolean
}

/** Resultado de una lectura completa de procesos. */
export interface Captura {
  /** Fecha ISO 8601 (UTC) del momento de la lectura. */
  capturadaEn: string
  procesos: ProcesoCapturado[]
}

// ---------------------------------------------------------------------------
// Puente entre React y Electron (lo expone electron/preload.ts)
// ---------------------------------------------------------------------------

/**
 * Respuesta de cada llamada al proceso principal. En lugar de lanzar errores a
 * través de IPC (Electron les agrega texto técnico) se devuelve un objeto que
 * dice si salió bien o mal.
 */
export type Respuesta<T> =
  | { ok: true; datos: T }
  | {
      ok: false
      mensaje: string
      /** `true` cuando no hubo conexión con la API (red, DNS, tiempo agotado). */
      sinConexion: boolean
    }

/** Funciones disponibles en `window.schedulerApp` dentro de React. */
export interface SchedulerBridge {
  /** Dirección base de la API, p. ej. `https://api-schedule.salesconnect.dev`. */
  urlApi: () => Promise<string>
  /** `true` si `GET /health` responde `ready`. */
  apiLista: () => Promise<boolean>
  listarCatalogos: () => Promise<Respuesta<CatalogSummary[]>>
  obtenerCatalogo: (numero: number) => Promise<Respuesta<CatalogDetail>>
  crearCatalogo: (
    solicitud: CreateCatalogRequest
  ) => Promise<Respuesta<CatalogDetail>>
  eliminarCatalogo: (numero: number) => Promise<Respuesta<null>>
  capturarProcesos: () => Promise<Respuesta<Captura>>
}

/** Nombres de los canales IPC. Se usan en `preload.ts` y en `ipc.ts`. */
export const CANALES = {
  urlApi: "api:url",
  apiLista: "api:lista",
  listarCatalogos: "catalogos:listar",
  obtenerCatalogo: "catalogos:obtener",
  crearCatalogo: "catalogos:crear",
  eliminarCatalogo: "catalogos:eliminar",
  capturarProcesos: "procesos:capturar",
} as const
