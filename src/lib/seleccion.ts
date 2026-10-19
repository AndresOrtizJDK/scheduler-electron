/**
 * Selección de procesos: de todos los procesos leídos se queda con los
 * `cantidad` que más CPU o más memoria usan.
 *
 * Se calcula en la interfaz para poder cambiar el criterio o la cantidad sin
 * volver a leer los procesos del sistema.
 */
import type { OrdenSeleccion, ProcesoCapturado } from "../../shared/tipos"

export const CANTIDAD_MINIMA = 1
export const CANTIDAD_MAXIMA = 10_000
export const CANTIDAD_POR_DEFECTO = 20

/**
 * Ordena de mayor a menor según `orden` y devuelve los primeros `cantidad`.
 *
 * Desempates:
 * - Por CPU: luego por memoria y luego por PID.
 * - Por memoria: luego por CPU y luego por PID.
 * Los procesos sin CPU medido (`null`) quedan al final.
 */
export function seleccionarProcesos(
  procesos: ProcesoCapturado[],
  orden: OrdenSeleccion,
  cantidad: number
): ProcesoCapturado[] {
  const cpu = (p: ProcesoCapturado) => p.cpu ?? -1

  const ordenados = [...procesos].sort((a, b) => {
    if (orden === "cpu") {
      return cpu(b) - cpu(a) || b.memoriaBytes - a.memoriaBytes || a.pid - b.pid
    }
    return b.memoriaBytes - a.memoriaBytes || cpu(b) - cpu(a) || a.pid - b.pid
  })

  return ordenados.slice(0, Math.max(0, cantidad))
}

/** Convierte el texto del campo "Cantidad" en un número entre 1 y 10.000. */
export function cantidadValida(texto: string): number {
  const numero = Number.parseInt(texto, 10)
  if (Number.isNaN(numero)) {
    return CANTIDAD_POR_DEFECTO
  }
  return Math.min(CANTIDAD_MAXIMA, Math.max(CANTIDAD_MINIMA, numero))
}
