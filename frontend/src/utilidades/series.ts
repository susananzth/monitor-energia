import type { Lectura } from '../api/tipos'

/** Convierte lecturas a puntos (segundos desde la primera lectura, Irms). */
export function aPuntos(lecturas: Lectura[]): { t: number; i: number }[] {
  if (lecturas.length === 0) return []
  const t0 = new Date(lecturas[0].timestamp).getTime()
  return lecturas.map((l) => ({ t: (new Date(l.timestamp).getTime() - t0) / 1000, i: l.i_rms }))
}
