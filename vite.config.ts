import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import electron from "vite-plugin-electron/simple"

// https://vite.dev/config/
export default defineConfig({
  // Rutas relativas: en producción Electron abre dist/index.html con file://
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    // Compila electron/main.ts y electron/preload.ts a dist-electron/ y abre
    // la ventana de Electron al ejecutar `bun dev`.
    electron({
      main: {
        entry: "electron/main.ts",
      },
      preload: {
        input: "electron/preload.ts",
        // El preload corre en sandbox, que solo acepta CommonJS.
        vite: {
          build: {
            rolldownOptions: { output: { entryFileNames: "[name].cjs" } },
          },
        },
      },
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
})
