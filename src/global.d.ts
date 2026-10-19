import type { SchedulerBridge } from "../shared/tipos"

declare global {
  interface Window {
    /** Lo publica `electron/preload.ts`. No existe si se abre en un navegador. */
    schedulerApp?: SchedulerBridge
  }
}
