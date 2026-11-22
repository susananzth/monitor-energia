import type { Sesion } from '../api/tipos'
import { duracionSesion } from './formato'

export type Nivel = 'bajo' | 'medio' | 'alto'

/** Nivel de consumo según la potencia estimada (W). */
export function nivelConsumo(w: number): Nivel {
  if (w < 300) return 'bajo'
  if (w < 1500) return 'medio'
  return 'alto'
}

export const TEXTO_NIVEL: Record<Nivel, { etiqueta: string; icono: string; clase: string; barra: string }> = {
  bajo: { etiqueta: 'Consumo bajo', icono: '●', clase: 'bg-green-100 text-green-900', barra: 'bg-green-600' },
  medio: { etiqueta: 'Consumo medio', icono: '▲', clase: 'bg-amber-100 text-amber-900', barra: 'bg-amber-500' },
  alto: { etiqueta: 'Consumo alto', icono: '■', clase: 'bg-red-100 text-red-900', barra: 'bg-red-600' },
}

/** Potencia máxima de la barra de nivel (W). */
export const ESCALA_MAX_W = 3000

const EQUIVALENCIAS: [number, string][] = [
  [5, 'casi nada: un equipo apagado o en espera'],
  [25, 'un foco LED o un cargador de celular'],
  [150, 'un foco incandescente de 100 W o una laptop'],
  [400, 'un televisor o una refrigeradora'],
  [1300, 'un microondas o una plancha'],
  [2200, 'un hervidor eléctrico o una secadora de pelo'],
]

/** Frase con un aparato de consumo parecido, para interpretar la potencia. */
export function equivalencia(w: number): string {
  for (const [hasta, texto] of EQUIVALENCIAS) if (w < hasta) return texto
  return 'una terma, una ducha eléctrica o varios equipos grandes a la vez'
}

/** Segundos que representa cada lectura (el firmware envía una cada 5 s). */
export const INTERVALO_LECTURA_S = 5

/** Tiempo medido: el mayor entre la duración de la sesión y lo que cubren sus lecturas. */
export function tiempoMedido(s: Sesion, ahora = Date.now()): number {
  return Math.max(duracionSesion(s.inicio, s.fin, ahora), s.n_lecturas * INTERVALO_LECTURA_S)
}

/** Potencia promedio estimada de una sesión (W). */
export function potenciaPromedio(s: Sesion): number {
  return s.i_rms_promedio * s.v_ref * s.factor_potencia_supuesto
}

export interface ResumenHistorico {
  sesiones: number
  segundosMedidos: number
  energiaKwh: number
  iMax: number
  lecturas: number
}

export function resumenHistorico(sesiones: Sesion[], ahora = Date.now()): ResumenHistorico {
  return sesiones.reduce<ResumenHistorico>(
    (r, s) => ({
      sesiones: r.sesiones + 1,
      segundosMedidos: r.segundosMedidos + tiempoMedido(s, ahora),
      energiaKwh: r.energiaKwh + s.energia_estimada_kwh,
      iMax: Math.max(r.iMax, s.i_rms_max),
      lecturas: r.lecturas + s.n_lecturas,
    }),
    { sesiones: 0, segundosMedidos: 0, energiaKwh: 0, iMax: 0, lecturas: 0 },
  )
}
