/**
 * Regla para decidir si un proceso pertenece al sistema operativo.
 *
 * Los procesos del sistema se guardan con emisor "Sistema" y prioridad 1
 * (no expulsivos) para la simulación de planificación.
 */

/** Cuentas de servicio de Windows, en inglés y en español. */
const CUENTAS_DEL_SISTEMA = new Set([
  "SYSTEM",
  "LOCAL SERVICE",
  "NETWORK SERVICE",
  "LOCALSYSTEM",
  "SISTEMA",
  "SERVICIO LOCAL",
  "SERVICIO DE RED",
])

/**
 * Un proceso es del sistema si:
 * - su PID es 0 (Idle) o 4 (System) en Windows, o
 * - no tiene usuario conocido, o
 * - su usuario es una cuenta de servicio (p. ej. `NT AUTHORITY\SYSTEM`).
 */
export function esProcesoDelSistema(usuario: string | null, pid: number) {
  if (pid === 0 || pid === 4) {
    return true
  }
  if (!usuario?.trim()) {
    return true
  }

  // "NT AUTHORITY\SYSTEM" → "SYSTEM"
  const cuenta = usuario.trim().split(/[\\/]/).pop() ?? ""
  return CUENTAS_DEL_SISTEMA.has(cuenta.toUpperCase())
}
