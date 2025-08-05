"use client" // ¡Asegúrate de que esta línea sea la primera!

import { useState, useRef, useEffect } from "react"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog2, DialogContent2, DialogTrigger2, DialogHeader2, DialogTitle2, DialogDescription2 } from "@/components/ui/dialog2" // Importa los componentes de Dialog
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X } from "lucide-react"
import { GenreMultiSelect } from "@/components/genre-multi-select"
import { MultiSelectType } from "@/components/multi-select-type"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Film } from "@/types" // Asegúrate de que este tipo sea accesible
import { supabase } from "@/lib/supabaseClient" // Asegúrate de que tu cliente Supabase sea accesible
import { toast } from "sonner"
import Image from "next/image"

import { MovieSearch } from "@/components/MovieSearch"; // Importa tu componente de búsqueda de películas

interface FilmEditDrawerProps {
  film: Film | null // Ahora puede ser null si no hay película seleccionada
  isOpen: boolean
  onClose: () => void
  onSaveSuccess: () => void
}

const tiposFilm = ["Pelicula", "Serie", "Animacion", "Anime", "Musical", "Documental", "Audio"]
const compañias = ["Ninguna", "88 films", "Arrow video", "Bfi", "Blue underground", "Code red", "Criterion collection", "Cualdron", "Eureka", "Imprint", "Indicator", "Kino lorber", "Mill creek entertainment", "Mondo macabro", "Mvd visual", "Olive films", "Redemption", "Scorpion releasing", "Scream factory", "Severin", "Shameless", "Shout factory", "Synapse films", "Twilight time", "Vestron video", "Vinegar syndrome", "Warner archive"]
const generos = ["Accion", "Animacion", "Aventura", "Belica", "Biografia", "Ciencia ficcion", "Comedia", "Crimen", "Deporte", "Documental", "Drama", "Familiar", "Fantasia", "Film noir", "Historia", "Misterio", "Musical", "Pelicula de tv", "Romance", "Suspenso", "Terror", "Western"]
const idiomas = ["Ninguno", "Ingles", "Latino", "Castellano", "Frances", "Aleman", "Italiano", "Portugues", "Japones", "Coreano", "Ruso", "Chino", "Arabe", "Indu", "Rumano", "Checo", "Bengali", "Turco", "Persa", "Hungaro", "Griego", "Tailandes", "Vietnamita", "Polaco", "Finlandes", "Sueco", "Noruego", "Danes", "Musica"]

export function FilmEditDrawer({
  film,
  isOpen,
  onClose,
  onSaveSuccess,
}: FilmEditDrawerProps) {
  // Inicializa el formulario con un objeto vacío o valores por defecto si film es null
  const [form, setForm] = useState<Film | Partial<Film>>(film || {
    id: "",
    title: "",
    year_film: null,
    film_type: [],
    cult_film: false,
    cult_brand: null,
    genres_list: [],
    genres_string: null,
    q_disks: null,
    special_edittion: false,
    is_premiere: false,
    poster_url: null,
    original_language: null,
    audio: null,
    subs: null,
  })
  const [localImage, setLocalImage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Estado para la URL de la imagen inicial para manejar eliminaciones o reemplazos
  const [initialPosterUrl, setInitialPosterUrl] = useState<string | null>(null)
  // Estado para controlar la visibilidad del modal de búsqueda de películas
  const [isMovieSearchOpen, setIsMovieSearchOpen] = useState(false);


  useEffect(() => {
    // Si la película (film) cambia y no es null, actualiza el formulario
    if (film) {
      setForm(film)
      setLocalImage(null) // Resetea la imagen local al cambiar de película
      setInitialPosterUrl(film.poster_url || null) // Guarda la URL original
    } else {
      // Si film es null (abriendo para crear una nueva película), resetea el formulario
      setForm({
        id: "",
        title: "",
        year_film: null,
        film_type: [],
        cult_film: false,
        cult_brand: null,
        genres_list: [],
        genres_string: null,
        q_disks: null,
        special_edittion: false,
        is_premiere: false,
        poster_url: null,
        original_language: null,
        audio: null,
        subs: null,
      });
      setLocalImage(null);
      setInitialPosterUrl(null);
    }
  }, [film])

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLocalImage(reader.result as string)
        setForm(prevForm => ({ ...prevForm, poster_url: null })); // Limpia poster_url si se selecciona una imagen local
      }
      reader.readAsDataURL(file)
    } else {
      setLocalImage(null); // Si el usuario cancela la selección, limpiamos la imagen local
    }
  }

  // Nueva función para manejar la selección de una película desde MovieSearch
  const handleMovieSelected = (imageUrl: string) => {
    setForm(prevForm => ({ ...prevForm, poster_url: imageUrl })); // Establece la URL de TMDB en el formulario
    setLocalImage(null); // Limpia cualquier imagen local previamente seleccionada
    setIsMovieSearchOpen(false); // Cierra el modal de búsqueda de películas
  };

  // Función para eliminar la imagen de la vista previa y del formulario
  // const handleRemoveImage = async () => {
    // setLocalImage(null); // Elimina la vista previa local
    // setForm(prev => ({ ...prev, poster_url: null })); // Establece la URL del póster a null
    // if (fileInputRef.current) {
    //   fileInputRef.current.value = ""; // Limpia el input de archivo
    // }
    // // Si la imagen actual era de Supabase, intenta eliminarla
    // if (initialPosterUrl) {
    //   await deleteExistingImageFromStorage(initialPosterUrl);
    // }
  // };

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

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)

    let finalPosterUrlToSave: string | null = null; // Esta será la URL final que se guardará en Supabase

    try {
      // Escenario 1: Imagen local seleccionada (prioridad más alta)
      if (localImage) {
        // Si había una imagen antigua de Supabase, elimínala primero
        if (initialPosterUrl) {
          await deleteExistingImageFromStorage(initialPosterUrl);
        }

        const fileExtension = localImage.substring(localImage.indexOf('/') + 1, localImage.indexOf(';'));
        const format = fileExtension.split('/')[1];
        const fileName = `${Date.now()}.${format}`;
        
        // Usa film.id si estás editando, de lo contrario, esto es un caso que no debería ocurrir en el drawer
        // ya que el drawer es para editar films existentes. Si se usa para crear, la lógica sería diferente.
        const uploadPath = form.id ? `covers/${form.id}/${fileName}` : `temp_covers/${Date.now()}.${format}`; 

        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(uploadPath, dataURLtoBlob(localImage), {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Error al subir nueva imagen a Storage: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from("media")
          .getPublicUrl(uploadPath);
        
        finalPosterUrlToSave = publicUrlData.publicUrl;
      } 
      // Escenario 2: Imagen de TMDB seleccionada (localImage es null, form.poster_url tiene un valor)
      else if (form.poster_url) {
        // Si la imagen antigua era de Supabase y es diferente de la nueva URL de TMDB, elimínala
        if (initialPosterUrl && initialPosterUrl !== form.poster_url) {
             await deleteExistingImageFromStorage(initialPosterUrl);
        }
        finalPosterUrlToSave = form.poster_url ?? null;
      } 
      // Escenario 3: Imagen eliminada (localImage es null, form.poster_url es null)
      else if (initialPosterUrl && form.poster_url === null) { 
        await deleteExistingImageFromStorage(initialPosterUrl);
        finalPosterUrlToSave = null; // Establece explícitamente a null para la BD
      } else {
        // Escenario 4: No se seleccionó ninguna imagen nueva, o la imagen existente no cambió.
        // finalPosterUrlToSave ya contendrá el valor de form.poster_url (que puede ser null o la URL original)
        finalPosterUrlToSave = form.poster_url ?? null;
      }

      // Preparar los datos del formulario para la actualización
      const updatedData: Partial<Film> = { ...form };
      
      // Asegurarse de que poster_url en updatedData refleje la URL final determinada
      updatedData.poster_url = finalPosterUrlToSave;

      // Convertir genres_list a genres_string
      if (updatedData.genres_list && updatedData.genres_list.length > 0) {
        updatedData.genres_string = updatedData.genres_list.join(', ');
      } else {
        updatedData.genres_string = null; // Establecer a null para la BD
      }

      // Asegurarse de que los campos opcionales que son `undefined` en el formulario
      // se envíen como `null` a la base de datos de Supabase si tu esquema lo requiere.
      Object.keys(updatedData).forEach(key => {
        if (updatedData[key as keyof Partial<Film>] === undefined) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (updatedData as any)[key] = null;
        }
      });

      let response;
      if (form.id) { // Editando film existente
        response = await supabase
          .from("films")
          .update(updatedData)
          .eq("id", form.id)
          .select()
      } else {
        // Este bloque no debería ser alcanzado si el drawer solo se usa para editar films existentes.
        // Si se usa para crear, esta lógica debería estar en NewFilmPage.
        throw new Error("El Drawer de edición no está configurado para crear nuevas películas sin ID.");
      }

      if (response.error) {
        throw new Error(response.error.message)
      }

      toast.success("¡Película actualizada exitosamente!")
      onSaveSuccess() // Llama a esto para refrescar la lista o datos en el componente padre
      onClose()
    } catch (error: unknown) {
      console.error("Error al guardar película:", error)
      toast.error(`Error al guardar: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Helper para eliminar imagen de Supabase Storage (función extraída para reutilizar)
  const deleteExistingImageFromStorage = async (url: string) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
        console.warn("NEXT_PUBLIC_SUPABASE_URL no está definida, no se puede eliminar imagen del storage.");
        return;
    }
    const supabaseProjectRef = supabaseUrl.split('//')[1]?.split('.')[0];
    if (!supabaseProjectRef) {
      console.warn("Referencia de proyecto Supabase no encontrada en NEXT_PUBLIC_SUPABASE_URL, no se puede eliminar imagen del storage.");
      return;
    }
    const baseUrl = `https://${supabaseProjectRef}.supabase.co/storage/v1/object/public/media/`;

    if (url.startsWith(baseUrl)) {
      const pathToDelete = url.substring(baseUrl.length);
      const { error: deleteError } = await supabase.storage
        .from('media')
        .remove([pathToDelete]);

      if (deleteError && deleteError.message !== "The resource was not found") {
        console.error("Error al eliminar imagen de Supabase Storage:", deleteError.message);
        toast.warning(`Advertencia al eliminar imagen: ${deleteError.message}`);
      } else if (!deleteError) {
        console.log("Imagen de Storage eliminada exitosamente.");
      }
    }
  };


  return (
    <Drawer direction={isMobile ? "bottom" : "right"} open={isOpen} onClose={onClose}>
      <DrawerContent className="bg-background border-t h-[90vh] md:w-[60vw] md:max-w-[80%] md:border-l md:border-r md:h-full flex flex-col">
        <DrawerHeader>
          <DrawerTitle>{form.id ? `Editar Película: ${form.title}` : "Añadir Nueva Película"}</DrawerTitle>
          <DrawerDescription>
            {form.id ? `Realiza los cambios en ${form.title} y guarda.` : "Introduce los detalles de la nueva película."}
          </DrawerDescription>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="absolute right-4 top-4">
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </Button>
          </DrawerClose>
        </DrawerHeader>

        {/* Contenido del formulario */}
        <div className="grid w-full grid-cols-1 md:grid-cols-2 gap-4 px-8 overflow-y-auto flex-1 pb-20">
          <div className="flex flex-col gap-4">
            <span className="flex gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={handleFileSelect}>
                Cambiar imagen
              </Button>
              {/* Botón para abrir el modal de búsqueda de películas */}
              <Dialog2 open={isMovieSearchOpen} onOpenChange={setIsMovieSearchOpen}>
                <DialogTrigger2 asChild>
                  <Button type="button" variant="outline" size="sm">
                    Buscar imagen API
                  </Button>
                </DialogTrigger2>
                {/* DialogContent para el modal de búsqueda de películas (full-screen) */}
                <DialogContent2 fullScreen={true} className="flex flex-col p-0">
                  <DialogHeader2 className="p-6 pb-4">
                    <DialogTitle2>Buscar Póster de Película en TMDB</DialogTitle2>
                    <DialogDescription2>
                      Busca una película y selecciona su póster para usarlo.
                    </DialogDescription2>
                  </DialogHeader2>
                  <div className="flex-1 overflow-y-auto">
                    <MovieSearch onMovieSelected={handleMovieSelected} />
                  </div>
                </DialogContent2>
              </Dialog2>
              {/* Botón Quitar imagen (descomentado y funcional) 
              {localImage || form.poster_url ? (
                <Button type="button" variant="destructive" size="sm" onClick={handleRemoveImage}>
                    Quitar imagen
                </Button>
              ) : null}
               */}
            </span>
            <div className="aspect-[3/4] w-[90%] h-[550px] border rounded-xl flex items-center justify-center bg-muted">
              {localImage ? (
                <Image src={localImage} alt="Vista previa" className="object-cover h-full border rounded-xl" width={1920} height={1080} />
              ) : form.poster_url ? (
                <Image src={form.poster_url} alt="Poster" className="object-cover h-full border rounded-xl" width={1920} height={1080} />
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
                placeholder="Título"
                value={form.title || ""} // Asegúrate de que no sea null
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Año</label>
              <Input
                type="text"
                placeholder="Año"
                value={form.year_film || ""}
                onChange={(e) => setForm({ ...form, year_film: e.target.value })}
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium">Tipo de film</label>
              <MultiSelectType
                value={form.film_type || []}
                onChange={(v) => setForm({ ...form, film_type: v })}
                options={tiposFilm}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Géneros</label>
              <GenreMultiSelect
                value={form.genres_list || []}
                onChange={(v) => setForm({ ...form, genres_list: v })}
                options={generos}
              />
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
                  onValueChange={(v) => setForm({ ...form, cult_brand: v || null })} // Cambiado a null
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
                  onValueChange={(v) => setForm({ ...form, original_language: v || null })} // Cambiado a null
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
                  onValueChange={(v) => setForm({ ...form, audio: v || null })} // Cambiado a null
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
                  onValueChange={(v) => setForm({ ...form, subs: v || null })} // Cambiado a null
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
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-1 text-sm">
                  <Checkbox
                    checked={form.special_edittion}
                    onCheckedChange={(v) =>
                      setForm({ ...form, special_edittion: !!v })
                    }
                  />
                  Edición Especial
                </label>
              </div>
            </div>
            <DrawerFooter className="border-t px-4 py-3 flex justify-between mt-auto">
              <span className="flex gap-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Guardando..." : "Guardar cambios"}
                </Button>
              </span>
            </DrawerFooter>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}