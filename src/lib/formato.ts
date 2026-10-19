/** Formatos de números, fechas y tamaños en español (Colombia). */

const decimal = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})
const fecha = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
})

/** `12.5` → `"12,5 %"`; `null` → `"—"` */
export function formatoCpu(porcentaje: number | null) {
  return porcentaje === null ? "—" : `${decimal.format(porcentaje)} %`
}

/** `52428800` → `"50,0 MB"` */
export function formatoBytes(bytes: number | null) {
  if (bytes === null) return "—"
  const unidades = ["B", "KB", "MB", "GB"]
  let valor = bytes
  let unidad = 0
  while (valor >= 1024 && unidad < unidades.length - 1) {
    valor /= 1024
    unidad++
  }
  return unidad === 0
    ? `${valor} B`
    : `${decimal.format(valor)} ${unidades[unidad]}`
}

/** Fecha ISO → `"19 oct 2026, 2:37 p. m."` */
export function formatoFecha(iso: string) {
  return fecha.format(new Date(iso))
}

/** Texto vacío o `null` → `"—"` */
export function textoOGuion(texto: string | null) {
  return texto ? texto : "—"
}

export function etiquetaOrden(orden: string) {
  return orden === "memory" ? "memoria" : "CPU"
}
