/**
 * Configuración de la aplicación: de dónde sale la dirección de la API.
 *
 * Orden de búsqueda (gana el primero que tenga valor):
 *   1. `API_BASE_URL`  → dirección base directa, p. ej. https://mi-api.com
 *   2. `OPENAPI-URL`   → URL del documento OpenAPI; se toma solo el origen
 *                        (https://api-schedule.salesconnect.dev/openapi/v1.json
 *                         → https://api-schedule.salesconnect.dev)
 *   3. Dirección por defecto del laboratorio.
 *
 * Cada variable se busca primero en las variables de entorno del sistema y
 * después en un archivo `.env`.
 */
import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { app } from "electron"

const URL_POR_DEFECTO = "https://api-schedule.salesconnect.dev"

/** Dirección base de la API, sin "/" al final. */
export function urlBaseApi(): string {
  const directa = leerVariable("API_BASE_URL")
  if (directa) {
    return quitarBarraFinal(directa)
  }

  const openApi = leerVariable("OPENAPI-URL")
  if (openApi) {
    try {
      return new URL(openApi).origin
    } catch {
      // URL mal escrita: se usa la dirección por defecto.
    }
  }

  return URL_POR_DEFECTO
}

/** Busca `nombre` en el entorno del sistema y luego en los archivos `.env`. */
function leerVariable(nombre: string): string | null {
  const delSistema = process.env[nombre]?.trim()
  if (delSistema) {
    return delSistema
  }

  for (const archivo of archivosEnv()) {
    const valor = leerArchivoEnv(archivo)[nombre]
    if (valor) {
      return valor
    }
  }
  return null
}

/**
 * Lugares donde puede estar el `.env`:
 * - En desarrollo (`bun dev`): la carpeta del proyecto.
 * - Con la app empaquetada: la carpeta donde está el ejecutable.
 */
function archivosEnv(): string[] {
  return [
    join(process.cwd(), ".env"),
    join(dirname(app.getPath("exe")), ".env"),
  ]
}

/**
 * Lee un `.env` sencillo con líneas `CLAVE=valor`.
 * Ignora líneas vacías, comentarios (#) y comillas alrededor del valor.
 */
function leerArchivoEnv(ruta: string): Record<string, string> {
  if (!existsSync(ruta)) {
    return {}
  }

  const variables: Record<string, string> = {}
  for (const linea of readFileSync(ruta, "utf8").split(/\r?\n/)) {
    const texto = linea.trim()
    if (texto === "" || texto.startsWith("#")) continue

    const separador = texto.indexOf("=")
    if (separador <= 0) continue

    const clave = texto.slice(0, separador).trim()
    const valor = texto
      .slice(separador + 1)
      .trim()
      .replace(/^"(.*)"$/, "$1")
    if (valor) {
      variables[clave] = valor
    }
  }
  return variables
}

function quitarBarraFinal(url: string) {
  return url.replace(/\/+$/, "")
}
