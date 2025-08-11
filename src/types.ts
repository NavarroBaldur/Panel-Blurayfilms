// src/types.ts

export type Film = {
  id: string;
  title: string; // <--- ¡CAMBIO AQUÍ! Ya no es 'string | null'
  year_film: string | null;
  poster_url: string | null;
  genres_list: string[];
  genres_string: string | null;
  q_disks: number | null;
  special_edittion: boolean;
  is_premiere: boolean;
  rating?: number | null;
  estreno_date?: string | null;
  film_type: string[];
  cult_film: boolean;
  cult_brand: string | null;
  original_language: string | null;
  audio: string | null;
  subs: string | null;
  created_at: string | null;
  updated_at: string | null;
};