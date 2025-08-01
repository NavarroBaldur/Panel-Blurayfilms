// src/hooks/use-films-paginated.ts
"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Film } from "@/types"
import { ColumnFiltersState, SortingState } from "@tanstack/react-table"

interface UseFilmsPaginatedResult {
  data: Film[]
  totalFilms: number
  isLoading: boolean
  error: string | null
  refreshData: () => void
}

export const useFilmsPaginated = (
  filmType: string,
  currentPage: number,
  itemsPerPage: number,
  globalFilter: string,
  columnFilters: ColumnFiltersState,
  sorting: SortingState
): UseFilmsPaginatedResult => {
  const [data, setData] = useState<Film[]>([])
  const [totalFilms, setTotalFilms] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      let query = supabase.from("films").select("*", { count: "exact" })

      // ===========================================
      // LÓGICA DE FILTRADO PARA LA PESTAÑA "CULT_FILM"
      // ===========================================
      if (filmType === "Culto") {
        query = query.eq("cult_film", true)
      } else {
        query = query.contains("film_type", [filmType])
      }
      // ===========================================

      // Aplicar filtro global (búsqueda en múltiples columnas)
      if (globalFilter) {
        query = query.or(
          `title.ilike.%${globalFilter}%,year_film.ilike.%${globalFilter}%,cult_brand.ilike.%${globalFilter}%`
        )
      }

      // Aplicar filtros de columna (estos se aplican *además* del filtro de la pestaña)
      columnFilters.forEach((filter) => {
        if (filter.id === "cult_film") {
          query = query.eq("cult_film", filter.value === "true")
        } else if (filter.id === "film_type") {
          if (filmType !== "Culto") {
            query = query.contains('film_type', [filter.value as string]);
          }
        }
      })

      // Aplicar ordenamiento
      if (sorting.length > 0) {
        sorting.forEach((sort) => {
          query = query.order(sort.id, { ascending: sort.desc === false })
        })
      } else {
        // Ordenamiento por defecto si no hay sorting definido
        query = query.order("title", { ascending: true })
      }

      // Aplicar paginación
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      query = query.range(from, to)

      const { data: filmsData, error: dbError, count } = await query

      if (dbError) {
        throw dbError;
      }

      setData(filmsData as Film[] || [])
      setTotalFilms(count || 0)
    } catch (err: unknown) {
      console.error("Error fetching films:", err)
      if (err instanceof Error) {
        setError(`Error al cargar las películas: ${err.message}`);
      } else if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
        setError(`Error al cargar las películas: ${(err as { message: string }).message}`);
      } else {
        setError("Error al cargar las películas: Ocurrió un error inesperado.");
      }
      setData([])
      setTotalFilms(0)
    } finally {
      setIsLoading(false)
    }
  }, [filmType, currentPage, itemsPerPage, globalFilter, columnFilters, sorting])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, totalFilms, isLoading, error, refreshData: fetchData }
}