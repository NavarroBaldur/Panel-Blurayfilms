"use client"

import { useEffect, useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export function ChartAreaInteractive({
  data,
}: {
  data: { date: string; mobile: number; desktop: number }[]
}) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = useState("90d")

  useEffect(() => {
    if (isMobile) setTimeRange("7d")
  }, [isMobile])

  const safeData = Array.isArray(data) ? data : []

  const filteredData = safeData.filter((item) => {
    const date = new Date(item.date)
    const startDate = new Date()
    startDate.setDate(
      startDate.getDate() -
        (timeRange === "30d" ? 30 : timeRange === "7d" ? 7 : 90)
    )
    return date >= startDate
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Visitas por dispositivo</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Tráfico por día segmentado móvil/escritorio
          </span>
          <span className="@[540px]/card:hidden">Tráfico diario</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">90 días</ToggleGroupItem>
            <ToggleGroupItem value="30d">30 días</ToggleGroupItem>
            <ToggleGroupItem value="7d">7 días</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40 @[767px]/card:hidden" size="sm">
              <SelectValue placeholder="Rango temporal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="90d">90 días</SelectItem>
              <SelectItem value="30d">30 días</SelectItem>
              <SelectItem value="7d">7 días</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={{
            desktop: {
              label: "Escritorio",
              color: "hsl(var(--primary))",
            },
            mobile: {
              label: "Móvil",
              color: "hsl(var(--chart-3))",
            },
          }}
          // --- ¡CORRECCIÓN AQUÍ! Se eliminan padding y curve como props directas ---
          // Estas propiedades no son aceptadas directamente por ChartContainer.
          // 'curve' ya se maneja con 'type="natural"' en los componentes <Area>.
          // Si necesitas controlar el padding del gráfico, usa la prop 'margin' en <AreaChart>
          // o estilos CSS en el contenedor.
          // --- FIN CORRECCIÓN ---
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={1} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-chart-3)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-chart-3)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("es-MX", {
                  month: "short",
                  day: "numeric",
                })
              }
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : 10}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("es-MX", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="mobile"
              type="natural" // Esto ya define la curva
              fill="url(#fillMobile)"
              stroke="var(--color-chart-3)"
              stackId="a"
            />
            <Area
              dataKey="desktop"
              type="natural" // Esto ya define la curva
              fill="url(#fillDesktop)"
              stroke="var(--color-primary)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}