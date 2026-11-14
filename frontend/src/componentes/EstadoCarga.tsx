import type { ReactNode } from 'react'

interface Props {
  cargando: boolean
  error: Error | null
  children: ReactNode
}

export function EstadoCarga({ cargando, error, children }: Props) {
  if (cargando) return <p className="text-slate-500">Cargando…</p>
  if (error)
    return (
      <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-red-800">
        {error.message}
      </p>
    )
  return <>{children}</>
}
