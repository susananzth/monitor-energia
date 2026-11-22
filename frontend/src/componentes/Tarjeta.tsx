import type { ReactNode } from 'react'
import { SUPUESTO } from '../utilidades/formato'
import type { Termino } from '../utilidades/glosario'
import { Ayuda } from './Ayuda'

export type Tono = 'corriente' | 'potencia' | 'energia' | 'tiempo' | 'neutro'

/** Color e ícono por tipo de dato, iguales en toda la plataforma. */
export const TONOS: Record<Tono, { icono: string; burbuja: string }> = {
  corriente: { icono: '🔌', burbuja: 'bg-cyan-100 text-cyan-700' },
  potencia: { icono: '⚡', burbuja: 'bg-amber-100 text-amber-700' },
  energia: { icono: '🔋', burbuja: 'bg-emerald-100 text-emerald-700' },
  tiempo: { icono: '⏱️', burbuja: 'bg-violet-100 text-violet-700' },
  neutro: { icono: '📊', burbuja: 'bg-slate-100 text-slate-600' },
}

interface Props {
  titulo: string
  valor: string
  /** 'medido' viene del sensor; 'estimado' se calcula con supuestos. */
  tipo: 'medido' | 'estimado'
  grande?: boolean
  detalle?: ReactNode
  tono?: Tono
  ayuda?: Termino
}

export function Tarjeta({ titulo, valor, tipo, grande, detalle, tono = 'neutro', ayuda }: Props) {
  const estimado = tipo === 'estimado'
  const t = TONOS[tono]
  return (
    <div className="tarjeta">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span aria-hidden className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-base ${t.burbuja}`}>
            {t.icono}
          </span>
          <h3 className="text-sm font-medium text-slate-600">
            {titulo}
            {ayuda && <Ayuda termino={ayuda} />}
          </h3>
        </div>
        <span
          title={estimado ? SUPUESTO : 'Valor medido directamente por el sensor.'}
          className={`cursor-help rounded-full px-2 py-0.5 text-xs font-semibold ${
            estimado ? 'bg-amber-100 text-amber-900' : 'bg-cyan-50 text-cyan-800'
          }`}
        >
          {estimado ? 'estimado' : 'medido'}
        </span>
      </div>
      <p className={`mt-3 font-bold tracking-tight text-slate-900 ${grande ? 'text-5xl' : 'text-2xl'}`}>{valor}</p>
      {detalle && <div className="mt-1 text-xs text-slate-500">{detalle}</div>}
    </div>
  )
}
