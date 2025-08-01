"use client" // Este componente usa estados y efectos, por lo que debe ser un Client Component

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SectionCards } from "@/components/section-cards"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTableViews } from "@/components/data-table-views"
import { DataTableRequests } from "@/components/data-table-requests"

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs2" // Asegúrate de que esta ruta sea correcta para tu componente Tabs
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar" // Asegúrate de que esta ruta sea correcta para tu componente Sidebar
import { Skeleton } from "@/components/ui/skeleton" // Componente para los "shimmer effects"

import { useVisitasDashboard } from "@/hooks/useVisitasDashboard" // Tu hook personalizado para las visitas

export default function AnaliticasPage() { // Renombrado a AnaliticasPage para mayor claridad
  // Extraemos los datos y el estado de carga de tu hook
  const { resumen, diario, loading } = useVisitasDashboard()

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties // Casteo para propiedades CSS personalizadas
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="container/main flex flex-1 flex-col gap-2"> {/* Usando 'container' en lugar de '@container' */}
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

              {/* --- 🌟 Tarjetas resumen de visitas --- */}
              {loading || !resumen ? ( // Muestra esqueletos si está cargando o si 'resumen' es null/undefined
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 lg:px-6"> {/* Ajuste de columnas para la demostración */}
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (
                <SectionCards stats={resumen} /> // Pasa el objeto 'resumen' directamente
              )}

              {/* --- 📊 Gráfico interactivo de visitas diarias --- */}
              <div className="px-4 lg:px-6">
                {loading || !diario || diario.length === 0 ? ( // Muestra esqueleto si está cargando o si 'diario' está vacío/null
                  <Skeleton className="h-[300px] w-full rounded-md" />
                ) : (
                  // 'diario' ya tiene la estructura correcta (date, mobile, desktop)
                  <ChartAreaInteractive data={diario} />
                )}
              </div>

              {/* --- 📁 Pestañas para tablas dinámicas (más vistos, más pedidos) --- */}
              <Tabs defaultValue="vistos" className="px-4 lg:px-6 space-y-6">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="vistos">Los más vistos</TabsTrigger>
                  <TabsTrigger value="pedidos">Los más pedidos</TabsTrigger>
                </TabsList>

                <TabsContent value="vistos" forceMount>
                  <DataTableViews />
                </TabsContent>

                <TabsContent value="pedidos" forceMount>
                  <DataTableRequests />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}