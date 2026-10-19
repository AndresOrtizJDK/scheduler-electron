/**
 * Proceso principal de Electron: punto de entrada de la aplicación.
 *
 * Electron tiene dos mundos:
 * - Proceso principal (este archivo, Node.js): crea ventanas, lee procesos del
 *   sistema y habla con la API.
 * - Proceso de la ventana (carpeta `src/`, React): solo dibuja la interfaz.
 * Se comunican por IPC a través de `preload.ts`.
 */
import { join } from "node:path"
import { app, BrowserWindow } from "electron"

import { registrarCanales } from "./ipc"

/** Carpeta donde Vite deja main.js y preload.cjs (dist-electron/). */
const CARPETA_ELECTRON = import.meta.dirname
/** Carpeta con la interfaz ya compilada (dist/). */
const CARPETA_INTERFAZ = join(CARPETA_ELECTRON, "../dist")

function crearVentana() {
  const ventana = new BrowserWindow({
    title: "Scheduler",
    width: 1200,
    height: 800,
    minWidth: 1020,
    minHeight: 680,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(CARPETA_ELECTRON, "preload.cjs"),
      // Seguridad: la ventana no puede usar Node.js directamente.
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  // En desarrollo Vite sirve la interfaz con recarga en caliente;
  // en producción se abre el HTML compilado.
  const urlDesarrollo = process.env.VITE_DEV_SERVER_URL
  if (urlDesarrollo) {
    ventana.loadURL(urlDesarrollo)
  } else {
    ventana.loadFile(join(CARPETA_INTERFAZ, "index.html"))
  }
}

app.whenReady().then(() => {
  registrarCanales()
  crearVentana()

  // macOS: volver a abrir la ventana al hacer clic en el Dock.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana()
  })
})

// Windows y Linux: cerrar la última ventana termina la aplicación.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})
