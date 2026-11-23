import { useCallback, useSyncExternalStore } from 'react'
import { useAuth } from '../auth/Auth'

/** Precio de la electricidad que pone cada persona, según su recibo de luz. */
export interface Tarifa {
  /** Precio de 1 kWh (lo que el recibo llama "precio unitario" o "cargo por energía"). */
  precioKwh: number
  /** Símbolo de la moneda, por ejemplo "S/". */
  moneda: string
}

export const MONEDA_POR_DEFECTO = 'S/'
export const DIAS_MES = 30

const PREFIJO = 'monitor-energia.tarifa.'
const EVENTO = 'monitor-energia:tarifa'

export function tarifaValida(t: Partial<Tarifa> | null | undefined): t is Tarifa {
  return !!t && typeof t.precioKwh === 'number' && Number.isFinite(t.precioKwh) && t.precioKwh > 0 && t.precioKwh < 100
}

function clave(usuarioId: number | undefined): string {
  return PREFIJO + (usuarioId ?? 'anonimo')
}

/** Lee la tarifa guardada en este navegador. Devuelve el texto crudo para que useSyncExternalStore compare sin cambiar de objeto. */
function leerCrudo(usuarioId: number | undefined): string | null {
  try {
    return localStorage.getItem(clave(usuarioId))
  } catch {
    return null
  }
}

export function leerTarifa(usuarioId: number | undefined): Tarifa | null {
  const crudo = leerCrudo(usuarioId)
  if (!crudo) return null
  try {
    const t = JSON.parse(crudo) as Partial<Tarifa>
    return tarifaValida(t) ? { precioKwh: t.precioKwh, moneda: t.moneda?.trim() || MONEDA_POR_DEFECTO } : null
  } catch {
    return null
  }
}

export function guardarTarifa(usuarioId: number | undefined, t: Tarifa | null): void {
  try {
    if (t) localStorage.setItem(clave(usuarioId), JSON.stringify(t))
    else localStorage.removeItem(clave(usuarioId))
  } catch {
    /* sin almacenamiento: no se puede recordar */
  }
  window.dispatchEvent(new Event(EVENTO))
}

function suscribir(aviso: () => void): () => void {
  window.addEventListener(EVENTO, aviso)
  window.addEventListener('storage', aviso)
  return () => {
    window.removeEventListener(EVENTO, aviso)
    window.removeEventListener('storage', aviso)
  }
}

/** Tarifa de la persona que inició sesión, compartida entre todas las pantallas. */
export function useTarifa(): { tarifa: Tarifa | null; guardar: (t: Tarifa | null) => void } {
  const id = useAuth().usuario?.id
  const crudo = useSyncExternalStore(suscribir, () => leerCrudo(id))
  const guardar = useCallback((t: Tarifa | null) => guardarTarifa(id, t), [id])
  return { tarifa: crudo ? leerTarifa(id) : null, guardar }
}

/** Costo de una cantidad de energía. */
export function costo(kwh: number, t: Tarifa): number {
  return kwh * t.precioKwh
}

/** Costo de usar un aparato de `w` vatios durante `horasDia` horas cada día, por un mes. */
export function costoMensual(w: number, horasDia: number, t: Tarifa): number {
  return (w / 1000) * horasDia * DIAS_MES * t.precioKwh
}

/** Dinero con 2 decimales; si es menos de un céntimo, con 4 para que no salga 0,00. */
export function formatoDinero(monto: number, t: Tarifa): string {
  const decimales = monto > 0 && monto < 0.01 ? 4 : 2
  return `${t.moneda} ${monto.toFixed(decimales)}`
}
