export const SUPUESTO = 'Estimado con V_ref = 220 V y factor de potencia = 1 (supuestos).'

export function formatoCorriente(a: number): string {
  return `${a.toFixed(3)} A`
}

export function formatoPotencia(w: number): string {
  return w >= 1000 ? `${(w / 1000).toFixed(2)} kW` : `${w.toFixed(1)} W`
}

export function formatoEnergia(kwh: number): string {
  return kwh < 0.01 ? `${(kwh * 1000).toFixed(2)} Wh` : `${kwh.toFixed(3)} kWh`
}

export function formatoPorcentaje(p: number): string {
  return `${p.toFixed(1)} %`
}

export function formatoDuracion(segundos: number): string {
  const s = Math.max(0, Math.round(segundos))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  if (h > 0) return `${h} h ${m} min`
  if (m > 0) return `${m} min ${r} s`
  return `${r} s`
}

export function formatoFecha(iso: string): string {
  return new Date(iso).toLocaleString('es', { dateStyle: 'short', timeStyle: 'medium' })
}

export function formatoHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es', { hour12: false })
}

export function duracionSesion(inicio: string, fin: string | null, ahora = Date.now()): number {
  const t1 = fin ? new Date(fin).getTime() : ahora
  return (t1 - new Date(inicio).getTime()) / 1000
}

/** Segundos sin datos desde la última lectura. */
export function segundosSinDatos(ultimoIso: string | undefined, ahora = Date.now()): number | null {
  if (!ultimoIso) return null
  return Math.max(0, Math.round((ahora - new Date(ultimoIso).getTime()) / 1000))
}
