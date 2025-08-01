// src/app/(panel)/page.tsx
import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "@/components/data-films copy 2" // Asegúrate de que esta ruta sea la correcta para tu DataTable
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

// import data from "./data.json" // Ya no es necesario importar este 'data' aquí

export default function Page() {

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* CORRECCIÓN: Elimina la prop 'data' */}
              <DataTable />
              {/* Si quisieras un tipo de película por defecto, podrías hacer: */}
              {/* <DataTable filmType="Pelicula" /> */}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}