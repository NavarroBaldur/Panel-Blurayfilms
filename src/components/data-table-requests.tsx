"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/tableF"
import { supabase } from "@/lib/supabaseClient" // 👈 Importa desde tu helper
import Image from "next/image"

export type Films = {
  id: string
  title: string
  poster_url: string
  views: number
  request: number
}

const columns: ColumnDef<Films>[] = [
  {
    accessorKey: "poster_url",
    header: "Imagen",
    cell: ({ row }) => (
      <Image
        src={row.getValue("poster_url")}
        alt={row.getValue("title")}
        className="w-12 h-16 rounded-md"
        width={1920}
        height={1080}
      />
    ),
  },
  {
    accessorKey: "title",
    header: "Título",
    cell: ({ row }) => {
      const id = row.original.id
      return (
        <a
          href={`https://blurayfilms-hd.cl/pelicula/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-white hover:underline"
        >
          {row.getValue("title")}
        </a>
      )
    },
  },
  {
    accessorKey: "id",
    header: "Id",
    cell: ({ row }) => (
      <div className="text-start font-semibold">{row.getValue("id")}</div>
    ),
  },
  {
    accessorKey: "request",
    header: () => (
      <div className="text-start text-chart-1 font-black tracking-wide">
        Pedidos
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-start text-chart-1 font-semibold">{row.getValue("request")}</div>
    ),
  },
  {
    accessorKey: "views",
    header: "Vistas",
    cell: ({ row }) => (
      <div className="text-start font-semibold">{row.getValue("views")}</div>
    ),
  },
]

export function DataTableRequests() {
  const [data, setData] = useState<Films[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFilms = async () => {
      const { data: films, error } = await supabase
        .from("films")
        .select("*")
        .order("request", { ascending: false })
        .limit(5)

      if (error) {
        console.error("Error fetching films:", error)
      } else {
        setData(films as Films[])
      }

      setLoading(false)
    }

    fetchFilms()
  }, [])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-10">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No hay resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}