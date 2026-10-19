import { CircleAlertIcon, CircleCheckIcon, XIcon } from "lucide-react"

import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import type { Aviso as DatosAviso } from "@/hooks/use-espacio-trabajo"

interface AvisoProps {
  aviso: DatosAviso
  onCerrar: () => void
}

/** Mensaje de éxito o de error debajo de los controles. */
export function Aviso({ aviso, onCerrar }: AvisoProps) {
  const esError = aviso.tipo === "error"

  return (
    <Alert variant={esError ? "destructive" : "default"} role="status">
      {esError ? <CircleAlertIcon /> : <CircleCheckIcon />}
      {/* Los errores de la API pueden traer varias líneas. */}
      <AlertDescription className="whitespace-pre-line">
        {aviso.texto}
      </AlertDescription>
      <AlertAction>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Cerrar aviso"
          onClick={onCerrar}
        >
          <XIcon />
        </Button>
      </AlertAction>
    </Alert>
  )
}
