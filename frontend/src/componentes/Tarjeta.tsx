import type { ReactNode } from 'react'
import { SUPUESTO } from '../utilidades/formato'

interface Props {
  titulo: string
  valor: string
  /** 'medido' viene del sensor; 'estimado' se calcula con supuestos. */
  tipo: 'medido' | 'estimado'
  grande?: boolean
  detalle?: ReactNode
}

export function Tarjeta({ titulo, valor, tipo, grande, detalle }: Props) {
  const estimado = tipo === 'estimado'
  return (
    <div
      className={`rounded-lg border p-4 shadow-sm ${
        estimado ? 'border-dashed border-amber-400 bg-amber-50' : 'border-sky-300 bg-white'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-slate-600">{titulo}</h3>
        <span
          title={estimado ? SUPUESTO : 'Valor medido directamente por el sensor.'}
          className={`cursor-help rounded px-2 py-0.5 text-xs font-semibold ${
            estimado ? 'bg-amber-200 text-amber-900' : 'bg-sky-100 text-sky-900'
          }`}
        >
          {estimado ? 'estimado' : 'medido'}
        </span>
      </div>
      <p className={`mt-2 font-bold ${grande ? 'text-5xl' : 'text-2xl'}`}>{valor}</p>
      {detalle && <div className="mt-1 text-xs text-slate-500">{detalle}</div>}
    </div>
  )
}
