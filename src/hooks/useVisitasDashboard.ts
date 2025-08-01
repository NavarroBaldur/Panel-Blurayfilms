// src/hooks/useVisitasDashboard.ts
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

// --- Interfaces para los datos del dashboard (basadas en tu RPC) ---

// Define la interfaz para la estructura de los datos de resumen de visitas
interface VisitasResumen {
  visitas_activas: number;
  visitas_diarias: number;
  visitas_7_dias: number; // Nueva propiedad detectada
  visitas_mes: number;
  visitas_3_meses: number; // Nueva propiedad detectada
  visitas_totales: number;
}

// Define la interfaz para la estructura de los elementos del array 'diario'
interface VisitasDiarioItem {
  date: string;    // 'date' es de tipo date, que en JSON se serializa a string
  mobile: number;  // Conteo de visitas mobile
  desktop: number; // Conteo de visitas desktop
}

// --- El resto de tu hook useVisitasDashboard (sin cambios adicionales, solo las interfaces) ---

export function useVisitasDashboard() {
  const [resumen, setResumen] = useState<VisitasResumen | null>(null);
  const [diario, setDiario] = useState<VisitasDiarioItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Carga inicial
  useEffect(() => {
    const fetchVisitas = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_visitas_dashboard");
      if (error) {
        console.error("Error al obtener dashboard:", error);
        setResumen(null);
        setDiario([]);
      } else {
        // Asegúrate de que el casteo sea seguro
        setResumen(data?.resumen as VisitasResumen ?? null);
        setDiario(Array.isArray(data?.diario) ? data.diario as VisitasDiarioItem[] : []);
      }
      setLoading(false);
    };

    fetchVisitas();
  }, []);

  // Intervalo solo para visitas activas
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data, error } = await supabase.rpc("get_visitas_dashboard");
      if (!error && data?.resumen) {
        setResumen((prev) => {
          if (prev) {
            return {
              ...prev,
              visitas_activas: data.resumen.visitas_activas,
            };
          }
          return data.resumen as VisitasResumen;
        });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return { resumen, diario, loading };
}