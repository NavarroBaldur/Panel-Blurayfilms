// src/hooks/use-media-query.ts
"use client"

import { useState, useEffect } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Verificar si `window` está disponible (solo en el cliente)
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia(query)
      setMatches(mediaQuery.matches)

      const handler = (event: MediaQueryListEvent) => setMatches(event.matches)
      mediaQuery.addEventListener("change", handler)

      return () => mediaQuery.removeEventListener("change", handler)
    }
  }, [query])

  return matches
}