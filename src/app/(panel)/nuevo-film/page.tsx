"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

// Componentes de Layout del Panel
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

// Componentes de UI (shadcn/ui)
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// Importa los componentes de Dialog necesarios
import { Dialog2, DialogContent2, DialogDescription2, DialogHeader2, DialogTitle2, DialogTrigger2 } from "@/components/ui/dialog2"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X } from "lucide-react"

// Componentes y Hooks Locales
import { Film } from "@/types"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"

// Importar `next/dynamic`
import dynamic from 'next/dynamic';
import Image from 'next/image';

// Importa el componente MovieSearch
import { MovieSearch } from "@/components/MovieSearch";


// Cargar dinámicamente los componentes que causan problemas de hidratación
const DynamicGenreMultiSelect = dynamic(() => import('@/components/genre-multi-select').then(mod => mod.GenreMultiSelect), { ssr: false });
const DynamicMultiSelectType = dynamic(() => import('@/components/multi-select-type').then(mod => mod.MultiSelectType), { ssr: false });


// --- Constantes para los selectores (las mismas que en FilmEditDrawer) ---
const tiposFilm = ["Pelicula", "Serie", "Animacion", "Anime", "Musical", "Documental", "Audio"]
const compañias = ["Ninguna","88 films","Arrow video","Bfi","Blue underground","Code red","Criterion collection","Cualdron", "Eureka","Imprint","Indicator","Kino lorber","Mill creek entertainment","Mondo macabro","Mvd visual", "Olive films","Redemption","Scorpion releasing","Scream factory","Severin","Shameless","Shout factory", "Synapse films","Twilight time","Vestron video","Vinegar syndrome","Warner archive"]
const generos = ["Accion","Animacion","Aventura","Belica","Biografia","Ciencia ficcion","Comedia","Crimen","Deporte","Documental","Drama","Familiar","Fantasia","Film noir","Historia","Misterio","Musical","Pelicula de tv","Romance","Suspenso","Terror","Western"]
const idiomas = ["Ninguno", "Ingles", "Latino", "Castellano", "Frances", "Aleman", "Italiano", "Portugues", "Japones", "Coreano", "Ruso", "Chino", "Arabe", "Indu", "Rumano", "Checo", "Bengali", "Turco", "Persa", "Hungaro", "Griego", "Tailandes", "Vietnamita", "Polaco", "Finlandes", "Sueco", "Noruego", "Danes", "Musica"]


export default function NewFilmPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<Omit<Film, "id" | "updated_at"> & { id?: string | null }>({
    id: null,
    title: "",
    year_film: "",
    film_type: [],
    cult_film: false,
    cult_brand: "",
    genres_list: [],
    genres_string: "",
    q_disks: 1,
    special_edittion: false,
    is_premiere: false,
    poster_url: "", // Aquí se guardará la URL de TMDB o la URL de Supabase Storage
    original_language: "",
    audio: "",
    subs: "",
    created_at: null,
  })

  const [localImage, setLocalImage] = useState<string | null>(null) // Para la vista previa de imagen local
  const [isSaving, setIsSaving] = useState(false)
  const [isMounted, setIsMounted] = useState(false);
  const [isMovieSearchOpen, setIsMovieSearchOpen] = useState(false); // Estado para controlar la visibilidad del modal de búsqueda

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLocalImage(reader.result as string) // Establece la imagen local para previsualización
        setForm(prevForm => ({ ...prevForm, poster_url: "" })); // Limpia poster_url si se selecciona una imagen local
      }
      reader.readAsDataURL(file)
    }
  }

  // Nueva función para manejar la selección de una película desde MovieSearch
  const handleMovieSelected = (imageUrl: string) => {
    setForm(prevForm => ({ ...prevForm, poster_url: imageUrl })); // Establece la URL de TMDB en el formulario
    setLocalImage(null); // Limpia cualquier imagen local previamente seleccionada
    setIsMovieSearchOpen(false); // Cierra el modal de búsqueda de películas
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)

    let finalPosterUrlToDb: string | null = null; // Esta será la URL final que se guardará en Supabase

    function omitFields<T extends object>(obj: T, fields: (keyof T)[]): Partial<T> {
      const result = { ...obj };
      for (const field of fields) {
        delete result[field];
      }
      return result;
    }

    try {
      // 1. Determinar la URL del póster para la inserción inicial
      // Si hay una imagen local, la URL se determinará después de la inserción inicial
      // Si hay una URL en form.poster_url (de TMDB), se usará directamente
      const initialPosterUrlForDb = localImage ? null : (form.poster_url || null);

      // Preparar datos para la inserción inicial del film
      const dataToInsert = omitFields(form, ['id', 'created_at']);  
      dataToInsert.poster_url = initialPosterUrlForDb; // Asigna la URL inicial

      // Convertir genres_list a genres_string
      if (dataToInsert.genres_list && dataToInsert.genres_list.length > 0) {
        dataToInsert.genres_string = dataToInsert.genres_list.join(', ');
      } else {
        dataToInsert.genres_string = null;
      }

      // Insertar el film para obtener el ID
      const { data: newFilmDataArray, error: insertError } = await supabase
        .from("films")
        .insert(dataToInsert)
        .select();

      if (insertError) {
        throw new Error(`Error al crear película en la BD: ${insertError.message}`)
      }

      const newFilm = newFilmDataArray?.[0];
      if (!newFilm || !newFilm.id) {
        throw new Error("No se pudo obtener el ID de la película recién creada.");
      }

      // 2. Si se seleccionó una imagen local, subirla ahora usando el ID del nuevo film
      if (localImage) {
        const fileExtension = localImage.substring(localImage.indexOf('/') + 1, localImage.indexOf(';'));
        const format = fileExtension.split('/')[1];
        const fileName = `${Date.now()}.${format}`;
        const pathInStorage = `covers/${newFilm.id}/${fileName}`; // Usa el ID del nuevo film

        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(pathInStorage, dataURLtoBlob(localImage), {
            cacheControl: "3600",
            upsert: true,
          })

        if (uploadError) {
          throw new Error(`Error al subir imagen local a Storage: ${uploadError.message}`)
        }

        const { data: publicUrlData } = supabase.storage
          .from("media")
          .getPublicUrl(pathInStorage)
        
        finalPosterUrlToDb = publicUrlData.publicUrl; // Actualiza con la URL pública de la imagen subida
      } else {
        // Si no hay imagen local, la URL final es la que ya estaba en form.poster_url (de TMDB o vacía)
        finalPosterUrlToDb = form.poster_url || null;
      }

      // 3. Actualizar el film recién creado con la URL final del póster si es diferente
      // Esto es necesario si se subió una imagen local o si la URL de TMDB no se guardó en la inserción inicial.
      if (finalPosterUrlToDb && newFilm.poster_url !== finalPosterUrlToDb) {
        const { error: updatePosterError } = await supabase
          .from("films")
          .update({ poster_url: finalPosterUrlToDb })
          .eq("id", newFilm.id);

        if (updatePosterError) {
          console.warn("Advertencia: Película creada pero hubo un error al actualizar la URL del póster.", updatePosterError);
          toast.error(`Película creada, pero error al guardar el póster: ${updatePosterError.message}`);
        }
      }

      toast.success("¡Película creada exitosamente y póster guardado!");
      router.push("/");
    } catch (error: unknown) {
      console.error("Error al crear película:", error);
      if (error instanceof Error) {
        toast.error(`Error al crear: ${error.message}`);
      } else if (typeof error === 'string') {
        toast.error(`Error al crear: ${error}`);
      } else {
        toast.error("Error al crear: Ocurrió un error desconocido.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(",")
    const mime = arr[0].match(/:(.*?);/)?.[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mime })
  }

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
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="flex flex-col h-full bg-background p-4">
                <div className="flex items-center justify-between pb-4 border-b">
                  <h1 className="text-xl font-semibold">Crear Nueva Película</h1>
                  <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <X className="h-5 w-5" />
                    <span className="sr-only">Cerrar</span>
                  </Button>
                </div>

                <div className="grid w-full grid-cols-1 md:grid-cols-2 gap-4 px-8 py-6 overflow-y-auto flex-1">
                  <div className="flex flex-col gap-4">
                    <span className="flex gap-2">
                      <Button type="button" variant="secondary" size="sm" onClick={handleFileSelect}>
                        Subir imagen
                      </Button>
                      {/* Botón para abrir el modal de búsqueda de películas */}
                      <Dialog2 open={isMovieSearchOpen} onOpenChange={setIsMovieSearchOpen}>
                        <DialogTrigger2 asChild>
                          <Button type="button" variant="outline" size="sm">
                            Buscar imagen API
                          </Button>
                        </DialogTrigger2>
                        <DialogContent2 className="fixed inset-0 w-screen h-screen max-w-full max-h-full rounded-none flex flex-col p-0 translate-x-[0%] translate-y-[0%]"> {/* Ajusta el tamaño y quita padding predeterminado */}
                          <DialogHeader2 className="p-12 pb-0"> {/* Añade padding al header */}
                            <DialogTitle2>Buscar Póster de Película en TMDB</DialogTitle2>
                            <DialogDescription2>
                              Busca una película y selecciona su póster para usarlo.
                            </DialogDescription2>
                          </DialogHeader2>
                          <div className="flex-1 overflow-y-auto"> {/* Contenedor para el contenido scrollable */}
                            <MovieSearch onMovieSelected={handleMovieSelected} />
                          </div>
                        </DialogContent2>
                      </Dialog2>
                    </span>
                    <div className="aspect-[3/4] w-[80%] h-[90%] border rounded-xl flex items-center justify-center bg-muted">
                      {/* Lógica para mostrar la imagen: localImage tiene prioridad, luego form.poster_url */}
                      {localImage ? (
                        <Image src={localImage} alt="Vista previa" className="object-cover h-full border rounded-xl" width={1920} height={1080} />
                      ) : form.poster_url ? (
                        <Image src={form.poster_url} alt="Poster actual" className="object-cover h-full border rounded-xl" width={1920} height={1080} />
                      ) : (
                        <span className="text-muted-foreground text-xs">Sin imagen</span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>

                  <form className="flex flex-col gap-6" onSubmit={handleSave}>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Título</label>
                      <Input
                        placeholder="Título de la película"
                        value={form.title || ""}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Año</label>
                      <Input
                        type="text"
                        placeholder="Año de lanzamiento"
                        value={form.year_film || ""}
                        onChange={(e) => setForm({ ...form, year_film: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium">Tipo de film</label>
                      {isMounted ? (
                        <DynamicMultiSelectType
                          value={form.film_type || []}
                          onChange={(v) => setForm({ ...form, film_type: v })}
                          options={tiposFilm}
                        />
                      ) : (
                        <Input disabled placeholder="Cargando tipos de film..." />
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium">Géneros</label>
                      {isMounted ? (
                        <DynamicGenreMultiSelect
                          value={form.genres_list || []}
                          onChange={(v) => setForm({ ...form, genres_list: v })}
                          options={generos}
                        />
                      ) : (
                        <Input disabled placeholder="Cargando géneros..." />
                      )}
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      <label className="flex items-center gap-1 text-sm">
                        <Checkbox
                          checked={form.cult_film}
                          onCheckedChange={(v) => setForm({ ...form, cult_film: !!v })}
                        />
                        Film de culto
                      </label>
                      {form.cult_film && (
                        <Select
                          value={form.cult_brand || ""}
                          onValueChange={(v) => setForm({ ...form, cult_brand: v })}
                        >
                          <SelectTrigger className="min-w-[180px]">
                            <SelectValue placeholder="Compañía" />
                          </SelectTrigger>
                          <SelectContent>
                            {compañias.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      <label className="flex items-center gap-1 text-sm">Idioma original</label>
                        <Select
                          value={form.original_language || ""}
                          onValueChange={(v) => setForm({ ...form, original_language: v })}
                        >
                          <SelectTrigger className="min-w-[180px]">
                            <SelectValue placeholder="Idioma original" />
                          </SelectTrigger>
                          <SelectContent>
                            {idiomas.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium">Audio y Subtítulos</label>
                      <div className="flex items-center gap-4 flex-wrap">
                        <Select
                          value={form.audio || ""}
                          onValueChange={(v) => setForm({ ...form, audio: v })}
                        >
                          <SelectTrigger className="min-w-[140px]">
                            <SelectValue placeholder="Audio" />
                          </SelectTrigger>
                          <SelectContent>
                            {idiomas.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={form.subs || ""}
                          onValueChange={(v) => setForm({ ...form, subs: v })}
                        >
                          <SelectTrigger className="min-w-[140px]">
                            <SelectValue placeholder="Subtítulos" />
                          </SelectTrigger>
                          <SelectContent>
                            {idiomas.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                      <div className="space-y-1 w-[120px]">
                        <label className="text-sm font-medium">Qty. Discos</label>
                        <Input
                          type="number"
                          value={form.q_disks ?? ""}
                          onChange={(e) =>
                            setForm({ ...form, q_disks: Number(e.target.value) })
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-1 text-sm">
                          <Checkbox
                            checked={form.is_premiere}
                            onCheckedChange={(v) =>
                              setForm({ ...form, is_premiere: !!v })
                            }
                          />
                          Es estreno
                        </label>
                      </div>
                    </div>

                    <div className="border-t px-4 py-3 flex justify-between mt-auto bg-background sticky bottom-0 z-10">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? "Guardando..." : "Crear película"}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}