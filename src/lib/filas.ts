/**
 * La tabla muestra procesos de dos orígenes distintos:
 * - una captura recién leída (`ProcesoCapturado`), o
 * - un catálogo guardado en la API (`ProcessSnapshotResponse`).
 * Ambos se convierten a `FilaProceso` para dibujarlos igual.
 */
import type {
  ProcessSnapshotResponse,
  ProcesoCapturado,
} from "../../shared/tipos"
import { emisorDe } from "./armar-catalogo"

export interface FilaProceso {
  pid: number
  nombre: string
  prioridad: number
  cpu: number | null
  memoriaBytes: number | null
  emisor: string | null
  descripcion: string | null
}

export function filaDeCaptura(proceso: ProcesoCapturado): FilaProceso {
  return {
    pid: proceso.pid,
    nombre: proceso.nombre,
    prioridad: proceso.esDelSistema ? 1 : 0,
    cpu: proceso.cpu,
    memoriaBytes: proceso.memoriaBytes,
    emisor: emisorDe(proceso),
    descripcion: proceso.descripcion,
  }
}

export function filaDeCatalogo(proceso: ProcessSnapshotResponse): FilaProceso {
  return {
    pid: proceso.pid,
    nombre: proceso.name,
    prioridad: proceso.priority,
    cpu: proceso.cpuUsagePercent,
    memoriaBytes: proceso.memoryUsageBytes,
    // La API guarda `null` cuando el emisor era el sistema.
    emisor: proceso.user?.trim() ? proceso.user : "Sistema",
    descripcion: proceso.description,
  }
}
