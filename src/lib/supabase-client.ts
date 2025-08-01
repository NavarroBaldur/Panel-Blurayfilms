import { createClient } from '@supabase/supabase-js';

// These should be set in your environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for our films
export interface Film {
  id: number;
  title: string;
  poster_url: string;
  year_film: number;
  is_premiere: boolean;
  created_at: string;
  genres_string: string;
  film_type: 'peliculas' | 'ediciones-culto' | 'series' | 'anime' | 'documentales' | 'musicales' | 'audio';
  cult_film?: boolean | null;
  cult_brand?: string | null;
}

export interface PaginatedFilmsResponse {
  data: Film[];
  count: number;
  page: number;
  total_pages: number;
}

// Function to fetch paginated films by type
export const getPaginatedFilms = async (
  filmType: string,
  page: number = 1,
  pageSize: number = 10,
  searchQuery: string = ''
): Promise<PaginatedFilmsResponse> => {
  const { data, error, count } = await supabase
    .rpc('get_films_paginated', {
      p_film_type: filmType,
      p_page: page,
      p_page_size: pageSize,
      p_search: searchQuery
    });

  if (error) {
    console.error('Error fetching films:', error);
    throw error;
  }

  return {
    data: data || [],
    count: count || 0,
    page,
    total_pages: Math.ceil((count || 0) / pageSize)
  };
};

// Function to update film premiere status
export const updateFilmPremiereStatus = async (id: number, isPremiere: boolean): Promise<boolean> => {
  const { error } = await supabase
    .from('films')
    .update({ is_premiere: isPremiere })
    .eq('id', id);

  if (error) {
    console.error('Error updating film premiere status:', error);
    return false;
  }
  return true;
};

// Function to delete films
export const deleteFilms = async (ids: number[]): Promise<boolean> => {
  const { error } = await supabase
    .from('films')
    .delete()
    .in('id', ids);

  if (error) {
    console.error('Error deleting films:', error);
    return false;
  }
  return true;
};

// Function to duplicate a film
export const duplicateFilm = async (id: number): Promise<Film | null> => {
  // Primero, obtenemos la película a duplicar
  const { data: filmData, error: fetchError } = await supabase
    .from('films')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !filmData) {
    console.error('Error fetching film to duplicate:', fetchError);
    return null;
  }

  // Desestructuramos para excluir 'id', 'created_at', 'updated_at' del objeto a insertar.
  // Usamos un comentario para desactivar la regla ESLint para estas variables no utilizadas.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _originalId, created_at: _createdAt, updated_at: _updatedAt, ...filmToInsertBase } = filmData;

  // Creamos el objeto final para insertar
  const filmToInsert = {
    ...filmToInsertBase,
    title: `${filmToInsertBase.title} (Copia)`
  };

  // Insertamos la nueva película
  const { data: newFilm, error: insertError } = await supabase
    .from('films')
    .insert([filmToInsert])
    .select()
    .single();

  if (insertError) {
    console.error('Error duplicating film:', insertError);
    return null;
  }

  return newFilm;
};

// Function to update a film
export async function updateFilm(id: number, updates: Partial<Film>): Promise<Film | null> {
  const { data, error } = await supabase
    .from('films')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating film:', error);
    return null;
  }

  return data;
};