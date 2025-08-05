"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input"; // Asume que tienes shadcn/ui instalado
import { Button } from "@/components/ui/button"; // Asume que tienes shadcn/ui instalado
import { Skeleton } from "@/components/ui/skeleton"; // Asume que tienes shadcn/ui instalado
import { ChevronLeft, ChevronRight, Search } from "lucide-react"; // Asume que tienes lucide-react instalado

// Importa tu componente PostCard desde su ubicación original
import PostCard from "@/components/PostCard"; // Ajusta la ruta si es necesario

// --- Definición de Tipos para la API de TMDB ---

// Interfaz para la estructura de una película tal como la devuelve la API de TMDB
interface TmdbMovie {
  id: number;
  title: string;
  poster_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
}

// Interfaz para la estructura de datos que tu PostCard espera como prop 'film'
interface FilmForPostCard {
  id: number | string;
  title: string;
  img: string; // La URL completa de la imagen
  film_type?: string | string[];
  genres_string?: string;
  year_film?: string;
}

// Prop para MovieSearch: el callback para cuando se selecciona una película
interface MovieSearchProps {
  onMovieSelected: (imageUrl: string) => void;
}

// --- Componente de Controles de Paginación (Extraído para Reutilización) ---
interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  moviesLength: number;
  handlePageChange: (page: number) => void;
  pageInput: string;
  setPageInput: React.Dispatch<React.SetStateAction<string>>;
  handlePageInputBlur: () => void;
  showTopMargin?: boolean; // Nueva prop para controlar el margen superior
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  totalResults,
  moviesLength,
  handlePageChange,
  pageInput,
  setPageInput,
  handlePageInputBlur,
  showTopMargin = false,
}) => (
  <div className={`flex flex-col sm:flex-row items-center justify-between px-4 sm:px-8 py-4 gap-4 overflow-auto rounded-lg shadow-md ${showTopMargin ? 'mt-6' : ''}`}>
    <div className="text-muted-foreground flex-1 text-sm text-center sm:text-left">
      Mostrando {moviesLength} de {totalResults} resultados.
    </div>
    <div className="flex flex-wrap items-center justify-center sm:justify-end space-x-2 gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="rounded-lg"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="rounded-lg"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      {/* Input de paginación avanzada */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium whitespace-nowrap">Página</span>
        <Input
          type="number"
          min={1}
          max={totalPages > 0 ? totalPages : 1}
          value={pageInput}
          onChange={(e) => setPageInput(e.target.value)}
          onBlur={handlePageInputBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handlePageInputBlur();
              e.currentTarget.blur();
            }
          }}
          className="w-16 h-9 text-center rounded-lg"
        />
        <span className="text-sm font-medium whitespace-nowrap">
          de {totalPages > 0 ? totalPages : 1}
        </span>
      </div>
    </div>
  </div>
);

// --- Componente principal de Búsqueda de Películas ---

export function MovieSearch({ onMovieSelected }: MovieSearchProps) {
  const [searchTerm, setSearchTerm] = useState(""); // Estado para el término de búsqueda
  const [movies, setMovies] = useState<FilmForPostCard[]>([]); // Estado para los resultados de películas (adaptados para PostCard)
  const [currentPage, setCurrentPage] = useState(1); // Página actual de resultados
  // TMDB API de búsqueda devuelve un máximo de 20 resultados por página.
  const itemsPerPage = 20; 
  const [totalResults, setTotalResults] = useState(0); // Total de resultados encontrados
  const [totalPages, setTotalPages] = useState(0); // Total de páginas disponibles
  const [isLoading, setIsLoading] = useState(false); // Estado de carga
  const [error, setError] = useState<string | null>(null); // Estado de error

  // Estado para el input de la página (para navegación directa)
  const [pageInput, setPageInput] = useState(currentPage.toString());

  // Efecto para actualizar el valor del input de página cuando currentPage cambia
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // Función para realizar la llamada a la API de TMDB
  const fetchMovies = useCallback(async () => {
    // Si no hay término de búsqueda, limpia los resultados y reinicia los totales
    if (!searchTerm.trim()) {
      setMovies([]);
      setTotalResults(0);
      setTotalPages(0);
      return;
    }

    setIsLoading(true); // Activa el estado de carga
    setError(null); // Limpia cualquier error previo

    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY; // Obtiene la clave API de las variables de entorno
    if (!apiKey) {
      setError("TMDB API key no está configurada. Por favor, revisa tus variables de entorno.");
      setIsLoading(false);
      return;
    }

    try {
      // Construye la URL de la API de búsqueda de películas de TMDB
      const apiUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(searchTerm)}&page=${currentPage}`;
      
      const response = await fetch(apiUrl); // Realiza la petición
      if (!response.ok) {
        // Lanza un error si la respuesta no es exitosa
        throw new Error(`Error al buscar películas: ${response.statusText}`);
      }
      const data = await response.json(); // Parsea la respuesta JSON

      // Mapea los resultados de TMDB al formato que tu PostCard espera
      const mappedMovies: FilmForPostCard[] = (data.results || []).map((tmdbMovie: TmdbMovie) => ({
        id: tmdbMovie.id,
        title: tmdbMovie.title,
        // Construye la URL completa de la imagen para PostCard
        img: tmdbMovie.poster_path
          ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}`
          : `https://placehold.co/500x750/cccccc/333333?text=No+Image`, // Fallback si no hay póster
        film_type: '', // TMDB no proporciona directamente este campo en la búsqueda
        genres_string: '', // TMDB no proporciona directamente este campo en la búsqueda
        year_film: tmdbMovie.release_date ? new Date(tmdbMovie.release_date).getFullYear().toString() : '', // Extrae el año
      }));

      setMovies(mappedMovies); // Actualiza las películas con el formato adaptado
      setTotalResults(data.total_results || 0); // Actualiza el total de resultados
      setTotalPages(data.total_pages || 0); // Actualiza el total de páginas

      // Ajusta la página actual si excede el nuevo total de páginas (ej. al cambiar el término de búsqueda)
      if (currentPage > (data.total_pages || 0) && (data.total_pages || 0) > 0) {
        setCurrentPage(data.total_pages);
      } else if ((data.total_pages || 0) === 0 && currentPage !== 1) {
        setCurrentPage(1); // Si no hay resultados, vuelve a la página 1
      }

    } catch (err: unknown) {
      // Captura y maneja cualquier error durante la petición
      console.error("Error fetching movies:", err);
      setError(err instanceof Error ? err.message : "Ocurrió un error desconocido al buscar películas.");
      setMovies([]);
      setTotalResults(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false); // Desactiva el estado de carga
    }
  }, [searchTerm, currentPage]); // Dependencias para useCallback

  // Efecto para disparar la búsqueda de películas con un debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchMovies();
    }, 500); // Espera 500ms después de que el usuario deja de escribir

    // Función de limpieza para cancelar el timeout si el componente se desmonta o las dependencias cambian
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, currentPage, fetchMovies]); // Dependencias para useEffect

  // Manejador para cambiar la página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Manejador para el input de página al perder el foco o presionar Enter
  const handlePageInputBlur = () => {
    let page = parseInt(pageInput);
    // Valida que la página sea un número válido y dentro de los límites
    if (isNaN(page) || page < 1) {
      page = 1;
    }
    if (page > totalPages) {
      page = totalPages > 0 ? totalPages : 1; // Asegura que sea al menos 1 si totalPages es 0
    }
    setCurrentPage(page);
    setPageInput(page.toString()); // Asegura que el input refleje la página actual validada
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 lg:p-12 bg-background min-h-screen">
      {/* Sección de búsqueda */}
      <div className="flex justify-end">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-2">
          <Input
            type="text"
            placeholder="Busca películas por título..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reinicia a la página 1 con un nuevo término de búsqueda
            }}
            className="flex-grow max-w-lg rounded-lg shadow-sm"
          />
          <Button onClick={fetchMovies} className="rounded-lg shadow-sm w-full sm:w-auto">
            <Search className="h-5 w-5 mr-2" /> Buscar
          </Button>
        </div>
      </div>

      {/* Controles de paginación superiores (solo si hay resultados) */}
      {!isLoading && !error && movies.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalResults={totalResults}
          moviesLength={movies.length}
          handlePageChange={handlePageChange}
          pageInput={pageInput}
          setPageInput={setPageInput}
          handlePageInputBlur={handlePageInputBlur}
          showTopMargin={true} /* Añade un margen superior para separarlo de la barra de búsqueda */
        />
      )}

      {/* Estados de carga y error */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: itemsPerPage }).map((_, i) => (
            <div key={i} className="rounded-lg overflow-hidden shadow-lg bg-card p-4">
              <Skeleton className="w-full aspect-[2/3] rounded-md mb-2" />
              <Skeleton className="h-6 w-3/4 mb-1" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-red-600 text-center p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950 dark:border-red-800 dark:text-red-300">
          <p className="font-semibold">¡Error!</p>
          <p>{error}</p>
        </div>
      )}

      {/* Cuadrícula de películas y controles de paginación */}
      {!isLoading && !error && movies.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {movies.map((film) => (
              <div key={film.id} className="flex flex-col gap-2">
                <PostCard film={film} onSelect={onMovieSelected} />
              </div>
            ))}
          </div>

          {/* Controles de paginación inferiores */}
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalResults={totalResults}
            moviesLength={movies.length}
            handlePageChange={handlePageChange}
            pageInput={pageInput}
            setPageInput={setPageInput}
            handlePageInputBlur={handlePageInputBlur}
          />
        </>
      )}

      {/* Mensajes para estados sin resultados o sin búsqueda */}
      {!isLoading && !error && movies.length === 0 && searchTerm.trim() && (
        <div className="text-center text-muted-foreground p-8 bg-card rounded-lg shadow-md">
          <p className="font-semibold">¡No se encontraron películas!</p>
          <p>Intenta buscar con un título diferente.</p>
        </div>
      )}

      {!isLoading && !error && movies.length === 0 && !searchTerm.trim() && (
        <div className="text-center text-muted-foreground p-8 bg-card rounded-lg shadow-md">
          <p className="text-lg font-semibold mb-2">Comienza tu búsqueda</p>
          <p>Introduce un título de película en el campo de arriba para empezar.</p>
        </div>
      )}
    </div>
  );
}
