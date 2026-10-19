import { MoonIcon, SunIcon } from "lucide-react"

import { useTheme } from "@/components/theme-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { EstadoApi } from "@/hooks/use-estado-api"
import { cn } from "@/lib/utils"

const TEXTO_ESTADO: Record<EstadoApi, string> = {
  comprobando: "Comprobando API…",
  lista: "API lista",
  caida: "API no disponible",
}

interface EncabezadoProps {
  estadoApi: EstadoApi
  urlApi: string | null
}

/** Barra superior: nombre de la app, estado de la API y botón de tema. */
export function Encabezado({ estadoApi, urlApi }: EncabezadoProps) {
  const { theme, setTheme } = useTheme()
  const oscuro =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  return (
    <header className="border-b">
      <div className="flex h-14 items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-3">
          <span className="font-heading text-sm font-semibold tracking-tight">
            Scheduler
          </span>
          <Badge variant="secondary">Catálogos de procesos</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="flex items-center gap-2 px-2 text-xs text-muted-foreground" />
              }
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  estadoApi === "comprobando" && "bg-muted-foreground",
                  estadoApi === "lista" && "bg-primary",
                  estadoApi === "caida" && "bg-destructive"
                )}
              />
              {TEXTO_ESTADO[estadoApi]}
            </TooltipTrigger>
            <TooltipContent>{urlApi ?? "Sin dirección"}</TooltipContent>
          </Tooltip>

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Cambiar tema"
            onClick={() => setTheme(oscuro ? "light" : "dark")}
          >
            {oscuro ? <SunIcon /> : <MoonIcon />}
          </Button>
        </div>
      </div>
    </header>
  )
}
