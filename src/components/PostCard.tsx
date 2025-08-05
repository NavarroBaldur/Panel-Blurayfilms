// src/components/PostCard.tsx
// Este componente ahora:
// 1. Usa directamente la URL de la imagen pre-construida por los APIs.
// 2. Llama correctamente al endpoint API de Astro para actualizar las vistas de la película.
// 3. Normaliza el campo film_type (que es un array) y corrige el uso de genres_string.
// 4. Acepta y desestructura correctamente la prop 'onSelect' para manejar la selección de imagen desde MovieSearch.
// 5. Utiliza el componente <Image /> de Next.js para optimización y maneja el fallback de imagen de forma segura.

import React, { useState, useEffect } from 'react'; // Importa useState y useEffect
import Image from 'next/image'; // Importa el componente Image de Next.js

// REMOVIDO: const R2_BASE_URL ya no es necesario aquí.
// La URL final de la imagen ya viene pre-construida desde el API.

// REMOVIDO: getFinalImageUrl function ya no es necesaria aquí.
// La lógica para construir la URL de la imagen se movió a los endpoints API.

interface FilmProps {
  id?: string | number;
  title?: string;
  film_type?: string | string[];
  genres_string?: string;
  year_film?: string;
  img: string; // La URL de la imagen ya viene completa
}

interface PostCardProps {
  film: FilmProps;
  onSelect?: (imageUrl: string) => void; // Prop opcional para la selección
}

export default function PostCard({ film, onSelect }: PostCardProps) {
  // Nuevo estado para controlar el error de carga de imagen
  // MOVIDO: Las llamadas a Hooks deben ir al principio del componente
  const [imageError, setImageError] = useState(false); 

  // Restablece el estado de error de imagen cuando la URL de la película cambia
  // MOVIDO: Las llamadas a Hooks deben ir al principio del componente
  useEffect(() => {
    setImageError(false);
  }, [film?.img]); // Usa encadenamiento opcional para film.img por si film es null

  if (!film) return null; // Ahora el early return está después de los Hooks

  const {
    id = 'no-id',
    title = 'Sin título',
    film_type = '',
    genres_string = '',
    year_film = '',
  } = film;

  // Normalizar el campo film_type si viene como array
  const filmTypeLabel = Array.isArray(film_type)
    ? film_type[0] || ''
    : film_type || '';

  // Usa directamente la URL del campo 'img' que ya viene completa desde el API
  const imageUrl = film.img;

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Si la prop onSelect está presente, significa que estamos en modo selección.
    if (onSelect) {
      e.preventDefault(); // Evita la navegación predeterminada
      onSelect(imageUrl); // Llama a la función de selección con la URL de la imagen
      return; // Termina la función aquí para no ejecutar la lógica de redirección y vistas
    }

    // Lógica original si no estamos en modo selección (onSelect no está presente)
    e.preventDefault(); // Evitar redirección inmediata

    try {
      // Envía el ID usando FormData para que coincida con film-views.ts
      const formData = new FormData();
      formData.append('id', id.toString()); // Asegúrate de que id sea string para FormData

      // Llama a tu nuevo endpoint API para actualizar las vistas
      const response = await fetch(`/api/film-views`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error al actualizar vistas vía API:', errorText || response.statusText);
      } else {
        const result = await response.json();
        console.log(`✅ Vistas actualizadas vía API: ${result.newViews}`);
      }
    } catch (err: unknown) { // Cambiado de any a unknown
      console.error('❌ Error general al llamar a la API de vistas:', err instanceof Error ? err.message : 'Error desconocido'); // Type narrowing
    }

    // Redirigir tras pequeña espera para garantizar que se haga la llamada API
    setTimeout(() => {
      window.location.href = `/pelicula/${id}`;
    }, 200);
  };

  return (
    // Usa un div si onSelect está presente para evitar que sea un enlace por defecto
    // O un <a> si no hay onSelect para mantener la navegación original
    <a 
      href={onSelect ? "#" : `/pelicula/${id}`} // Si onSelect, el href es solo un placeholder
      onClick={handleClick} 
      className="group block cursor-pointer" // Añade cursor-pointer para indicar que es clickeable
    >
      <article className="bg-dark-300 rounded-lg overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-105">
        <div className="relative w-full h-auto aspect-[2/3]"> {/* Contenedor con relación de aspecto */}
          {imageError ? (
            // Contenido de fallback cuando la imagen falla en cargar
            <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-xs rounded-lg">
              Sin imagen
            </div>
          ) : (
            <Image
              src={imageUrl} // Usa la URL final directamente
              alt={title || "Poster de película"} // Asegúrate de tener un alt text
              fill // Usa 'fill' para que la imagen ocupe todo el contenedor
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" // Optimización de tamaños
              className="object-cover rounded-lg" // 'object-cover' para cubrir el área sin distorsionar
              onError={() => setImageError(true)} // Establece el estado de error en caso de fallo de carga
            />
          )}
          {filmTypeLabel && (
            <div className="absolute top-2 right-2 bg-primary px-2 py-1 rounded text-white font-semibold text-sm uppercase z-10"> {/* Añadido z-10 */}
              {filmTypeLabel}
            </div>
          )}
        </div>

        <div className="p-2 bg-[#1E1E1E]">
          <div className="text-sm text-gray-400 line-clamp-1 py-1">
            {genres_string}
          </div>

          <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>

          <div className="flex justify-between items-center text-sm text-gray-400 mb-2">
            <span>{year_film}</span>
          </div>
        </div>
      </article>
    </a>
  );
}
