// components/FilmIdCell.tsx
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconCopy } from "@tabler/icons-react"
import { toast } from "sonner"

export function FilmIdCell({ id }: { id: string }) {
  const [copied, setCopied] = useState<boolean>(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(id)
      setCopied(true)
      toast("ID copiado correctamente!")
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error("Error al copiar:", err)
    }
  }

  return (
    <div className="max-w-[120px] whitespace-normal break-words text-start">
      <Badge variant="outline" className="text-xs px-1.5 py-1 block w-full">
        {id}
      </Badge>
      <Button
        variant="ghost"
        size="sm"
        className="mt-1 h-6 w-full text-muted-foreground flex items-center gap-1 justify-center"
        onClick={handleCopy}
      >
        <IconCopy className="w-3 h-3" />
        {copied ? "Copiado" : "Copiar"}
      </Button>
    </div>
  )
}