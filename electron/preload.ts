/**
 * Preload: puente entre la ventana y el proceso principal.
 *
 * La ventana corre aislada (sin acceso a Node.js). Este archivo publica en
 * `window.schedulerApp` solo las funciones que la interfaz necesita; cada una
 * envía un mensaje IPC que atiende `electron/ipc.ts`.
 */
import { contextBridge, ipcRenderer } from "electron"

import { CANALES, type SchedulerBridge } from "../shared/tipos"

const scheduler: SchedulerBridge = {
  urlApi: () => ipcRenderer.invoke(CANALES.urlApi),
  apiLista: () => ipcRenderer.invoke(CANALES.apiLista),
  listarCatalogos: () => ipcRenderer.invoke(CANALES.listarCatalogos),
  obtenerCatalogo: (numero) =>
    ipcRenderer.invoke(CANALES.obtenerCatalogo, numero),
  crearCatalogo: (solicitud) =>
    ipcRenderer.invoke(CANALES.crearCatalogo, solicitud),
  eliminarCatalogo: (numero) =>
    ipcRenderer.invoke(CANALES.eliminarCatalogo, numero),
  capturarProcesos: () => ipcRenderer.invoke(CANALES.capturarProcesos),
}

// No se llama `window.scheduler` porque Chromium ya usa ese nombre
// (Prioritized Task Scheduling API).
contextBridge.exposeInMainWorld("schedulerApp", scheduler)
