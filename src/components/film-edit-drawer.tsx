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

interface FilmEditDrawerProps {
  film: Film | null // Ahora puede ser null si no hay película seleccionada
  isOpen: boolean
  onClose: () => void
  onSaveSuccess: () => void
}

const tiposFilm = ["Pelicula", "Serie", "Animacion", "Anime", "Musical", "Documental", "Audio"]
const compañias = ["88 films", "Arrow video", "Bfi", "Blue underground", "Code red", "Criterion collection", "Cualdron", "Eureka", "Imprint", "Indicator", "Kino lorber", "Mill creek entertainment", "Mondo macabro", "Mvd visual", "Olive films", "Redemption", "Scorpion releasing", "Scream factory", "Severin", "Shameless", "Shout factory", "Synapse films", "Twilight time", "Vestron video", "Vinegar syndrome", "Warner archive"]
const generos = ["Accion", "Animacion", "Aventura", "Belica", "Biografia", "Ciencia ficcion", "Comedia", "Crimen", "Deporte", "Documental", "Drama", "Familiar", "Fantasia", "Film noir", "Historia", "Misterio", "Musical", "Pelicula de tv", "Romance", "Suspenso", "Terror", "Western"]
const idiomas = ["Ingles", "Latino", "Castellano", "Frances", "Aleman", "Italiano", "Portugues", "Japones", "Coreano", "Ruso", "Chino", "Arabe", "Indu", "Rumano", "Checo", "Bengali", "Turco", "Persa", "Hungaro", "Griego", "Tailandes", "Vietnamita", "Polaco", "Finlandes", "Sueco", "Noruego", "Danes", "Musica"]

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
      }
      reader.readAsDataURL(file)
    } else {
      setLocalImage(null); // Si el usuario cancela la selección, limpiamos la imagen local
    }
  }

  // Función para eliminar la imagen de la vista previa y del formulario
  const handleRemoveImage = () => {
    setLocalImage(null); // Elimina la vista previa local
    setForm(prev => ({ ...prev, poster_url: undefined })); // Establece la URL del póster a undefined
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Limpia el input de archivo
    }
  };

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

    try {
      let finalPosterUrl: string | null | undefined = form.poster_url;

      // Lógica para manejar la imagen
      if (localImage) { // Si hay una nueva imagen seleccionada localmente (data URL)
        // Paso 1: Eliminar la imagen anterior de Supabase Storage si existía y no es la misma que la nueva
        if (initialPosterUrl && initialPosterUrl !== finalPosterUrl) {
          try {
            // **CORRECCIÓN AQUÍ:** Usar variable de entorno directamente
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            if (!supabaseUrl) {
              throw new Error("NEXT_PUBLIC_SUPABASE_URL no está definida en tus variables de entorno.");
            }
            const supabaseProjectRef = supabaseUrl.split('//')[1]?.split('.')[0];
            
            if (!supabaseProjectRef) {
                throw new Error("No se pudo extraer la referencia del proyecto Supabase de NEXT_PUBLIC_SUPABASE_URL.");
            }

            const baseUrl = `https://${supabaseProjectRef}.supabase.co/storage/v1/object/public/media/`;

            if (initialPosterUrl.startsWith(baseUrl)) {
              const pathToDelete = initialPosterUrl.substring(baseUrl.length);
              console.log("Intentando eliminar la imagen anterior con la ruta:", pathToDelete);
              const { error: deleteError } = await supabase.storage
                .from("media")
                .remove([pathToDelete]);

              if (deleteError && deleteError.message !== "The resource was not found") {
                console.error(`Error al eliminar imagen antigua: ${deleteError.message}`);
                toast.warning(`Advertencia: No se pudo eliminar la imagen anterior: ${deleteError.message}`);
              } else if (!deleteError) {
                console.log("Imagen anterior eliminada exitosamente.");
              }
            } else {
              console.warn("La URL del póster anterior no parece ser de nuestro bucket Supabase. No se intentará eliminar.");
            }
          } catch (e: unknown) { // Manejo de error para el intento de eliminación
            console.error("Error inesperado al intentar eliminar la imagen anterior:", e instanceof Error ? e.message : e);
            toast.warning(`Advertencia al intentar eliminar imagen antigua: ${e instanceof Error ? e.message : 'Error desconocido'}`);
          }
        }

        // Paso 2: Subir la nueva imagen
        const file = fileInputRef.current?.files?.[0];
        let format = 'jpg'; // Valor por defecto

        if (file) {
          const mimeType = file.type;
          if (mimeType.includes('/')) {
            format = mimeType.split('/')[1];
          }
        }
        
        // Define una ruta más específica para evitar colisiones y organizar mejor
        // Si es una película existente, usa su ID; si es nueva, podrías usar un placeholder o generarla después de la inserción
        const uploadPath = form.id ? `covers/${form.id}/${Date.now()}.${format}` : `temp_covers/${Date.now()}.${format}`; // Usa form.id aquí

        console.log("Subiendo nueva imagen a la ruta:", uploadPath);
        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(uploadPath, dataURLtoBlob(localImage), {
            cacheControl: "3600",
            upsert: true, // Permite sobrescribir si el nombre de archivo es el mismo (aunque aquí usamos timestamp)
          })

        if (uploadError) {
          throw new Error(`Error al subir nueva imagen a Storage: ${uploadError.message}`)
        }

        const { data: publicUrlData } = supabase.storage
          .from("media")
          .getPublicUrl(uploadPath)
        
        finalPosterUrl = publicUrlData.publicUrl; // Actualiza la URL final del póster
      } else if (initialPosterUrl && form.poster_url === undefined) {
        // El usuario eliminó la imagen (no hay localImage y form.poster_url se estableció a undefined)
        await deleteExistingImageFromStorage(initialPosterUrl);
        finalPosterUrl = undefined; // Asegura que se guarde como NULL en la BD
      }
      // Si no hay localImage y form.poster_url no es undefined, significa que se mantuvo la imagen existente.


      // Preparar los datos del formulario para la actualización
      const updatedData: Partial<Film> = { ...form };

      // Lógica para genres_string: convierte la lista de géneros en una cadena separada por comas
      if (updatedData.genres_list && updatedData.genres_list.length > 0) {
        updatedData.genres_string = updatedData.genres_list.join(', ');
      } else {
        updatedData.genres_string = undefined; // Si no hay géneros, establecer a undefined (luego será null en DB)
      }

      // Asegurarse de que poster_url se actualice en updatedData con la URL final determinada
      updatedData.poster_url = finalPosterUrl;

      // Asegurarse de que los campos opcionales que son `undefined` en el formulario
      // se envíen como `null` a la base de datos de Supabase si tu esquema lo requiere.
      Object.keys(updatedData).forEach(key => {
        if (updatedData[key as keyof Partial<Film>] === undefined) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (updatedData as any)[key] = null; // <-- ¡ESTA ES LA LÍNEA CLAVE!
        }
      });

      let response;
      if (form.id) { // Usamos form.id para determinar si es una actualización o nueva creación
        // Actualizar película existente
        response = await supabase
          .from("films")
          .update(updatedData) // Envía los datos actualizados, incluyendo poster_url y genres_string
          .eq("id", form.id) // Usamos form.id aquí
          .select() // Importante para obtener los datos actualizados
      } else {
        // Crear nueva película
        // Si el ID se genera en la DB, no lo incluyas en la inserción
        const { ...dataWithoutId } = updatedData; // Excluye el ID si es autogenerado
        response = await supabase
          .from("films")
          .insert(dataWithoutId)
          .select()
      }

      if (response.error) {
        throw new Error(response.error.message)
      }

      toast.success(
        form.id // Usamos form.id aquí
          ? "¡Película actualizada exitosamente!"
          : "¡Película creada exitosamente!"
      )
      onSaveSuccess() // Llama a esto para refrescar la lista o datos en el componente padre
      onClose()
    } catch (error: unknown) {
      console.error("Error al guardar película:", error)
      // Asegurarse de que 'error.message' sea accesible de forma segura
      toast.error(`Error al guardar: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Helper para eliminar imagen de Supabase Storage (función extraída para reutilizar)
  const deleteExistingImageFromStorage = async (url: string) => {
    // **CORRECCIÓN AQUÍ:** Usar variable de entorno para obtener la referencia del proyecto
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
          <DrawerTitle>{form.id ? `Editar Película: ${form.title}` : "Añadir Nueva Película"}</DrawerTitle> {/* Usar form.id y form.title */}
          <DrawerDescription>
            {form.id ? `Realiza los cambios en ${form.title} y guarda.` : "Introduce los detalles de la nueva película."} {/* Usar form.id y form.title */}
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
              <Button type="button" variant="outline" size="sm" disabled>
                Buscar imagen API
              </Button>
              {localImage || form.poster_url ? (
                 <Button type="button" variant="destructive" size="sm" onClick={handleRemoveImage}>
                    Quitar imagen
                 </Button>
              ) : null}
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
                value={form.title}
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
                  onValueChange={(v) => setForm({ ...form, cult_brand: v || undefined })}
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
                  onValueChange={(v) => setForm({ ...form, original_language: v || undefined })}
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
                  onValueChange={(v) => setForm({ ...form, audio: v || undefined })}
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
                  onValueChange={(v) => setForm({ ...form, subs: v || undefined })}
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