"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { z } from "zod"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Image from "next/image"
const placeholder = "/placeholder.png"

export const schema = z.object({
  id: z.number(),
  image: z.string(),
  title: z.string(),
  views: z.number(),
  orders: z.number(),
})

const columns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    accessorKey: "image",
    header: "Imagen",
    cell: ({ row }) => {
      const imageUrl = row.original.image || placeholder
      return (
        <Image
          src={imageUrl}
          alt={row.original.title}
          width={48}
          height={48}
          className="rounded border"
        />
      )
    },
  },
  {
    accessorKey: "title",
    header: "Título",
  },
  {
    accessorKey: "views",
    header: "Vistas",
  },
  {
    accessorKey: "orders",
    header: "Pedidos",
  },
]

export function DataTable({
  data: initialData,
}: {
  data: z.infer<typeof schema>[]
}) {
  const table = useReactTable({
    data: initialData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full overflow-auto px-4 lg:px-6">
      <Table className="border">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="border">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="border">
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="border">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
