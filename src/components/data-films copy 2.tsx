"use client"

// src/components/data-films.tsx

import React, { useState, useEffect, useMemo } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  VisibilityState,
  ColumnFiltersState,
  SortingState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Film } from "@/types"
import { useFilmsPaginated } from "@/hooks/use-films-paginated"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, MoreHorizontal, CircleMinus, CircleCheck, X, ChevronRight, ChevronLeft } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"
import Image from "next/image"

// Importa el nuevo componente FilmEditDrawer
import { FilmEditDrawer } from "@/components/film-edit-drawer"

// =========================
// DEFINICIÓN DE COLUMNAS
// =========================
export const columns: ColumnDef<Film>[] = [
  // Columna de selección (checkbox)
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Seleccionar todo"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Seleccionar fila"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },

  // Columna de Imagen (poster_url)
  {
    accessorKey: "poster_url",
    header: "Imagen",
    cell: ({ row, table }) => { // <-- ¡Asegúrate de desestructurar 'table' aquí!
      const { openEditDrawer } = table.options.meta as {
        openEditDrawer: (film: Film) => void
        openSingleDeleteDialog: (film: Film) => void
      }
      return (
        <div className="w-12 h-16 bg-muted rounded-md overflow-hidden cursor-pointer" // Añade cursor-pointer para indicar que es clickeable
             onClick={() => openEditDrawer(row.original)} // Mueve el onClick al div contenedor para cubrir toda la celda
        >
          {row.getValue("poster_url") ? (
            <Image
              src={row.getValue("poster_url") as string}
              alt={row.getValue("title") as string}
              className="w-full h-full object-cover"
              // No necesitas el onClick aquí, ya lo tenemos en el div padre
              width={100}
              height={100}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              Sin imagen
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Título
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="font-medium text-left max-w-[200px] whitespace-normal break-words">
        {row.getValue("title")}
      </div>
    ),
  },
  {
    accessorKey: "year_film",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Año
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue("year_film")}</div>,
  },
  {
    accessorKey: "film_type",
    header: "Tipo",
    cell: ({ row }) => {
      const types: string[] = row.getValue("film_type")
      return (
        <div className="flex flex-wrap justify-center gap-1">
          {types.map((type) => (
            <Badge key={type} variant="secondary">
              {type}
            </Badge>
          ))}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return (row.getValue(id) as string[]).includes(value)
    },
  },
  {
    accessorKey: "id",
    header: "ID Film",
    cell: ({ row }) => {
      const id: string = row.original.id
      return (
        <div
          className="w-[180px] cursor-pointer"
          onClick={() => {
            navigator.clipboard.writeText(id)
            toast("ID copiado", {
              description: id,
            })
          }}
        >
          <Badge
            variant="outline"
            className="block w-full text-muted-foreground text-xs px-1.5 py-1 whitespace-normal break-words leading-snug text-start"
          >
            {id}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "cult_film",
    header: "Culto",
    cell: ({ row }) => (
      <div className="text-center">
        {row.getValue("cult_film") ? <CircleCheck className="w-4 h-4 text-primary" /> : <CircleMinus className="w-4 h-4" />}
      </div>
    ),
    filterFn: (row, id, value) => {
      return (row.getValue(id) as boolean) === (value === "true")
    },
  },
  {
    accessorKey: "cult_brand",
    header: "Compañía Culto",
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("cult_brand") || "-"}</div>
    ),
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const { openEditDrawer, openSingleDeleteDialog } = table.options.meta as {
        openEditDrawer: (film: Film) => void
        openSingleDeleteDialog: (film: Film) => void
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Button
              variant="ghost"
              className="w-full justify-start px-2 py-1.5 text-sm font-normal"
              onClick={() => openEditDrawer(row.original)}
            >
              Editar
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start px-2 py-1.5 text-sm font-normal text-destructive"
              onClick={() => openSingleDeleteDialog(row.original)}
            >
              Eliminar
            </Button>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

interface DataTableProps {
  filmType?: string
}

export function DataTable({ filmType = "Pelicula" }: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [globalFilter, setGlobalFilter] = useState("")
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [selectedFilmType, setSelectedFilmType] = useState(filmType)

  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [selectedFilmToEdit, setSelectedFilmToEdit] = useState<Film | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [filmToDelete, setFilmToDelete] = useState<Film | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ESTADO DE SELECCIÓN DE FILAS
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({}); // Correcto

  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)

    // NUEVO ESTADO: Para el input de página
    const [pageInput, setPageInput] = useState(currentPage.toString()); // <-- NUEVO

  const { data: films, totalFilms, isLoading, error, refreshData } = useFilmsPaginated(
    selectedFilmType,
    currentPage,
    itemsPerPage,
    globalFilter,
    columnFilters,
    sorting
  )

  const data = useMemo(() => films || [], [films])

    // Calcular el total de páginas
    const totalPages = useMemo(() => { // <-- NUEVO
      return Math.ceil(totalFilms / itemsPerPage);
    }, [totalFilms, itemsPerPage]);
  
    // Actualizar el valor del input cuando la página actual cambia
    useEffect(() => { // <-- NUEVO
      setPageInput(currentPage.toString());
    }, [currentPage]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,

    // **********************************************
    // 💡 LA CORRECCIÓN CLAVE ESTÁ AQUÍ: `getRowId`
    // **********************************************
    getRowId: (row) => row.id, // <-- ¡Añade esta línea! Le dice a React Table cuál es la ID única de cada fila.

    // Manejo de la selección de filas
    onRowSelectionChange: setRowSelection,
    state: {
      globalFilter,
      columnFilters,
      sorting,
      columnVisibility,
      pagination: {
        pageIndex: currentPage - 1,
        pageSize: itemsPerPage,
      },
      rowSelection, // Utiliza el estado controlado aquí
    },
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    rowCount: totalFilms,
    meta: {
      openEditDrawer: (film: Film) => {
        setSelectedFilmToEdit(film)
        setIsEditDrawerOpen(true)
      },
      openSingleDeleteDialog: (film: Film) => {
        setFilmToDelete(film)
        setIsDeleteDialogOpen(true)
      },
    },
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedFilms = selectedRows.map(row => row.original)
  const selectedCount = selectedFilms.length

  const handleDeleteFilm = async () => {
    if (!filmToDelete) return

    setIsDeleting(true)
    try {
      if (filmToDelete.poster_url) {
        try {
          const supabaseUrlEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;

          if (!supabaseUrlEnv) {
            console.error("Error: NEXT_PUBLIC_SUPABASE_URL no está definida en las variables de entorno.");
            toast.error("Error de configuración: URL de Supabase no encontrada.");
            setIsDeleting(false);
            return; // Detiene la ejecución si la variable no está definida
          }

          const supabaseProjectRef = supabaseUrlEnv.split('//')[1]?.split('.')[0];
          
          if (!supabaseProjectRef) {
            console.error("Error: No se pudo extraer la referencia del proyecto de NEXT_PUBLIC_SUPABASE_URL.");
            toast.error("Error de configuración: Referencia de proyecto Supabase inválida.");
            setIsDeleting(false);
            return; // Detiene la ejecución si la referencia no se puede extraer
          }

          const baseUrl = `https://${supabaseProjectRef}.supabase.co/storage/v1/object/public/media/`;

          if (filmToDelete.poster_url.startsWith(baseUrl)) {
            const pathToDelete = filmToDelete.poster_url.substring(baseUrl.length);
            console.log("Eliminando imagen de storage:", pathToDelete);
            const { error: deleteImageError } = await supabase.storage
              .from("media")
              .remove([pathToDelete]);

            if (deleteImageError && deleteImageError.message !== "The resource was not found") {
              console.error(`Error al eliminar imagen de Storage: ${deleteImageError.message}`);
              toast.warning(`Advertencia al eliminar imagen: ${deleteImageError.message}`);
            } else if (!deleteImageError) {
              console.log("Imagen de Storage eliminada exitosamente.");
            }
          }
        } catch (e: unknown) { // <-- Cambiado de 'any' a 'unknown'
          // Para acceder a 'message' de forma segura, verifica que sea una instancia de Error
          console.error("Error al procesar eliminación de imagen:", e instanceof Error ? e.message : e);
          toast.warning(`Error al intentar eliminar imagen: ${e instanceof Error ? e.message : 'Error desconocido'}`);
        }
      }

      const { error: deleteFilmError } = await supabase
        .from("films")
        .delete()
        .eq("id", filmToDelete.id)

      if (deleteFilmError) {
        throw new Error(`Error al eliminar película de la base de datos: ${deleteFilmError.message}`)
      }

      toast.success("¡Película eliminada exitosamente!")
      refreshData()
      setIsDeleteDialogOpen(false)
      setFilmToDelete(null)
    } catch (error: unknown) { // <-- Cambiado de 'any' a 'unknown'
      console.error("Error al eliminar película:", error)
      toast.error(`Error al eliminar: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkDeleteFilms = async () => {
    if (selectedFilms.length === 0) return

    setIsDeleting(true)
    let successfulDeletions = 0
    let failedDeletions = 0

    const supabaseUrlEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrlEnv) {
      console.error("Error: NEXT_PUBLIC_SUPABASE_URL no está definida en las variables de entorno para eliminación masiva.");
      toast.error("Error de configuración: URL de Supabase no encontrada para eliminación masiva.");
      setIsDeleting(false);
      return;
    }

    const supabaseProjectRef = supabaseUrlEnv.split('//')[1]?.split('.')[0];
    
    if (!supabaseProjectRef) {
      console.error("Error: No se pudo extraer la referencia del proyecto de NEXT_PUBLIC_SUPABASE_URL para eliminación masiva.");
      toast.error("Error de configuración: Referencia de proyecto Supabase inválida para eliminación masiva.");
      setIsDeleting(false);
      return;
    }

    const baseUrl = `https://${supabaseProjectRef}.supabase.co/storage/v1/object/public/media/`;

    for (const film of selectedFilms) {
      try {
        if (film.poster_url) {
          try {
            if (film.poster_url.startsWith(baseUrl)) {
              const pathToDelete = film.poster_url.substring(baseUrl.length);
              const { error: deleteImageError } = await supabase.storage
                .from("media")
                .remove([pathToDelete]);

              if (deleteImageError && deleteImageError.message !== "The resource was not found") {
                console.error(`Error al eliminar imagen de Storage para ${film.title}: ${deleteImageError.message}`);
              }
            }
          } catch (e: unknown) { // <-- Cambiado de 'any' a 'unknown'
            console.error(`Error al procesar eliminación de imagen para ${film.title}: ${e instanceof Error ? e.message : e}`);
          }
        }

        const { error: deleteFilmError } = await supabase
          .from("films")
          .delete()
          .eq("id", film.id);

        if (deleteFilmError) {
          throw new Error(`Error al eliminar película ${film.title} de la base de datos: ${deleteFilmError.message}`);
        }
        successfulDeletions++;
      } catch (error: unknown) { // <-- Cambiado de 'any' a 'unknown'
        console.error(error instanceof Error ? error.message : error);
        failedDeletions++;
      }
    }

    if (successfulDeletions > 0) {
      toast.success(`Se eliminaron ${successfulDeletions} película(s) exitosamente.`);
    }
    if (failedDeletions > 0) {
      toast.error(`Falló la eliminación de ${failedDeletions} película(s). Revisa la consola.`);
    }

    table.toggleAllPageRowsSelected(false);
    refreshData();
    setIsBulkDeleteDialogOpen(false);
    setIsDeleting(false);
  }

  const handleCloseBulkDeleteDialog = () => {
    setIsBulkDeleteDialogOpen(false);
    table.toggleAllPageRowsSelected(false);
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setItemsPerPage(size)
    setCurrentPage(1)
  }

  // NUEVA FUNCIÓN: Para manejar el cambio de página desde el input
  const handlePageInputBlur = () => { // Se llama al perder el foco del input o al presionar Enter
    let page = parseInt(pageInput);
    if (isNaN(page) || page < 1) {
      page = 1;
    }
    if (page > totalPages) {
      page = totalPages;
    }
    setCurrentPage(page);
    setPageInput(page.toString()); // Asegura que el input refleje la página actual validada
  };


  return (
    <Tabs
      defaultValue={filmType}
      onValueChange={(value) => setSelectedFilmType(value)}
      className="w-full p-2 flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <TabsList className="grid w-fit grid-cols-6">
          <TabsTrigger value="Pelicula">Películas</TabsTrigger>
          <TabsTrigger value="Culto">De Culto</TabsTrigger>
          <TabsTrigger value="Serie">Series</TabsTrigger>
          <TabsTrigger value="Anime">Anime</TabsTrigger>
          <TabsTrigger value="Musical">Musical</TabsTrigger>
          <TabsTrigger value="Documental">Documentales</TabsTrigger>
        </TabsList>

        <div className="flex items-center space-x-2">
          <Input
            placeholder="Buscar en la tabla..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
          />

        </div>
      </div>

      <div className="flex items-center justify-between px-8 gap-4 overflow-auto">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {selectedCount} de{" "}
          {table.getFilteredRowModel().rows.length} item(s) seleccionados.
        </div>
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage * itemsPerPage >= totalFilms}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
          {/* SECCIÓN DE PAGINACIÓN AVANZADA */}
          <div className="flex items-center space-x-2"> {/* Contenedor para el input y el texto */}
            <span className="text-sm font-medium whitespace-nowrap">
              Página
            </span>
            <Input
              type="number"
              min={1}
              max={totalPages}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={handlePageInputBlur} // Manejar cuando el input pierde el foco
              onKeyDown={(e) => { // Manejar la tecla Enter
                if (e.key === "Enter") {
                  handlePageInputBlur();
                  e.currentTarget.blur(); // Quitar el foco del input después de Enter
                }
              }}
              className="w-16 h-8 text-center"
            />
            <span className="text-sm font-medium whitespace-nowrap">
              de {totalPages}
            </span>
          </div>
          {/* FIN SECCIÓN DE PAGINACIÓN AVANZADA */}
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => handlePageSizeChange(Number(value))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Por página" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <TabsContent
        value={selectedFilmType}
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Skeleton className="h-full w-full" />
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-2 rounded-md">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No se encontraron resultados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-8 gap-4 overflow-auto">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {selectedCount} de{" "}
          {table.getFilteredRowModel().rows.length} item(s) seleccionados.
        </div>
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage * itemsPerPage >= totalFilms}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
          {/* SECCIÓN DE PAGINACIÓN AVANZADA */}
          <div className="flex items-center space-x-2"> {/* Contenedor para el input y el texto */}
            <span className="text-sm font-medium whitespace-nowrap">
              Página
            </span>
            <Input
              type="number"
              min={1}
              max={totalPages}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={handlePageInputBlur} // Manejar cuando el input pierde el foco
              onKeyDown={(e) => { // Manejar la tecla Enter
                if (e.key === "Enter") {
                  handlePageInputBlur();
                  e.currentTarget.blur(); // Quitar el foco del input después de Enter
                }
              }}
              className="w-16 h-8 text-center"
            />
            <span className="text-sm font-medium whitespace-nowrap">
              de {totalPages}
            </span>
          </div>
          {/* FIN SECCIÓN DE PAGINACIÓN AVANZADA */}
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => handlePageSizeChange(Number(value))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Por página" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      </TabsContent>

      {/* DRAWER DE EDICIÓN */}
      {selectedFilmToEdit && (
        <FilmEditDrawer
          film={selectedFilmToEdit}
          isOpen={isEditDrawerOpen}
          onClose={() => setIsEditDrawerOpen(false)}
          onSaveSuccess={() => {
            refreshData()
            setIsEditDrawerOpen(false)
            setSelectedFilmToEdit(null)
          }}
        />
      )}

      {/* DIÁLOGO DE ELIMINACIÓN INDIVIDUAL */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás absolutamente seguro?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              la película &quot;{filmToDelete?.title}&quot; y su imagen de nuestros servidores.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteFilm}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BARRA FLOTANTE DE ELIMINACIÓN MASIVA */}
      {selectedCount > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg flex items-center justify-between gap-4 z-50 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ease-out">
          <p className="text-base font-medium">
            {selectedCount} item(s) seleccionado(s)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-destructive-foreground text-destructive text-white hover:bg-white/80"
              onClick={() => setIsBulkDeleteDialogOpen(true)}
            >
              Borrar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive-foreground hover:bg-destructive/80"
              onClick={() => table.toggleAllPageRowsSelected(false)}
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Cerrar</span>
            </Button>
          </div>
        </div>
      )}

      {/* DIÁLOGO DE ELIMINACIÓN MASIVA */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={handleCloseBulkDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás absolutamente seguro de eliminar {selectedCount} items?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              todas las películas seleccionadas y sus imágenes asociadas de nuestros servidores.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseBulkDeleteDialog} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDeleteFilms}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : `Eliminar ${selectedCount} item(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}