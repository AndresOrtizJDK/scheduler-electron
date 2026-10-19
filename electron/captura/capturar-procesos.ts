/**
 * Lectura de los procesos del sistema operativo.
 *
 * El uso de CPU no se puede saber con una sola foto: hay que ver cuánto tiempo
 * de CPU consumió cada proceso durante un intervalo. Por eso se leen los
 * procesos dos veces con `VENTANA_MS` de separación; `systeminformation`
 * calcula el porcentaje con la diferencia entre ambas lecturas.
 */
import si from "systeminformation"

import type { Captura, ProcesoCapturado } from "../../shared/tipos"
import { leerDatosWindows, type DatosWindows } from "./datos-windows"
import { esProcesoDelSistema } from "./proceso-del-sistema"

/** Duración de la medición de CPU. */
export const VENTANA_MS = 2000

const LARGO_MAXIMO = {
  nombre: 260,
  usuario: 256,
  descripcion: 10_000,
}

export async function capturarProcesos(): Promise<Captura> {
  const enWindows = process.platform === "win32"

  // Los datos extra de Windows tardan unos segundos: se piden en paralelo
  // mientras transcurre la ventana de medición.
  const datosWindows = enWindows
    ? leerDatosWindows()
    : Promise.resolve(new Map<number, DatosWindows>())

  const primera = await si.processes()
  await esperar(VENTANA_MS)
  const segunda = await si.processes()
  const capturadaEn = new Date().toISOString()
  const extras = await datosWindows

  // Un proceso que no existía en la primera lectura no tiene con qué
  // compararse, así que su CPU queda sin medir (null).
  const pidsIniciales = new Set(primera.list.map((p) => p.pid))

  const procesos: ProcesoCapturado[] = segunda.list.map((p) => {
    const extra = extras.get(p.pid)
    const usuario = recortar(extra?.usuario ?? p.user, LARGO_MAXIMO.usuario)
    return {
      pid: p.pid,
      nombre: nombreLimpio(p.name, p.pid),
      usuario,
      descripcion: recortar(
        extra?.descripcion ?? null,
        LARGO_MAXIMO.descripcion
      ),
      cpu: pidsIniciales.has(p.pid) ? porcentaje(p.cpu) : null,
      // `memRss` viene en KB (memoria física en uso).
      memoriaBytes: Math.max(0, Math.round((p.memRss ?? 0) * 1024)),
      esDelSistema: esProcesoDelSistema(usuario, p.pid),
    }
  })

  if (procesos.length === 0) {
    throw new Error("No se encontró ningún proceso legible en el sistema.")
  }
  return { capturadaEn, procesos }
}

/** Limita el CPU a 0–100 % con dos decimales (lo que acepta la API). */
function porcentaje(valor: number) {
  if (!Number.isFinite(valor) || valor < 0) return 0
  return Math.round(Math.min(100, valor) * 100) / 100
}

/** Quita ".exe" y usa `pid-N` si el proceso no tiene nombre. */
function nombreLimpio(nombre: string, pid: number) {
  const limpio = nombre.trim().replace(/\.exe$/i, "")
  return recortar(limpio, LARGO_MAXIMO.nombre) ?? `pid-${pid}`
}

/** Devuelve `null` para textos vacíos y corta los que superan `maximo`. */
function recortar(texto: string | null | undefined, maximo: number) {
  const limpio = texto?.trim()
  if (!limpio) return null
  return limpio.slice(0, maximo)
}

function esperar(ms: number) {
  return new Promise((resolver) => setTimeout(resolver, ms))
}
