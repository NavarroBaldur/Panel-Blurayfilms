// src/components/section-cards.tsx

import { IconTrendingUp } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// ---
// Define la interfaz para las propiedades de estadísticas de visitas
// Si alguna de estas propiedades puede ser 'null' o 'undefined' en tu lógica de datos,
// ajusta el tipo para incluir '| null' o hazla opcional con '?'
interface VisitasStats {
  visitas_totales: number;
  visitas_activas: number;
  visitas_diarias: number;
  visitas_mes: number;
  // Añade aquí cualquier otra propiedad que recibas en el objeto 'stats'
  // Por ejemplo, si tuvieras 'ultimo_acceso': string | null;
}

// ---
// Define las props para el componente SectionCards
interface SectionCardsProps {
  stats: VisitasStats | null; // La prop 'stats' es de tipo VisitasStats o puede ser null
}

export function SectionCards({ stats }: SectionCardsProps) {
  // Manejo si 'stats' es null (por ejemplo, mientras carga o si no hay datos)
  if (!stats) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 xl:grid-cols-2 2xl:grid-cols-4">
        {/* Puedes añadir un esqueleto de carga o un mensaje aquí si no hay stats */}
        <p className="col-span-full text-center text-muted-foreground">Cargando estadísticas...</p>
      </div>
    );
  }

  // Ahora TypeScript sabe que 'stats' es de tipo VisitasStats
  // por lo que la desestructuración es segura
  const {
    visitas_totales,
    visitas_activas,
    visitas_diarias,
    visitas_mes,
  } = stats;

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 xl:grid-cols-2 2xl:grid-cols-4">
      {/* Visitas Totales */}
      <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card @container/card">
        <CardHeader>
          <CardDescription>Visitas Totales</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {visitas_totales?.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Acumulado
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Métrica completa <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Desde el inicio del sitio</div>
        </CardFooter>
      </Card>

      {/* Visitas Activas */}
      <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card @container/card">
        <CardHeader>
          <CardDescription>Visitas Activas</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {visitas_activas?.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              En vivo
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Últimos 10 segundos <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Sesiones activas ahora mismo</div>
        </CardFooter>
      </Card>

      {/* Visitas Diarias */}
      <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card @container/card">
        <CardHeader>
          <CardDescription>Visitas Diarias</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {visitas_diarias?.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Hoy
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Actividad reciente <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Datos acumulados de hoy</div>
        </CardFooter>
      </Card>

      {/* Visitas Último Mes */}
      <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs dark:bg-card @container/card">
        <CardHeader>
          <CardDescription>Último Mes</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {visitas_mes?.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              30 días
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Progreso mensual <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Últimos 30 días</div>
        </CardFooter>
      </Card>
    </div>
  )
}