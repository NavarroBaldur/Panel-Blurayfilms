// src/app/(panel)/nuevo-film/page.tsx
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

// Cargar dinámicamente los componentes que causan problemas de hidratación
const DynamicGenreMultiSelect = dynamic(() => import('@/components/genre-multi-select').then(mod => mod.GenreMultiSelect), { ssr: false });
const DynamicMultiSelectType = dynamic(() => import('@/components/multi-select-type').then(mod => mod.MultiSelectType), { ssr: false });


// --- Constantes para los selectores (las mismas que en FilmEditDrawer) ---
const tiposFilm = ["Pelicula", "Serie", "Animacion", "Anime", "Musical", "Documental", "Audio"]
const compañias = ["88 films","Arrow video","Bfi","Blue underground","Code red","Criterion collection","Cualdron", "Eureka","Imprint","Indicator","Kino lorber","Mill creek entertainment","Mondo macabro","Mvd visual", "Olive films","Redemption","Scorpion releasing","Scream factory","Severin","Shameless","Shout factory", "Synapse films","Twilight time","Vestron video","Vinegar syndrome","Warner archive"]
const generos = ["Accion","Animacion","Aventura","Belica","Biografia","Ciencia ficcion","Comedia","Crimen","Deporte","Documental","Drama","Familiar","Fantasia","Film noir","Historia","Misterio","Musical","Pelicula de tv","Romance","Suspenso","Terror","Western"]
const idiomas = ["Ingles", "Latino", "Castellano", "Frances", "Aleman", "Italiano", "Portugues", "Japones", "Coreano", "Ruso", "Chino", "Arabe", "Indu", "Rumano", "Checo", "Bengali", "Turco", "Persa", "Hungaro", "Griego", "Tailandes", "Vietnamita", "Polaco", "Finlandes", "Sueco", "Noruego", "Danes", "Musica"]


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
    special_edittion: false, // <-- ¡CORREGIDO AQUÍ!
    is_premiere: false,
    poster_url: "",
    original_language: "",
    audio: "",
    subs: "",
        // --- ¡CORRECCIÓN AQUÍ! ---
        created_at: null, // O new Date().toISOString() si esperas un string de fecha
        // --- FIN CORRECCIÓN ---
  })

  const [localImage, setLocalImage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isMounted, setIsMounted] = useState(false);

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
        setLocalImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)

    try {
      // Paso 1: Insertar el film primero para obtener el ID generado por Supabase
      const dataToInsert = { ...form };
      delete dataToInsert.id;
      
      dataToInsert.poster_url = null; 

      // CONVERTIR genres_list a genres_string
      if (dataToInsert.genres_list && dataToInsert.genres_list.length > 0) {
        dataToInsert.genres_string = dataToInsert.genres_list.join(', ');
      } else {
        dataToInsert.genres_string = null; // O cadena vacía, según tu preferencia
      }

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

      let finalPosterUrl: string | null = null;

      // Paso 2: Si hay una imagen local, subirla usando el ID del film recién obtenido
      if (localImage) {
        const fileExtension = localImage.substring(localImage.indexOf('/') + 1, localImage.indexOf(';'));
        const format = fileExtension.split('/')[1];
        const fileName = `${Date.now()}.${format}`;
        const pathInStorage = `covers/${newFilm.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(pathInStorage, dataURLtoBlob(localImage), {
            cacheControl: "3600",
            upsert: true,
          })

        if (uploadError) {
          throw new Error(`Error al subir imagen a Storage: ${uploadError.message}`)
        }

        const { data: publicUrlData } = supabase.storage
          .from("media")
          .getPublicUrl(pathInStorage)
        
        finalPosterUrl = publicUrlData.publicUrl;
      }

      // Paso 3: Actualizar el film recién creado con la URL del póster (si se subió)
      if (finalPosterUrl) {
          const { error: updatePosterError } = await supabase
              .from("films")
              .update({ poster_url: finalPosterUrl })
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
            // --- CORRECCIÓN AQUÍ ---
            if (error instanceof Error) { // Verifica si 'error' es una instancia de la clase Error
              toast.error(`Error al crear: ${error.message}`);
            } else if (typeof error === 'string') { // Si es un string
              toast.error(`Error al crear: ${error}`);
            } else { // Para cualquier otro tipo desconocido de error
              toast.error("Error al crear: Ocurrió un error desconocido.");
            }
            // --- FIN CORRECCIÓN ---
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
                      <Button type="button" variant="outline" size="sm" disabled>
                        Buscar imagen API
                      </Button>
                    </span>
                    <div className="aspect-[3/4] w-[90%] h-[550px] border rounded-xl flex items-center justify-center bg-muted">
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