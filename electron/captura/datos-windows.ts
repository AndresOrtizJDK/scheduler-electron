/**
 * Datos que solo Windows ofrece y que `systeminformation` no trae:
 * - la "Descripción del archivo" de cada ejecutable (p. ej. "Bloc de notas");
 * - el usuario dueño de cada proceso.
 *
 * Se obtienen con un único script de PowerShell que no requiere permisos de
 * administrador. Los procesos a los que Windows no deja acceder quedan sin
 * descripción ni usuario.
 */
import { execFile } from "node:child_process"

export interface DatosWindows {
  descripcion: string | null
  usuario: string | null
}

/**
 * 1. `tasklist /v` lista el usuario de cada PID ("N/A" o "N/D" si no se puede ver).
 * 2. `Get-Process` da la descripción del archivo.
 * 3. Se devuelve todo como JSON: [{ pid, descripcion, usuario }, ...]
 */
const SCRIPT = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$usuarios = @{}
tasklist /v /fo csv /nh |
  ConvertFrom-Csv -Header Imagen,PID,Sesion,NumSesion,Memoria,Estado,Usuario,TiempoCPU,Titulo |
  ForEach-Object { $usuarios[[int]$_.PID] = $_.Usuario }
Get-Process | ForEach-Object {
  [pscustomobject]@{ pid = $_.Id; descripcion = $_.Description; usuario = $usuarios[$_.Id] }
} | ConvertTo-Json -Compress
`

/** Devuelve los datos indexados por PID. Si algo falla, devuelve un mapa vacío. */
export async function leerDatosWindows(): Promise<Map<number, DatosWindows>> {
  const datos = new Map<number, DatosWindows>()
  try {
    const salida = await ejecutarPowerShell(SCRIPT)
    const filas = JSON.parse(salida) as {
      pid: number
      descripcion: string | null
      usuario: string | null
    }[]

    for (const fila of filas) {
      datos.set(fila.pid, {
        descripcion: fila.descripcion?.trim() || null,
        usuario: usuarioValido(fila.usuario),
      })
    }
  } catch {
    // Sin PowerShell o sin permisos: la captura sigue sin estos datos.
  }
  return datos
}

/** `tasklist` usa "N/A" (inglés) o "N/D" (español) cuando no conoce el usuario. */
function usuarioValido(usuario: string | null) {
  const texto = usuario?.trim() ?? ""
  if (texto === "" || texto === "N/A" || texto === "N/D") {
    return null
  }
  return texto
}

function ejecutarPowerShell(script: string): Promise<string> {
  return new Promise((resolver, rechazar) => {
    execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", script],
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, windowsHide: true },
      (error, salida) => (error ? rechazar(error) : resolver(salida))
    )
  })
}
