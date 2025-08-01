"use client"

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import {
  Card,
  CardHeader,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconPlus } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import Image from "next/image"

type Banner = {
  id: number
  img_url: string
}

export function BannerTabs() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loadingId, setLoadingId] = useState<number | null>(null)

  useEffect(() => {
    const fetchBanners = async () => {
      const { data, error } = await supabase
        .from("bannersInicio")
        .select("*")
        .order("id", { ascending: true })

      if (error) {
        console.error("Error al obtener banners:", error)
      } else {
        setBanners(data || [])
      }
    }

    fetchBanners()
  }, [])

  const handleBannerChange = async (banner: Banner) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      setLoadingId(banner.id)

      // Eliminar anterior si existe
      const oldPath = banner.img_url.split("/").pop()
      if (oldPath) {
        await supabase.storage.from("media").remove([`main/${oldPath}`])
      }

      // Subir nuevo
      const fileExt = file.name.split(".").pop()
      const newFileName = `banner-${banner.id}-${Date.now()}.${fileExt}`
      const fullPath = `main/${newFileName}`

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(fullPath, file, {
          upsert: true,
        })

      if (uploadError) {
        console.error("Error al subir nuevo banner:", uploadError)
        setLoadingId(null)
        return
      }

      // Obtener URL pública
      const { data: urlData } = supabase
        .storage
        .from("media")
        .getPublicUrl(fullPath)

      const newUrl = urlData.publicUrl

      // Actualizar tabla
      const { error: updateError } = await supabase
        .from("bannersInicio")
        .update({ img_url: newUrl })
        .eq("id", banner.id)

      if (updateError) {
        console.error("Error al actualizar el banner en DB:", updateError)
      } else {
        setBanners((prev) =>
          prev.map((b) =>
            b.id === banner.id ? { ...b, img_url: newUrl } : b
          )
        )
      }

      setLoadingId(null)
    }

    input.click()
  }

  return (
    <Tabs defaultValue={`banner1`} className="w-full space-y-6">
      <TabsList className="grid w-full grid-cols-6">
        {banners.map((banner) => (
          <TabsTrigger key={banner.id} value={`banner${banner.id}`}>
            {`Banner ${banner.id}`}
          </TabsTrigger>
        ))}
      </TabsList>

      {banners.map((banner) => (
        <TabsContent key={banner.id} value={`banner${banner.id}`}>
          <Card className="overflow-hidden">
            <CardHeader className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{`Banner ${banner.id}`}</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBannerChange(banner)}
                disabled={loadingId === banner.id}
              >
                <IconPlus className="mr-1" />
                {loadingId === banner.id ? "Actualizando..." : "Cambiar"}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Image
                src={banner.img_url}
                alt={`Banner ${banner.id}`}
                className="w-full object-contain h-[200px] md:h-[600px]"
                width={1920}
                height={1080}
              />
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  )
}
