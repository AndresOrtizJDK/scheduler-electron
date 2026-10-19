# Scheduler · Catálogos de procesos (Electron)

Aplicación de escritorio del laboratorio **Gestión de procesos** (Sistemas Operativos).
Lee los procesos del sistema operativo, elige los que más **CPU** o **memoria** usan y los guarda
como un **catálogo** en la API REST. También permite abrir y eliminar catálogos guardados.

Es la misma aplicación que `SchedulerUI` (JavaFX), reescrita en Electron + React para que el código
sea más fácil de leer y explicar. Los catálogos que guarda esta app son los que luego simula
`front-so` con Round Robin.

- API: <https://api-schedule.salesconnect.dev> ([OpenAPI](https://api-schedule.salesconnect.dev/openapi/v1.json))
- Stack: Electron, React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui (Base UI) y
  [`systeminformation`](https://systeminformation.io) para leer los procesos.

## Ejecutar

```bash
bun install
bun dev            # abre la ventana de Electron con recarga en caliente
bun run build      # compila la interfaz (dist/) y Electron (dist-electron/)
bun run dist       # genera el ejecutable en release/ (AppImage en Linux)
bun run dist:win   # genera el ejecutable portable de Windows
```

> Si `bun install` no descarga Electron (aparece "Electron failed to install correctly"), ejecuta
> `node node_modules/electron/install.js`.

La dirección de la API se lee del archivo `.env` (ver `.env.example`):

```env
OPENAPI-URL=https://api-schedule.salesconnect.dev/openapi/v1.json
```

De esa URL se toma solo el origen (`https://api-schedule.salesconnect.dev`). También se puede
definir `API_BASE_URL` con la dirección directa. En desarrollo el `.env` se busca en la carpeta del
proyecto; en la app empaquetada, junto al ejecutable (el empaquetado copia `.env.example` ahí).

## Uso

1. **Leer procesos**: mide el CPU durante 2 segundos y muestra los procesos que más consumen.
2. **Ordenar por** (CPU / Memoria) y **Cantidad de procesos** (1–10.000): cambian la selección al
   instante, sin volver a leer.
3. **Nombre del catálogo** + **Guardar catálogo**: envía la selección a la API.
4. **Abrir catálogo**: buscador con los catálogos guardados; al elegir uno se muestran sus procesos.
5. **Eliminar catálogo**: borra el catálogo abierto (pide confirmación).

El punto del encabezado indica si la API responde (`GET /health`). La tecla `d` o el botón del
encabezado cambian entre tema claro y oscuro.

## Cómo funciona Electron (en 1 minuto)

Electron ejecuta dos programas que se comunican por mensajes (**IPC**):

```
┌──────────────────────────────┐        ┌────────────────────────────────────┐
│ Ventana (src/, React)        │        │ Proceso principal (electron/, Node) │
│                              │  IPC   │                                    │
│ window.schedulerApp.xxx() ───┼───────►│ ipcMain.handle("xxx")              │
│                              │◄───────┼── { ok: true, datos } / { ok:false }│
│ Solo dibuja la interfaz.     │        │ Lee procesos del SO y habla con la │
│ No tiene acceso a Node.js.   │        │ API con fetch.                     │
└──────────────────────────────┘        └────────────────────────────────────┘
                ▲
                │ preload.ts publica window.schedulerApp (el "puente")
```

- La ventana corre aislada (`contextIsolation`, `sandbox`): no puede leer archivos ni procesos.
- `preload.ts` es el único puente: expone las 7 funciones de `SchedulerBridge` (ver `shared/tipos.ts`).
- Las peticiones HTTP salen del proceso principal, así no hay problemas de CORS.
- Cada respuesta es `{ ok: true, datos }` o `{ ok: false, mensaje, sinConexion }`, y
  `src/lib/scheduler.ts` la convierte en una promesa normal que se usa con `try/catch`.

## Estructura

```
scheduler-electron/
├── .env                          # OPENAPI-URL (no se sube a git; copia de .env.example)
├── shared/
│   └── tipos.ts                  # Tipos de la API, de la captura y del puente IPC (usados por ambos lados)
├── electron/                     # PROCESO PRINCIPAL (Node.js)
│   ├── main.ts                   # Crea la ventana y registra los canales
│   ├── preload.ts                # Publica window.schedulerApp en la ventana
│   ├── ipc.ts                    # Canales IPC → funciones de api/ y captura/
│   ├── config.ts                 # Lee .env y calcula la URL base de la API
│   ├── api/
│   │   └── cliente-catalogos.ts  # fetch: /health, listar, obtener, crear, eliminar + mensajes de error
│   └── captura/
│       ├── capturar-procesos.ts  # Lee los procesos 2 veces (2 s) para medir el CPU
│       ├── proceso-del-sistema.ts# Regla "¿es del sistema?" → emisor Sistema, prioridad 1
│       └── datos-windows.ts      # Descripción del ejecutable y usuario (PowerShell, solo Windows)
└── src/                          # VENTANA (React)
    ├── main.tsx                  # Monta React con el tema y los tooltips
    ├── App.tsx                   # Distribución de la pantalla (sin lógica)
    ├── global.d.ts               # Tipo de window.schedulerApp
    ├── hooks/
    │   ├── use-espacio-trabajo.ts# Estado y acciones: leer, guardar, abrir, eliminar
    │   ├── use-catalogos.ts      # Lista de catálogos y recarga
    │   └── use-estado-api.ts     # Estado de la conexión (encabezado)
    ├── lib/
    │   ├── scheduler.ts          # Llama a window.schedulerApp y convierte errores
    │   ├── seleccion.ts          # Ordenar por CPU/memoria y tomar los N primeros
    │   ├── armar-catalogo.ts     # Valida y arma el cuerpo de POST /api/catalogs
    │   ├── filas.ts              # Captura o catálogo → filas de la tabla
    │   ├── formato.ts            # CPU, bytes y fechas en es-CO
    │   └── utils.ts              # cn() de shadcn
    └── components/
        ├── encabezado.tsx        # Título, estado de la API y tema
        ├── panel-catalogos.tsx   # Buscador de catálogos y botón Eliminar (con confirmación)
        ├── panel-captura.tsx     # Nombre, orden, cantidad, Leer y Guardar
        ├── tabla-procesos.tsx    # Tabla de procesos
        ├── aviso.tsx             # Mensaje de éxito o error
        ├── theme-provider.tsx    # Tema claro/oscuro (generado por shadcn)
        └── ui/                   # Componentes shadcn/ui
```

### Recorrido de "Leer procesos"

1. `panel-captura.tsx` → botón **Leer procesos** llama a `leerProcesos()`.
2. `use-espacio-trabajo.ts` → `scheduler.capturarProcesos()`.
3. `preload.ts` → `ipcRenderer.invoke("procesos:capturar")`.
4. `ipc.ts` → `capturarProcesos()` en `electron/captura/capturar-procesos.ts`.
5. Se leen los procesos, se esperan 2 s, se leen otra vez y se devuelve la `Captura`.
6. De vuelta en React, `seleccionarProcesos()` (`src/lib/seleccion.ts`) elige los N que se muestran.

"Guardar", "Abrir" y "Eliminar" siguen el mismo camino, pero terminan en
`electron/api/cliente-catalogos.ts`.

## Reglas

| Concepto              | Regla                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------ |
| CPU                   | % de toda la máquina medido en 2 s (0–100, dos decimales). Procesos nuevos durante la medición quedan sin CPU (—) |
| Memoria               | Memoria física en uso (RSS) en bytes                                                       |
| Proceso del sistema   | PID 0 o 4, sin usuario, o cuenta de servicio (`SYSTEM`, `LOCAL SERVICE`, `NETWORK SERVICE`, `SISTEMA`, …) |
| Emisor                | `Sistema` para procesos del sistema; si no, el usuario del proceso                         |
| Prioridad             | `1` = no expulsivo (sistema), `0` = expulsivo (los demás)                                  |
| Orden por CPU         | CPU ↓, luego memoria ↓, luego PID ↑                                                        |
| Orden por memoria     | Memoria ↓, luego CPU ↓, luego PID ↑                                                        |
| Descripción           | En Windows, la "Descripción del archivo" del ejecutable; en otros sistemas queda vacía     |
| Nombre del catálogo   | Obligatorio, máximo 200 caracteres                                                         |

## Equivalencias con la versión JavaFX

| SchedulerUI (Java)                         | scheduler-electron                              |
| ------------------------------------------ | ----------------------------------------------- |
| `ApiConfig`                                | `electron/config.ts`                            |
| `CatalogApiClient`                         | `electron/api/cliente-catalogos.ts`             |
| `ProcessCaptureService` (OSHI)             | `electron/captura/capturar-procesos.ts`         |
| `WindowsFileDescription` (JNA)             | `electron/captura/datos-windows.ts`             |
| `ProcessSelection.isSystemProcess`         | `electron/captura/proceso-del-sistema.ts`       |
| `ProcessSelection.select`                  | `src/lib/seleccion.ts`                          |
| `CatalogRequests`                          | `src/lib/armar-catalogo.ts`                     |
| `api/dto/*`                                | `shared/tipos.ts`                               |
| `WorkspaceView`                            | `src/hooks/use-espacio-trabajo.ts` + `src/App.tsx` |
| `CatalogPicker` / `CatalogSearch`          | `src/components/panel-catalogos.tsx`            |
| `Notice` / `AppStatus`                     | `src/components/aviso.tsx` / `use-estado-api.ts` |
| `Formatters`                               | `src/lib/formato.ts`                            |
