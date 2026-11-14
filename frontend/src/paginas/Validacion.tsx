import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/cliente'
import { EstadoCarga } from '../componentes/EstadoCarga'
import { formatoCorriente, formatoHora, formatoPorcentaje } from '../utilidades/formato'

const OBJETIVO_PCT = 5

export function Validacion() {
  const cliente = useQueryClient()
  const [sesionId, setSesionId] = useState<number | null>(null)
  const [pinza, setPinza] = useState('')
  const lista = useQuery({ queryKey: ['sesiones', 'lista'], queryFn: () => api.listarSesiones(0, 100) })
  const validacion = useQuery({
    queryKey: ['validacion', sesionId],
    queryFn: () => api.validacion(sesionId!),
    enabled: sesionId !== null,
  })
  const agregar = useMutation({
    mutationFn: () => api.agregarReferencia(sesionId!, Number(pinza)),
    onSuccess: () => {
      setPinza('')
      cliente.invalidateQueries({ queryKey: ['validacion', sesionId] })
    },
  })
  const enviar = (e: FormEvent) => {
    e.preventDefault()
    agregar.mutate()
  }
  const v = validacion.data
  const cumple = v ? v.error_medio_porcentual <= OBJETIVO_PCT : false

  return (
    <>
      <h2 className="text-xl font-bold">Validación con pinza amperimétrica</h2>
      <EstadoCarga cargando={lista.isLoading} error={lista.error}>
        <div className="grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-3">
          <label className="text-sm">
            Sesión
            <select className="mt-1 w-full rounded border px-2 py-1" value={sesionId ?? ''} onChange={(e) => setSesionId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">Elige una sesión…</option>
              {lista.data?.content.map((s) => (
                <option key={s.id} value={s.id}>#{s.id} · {s.carga_declarada}</option>
              ))}
            </select>
          </label>
          <form onSubmit={enviar} className="flex items-end gap-2 sm:col-span-2">
            <label className="flex-1 text-sm">
              Lectura de la pinza (A)
              <input className="mt-1 w-full rounded border px-2 py-1" type="number" min={0} step="any" required value={pinza} onChange={(e) => setPinza(e.target.value)} disabled={sesionId === null} />
            </label>
            <button disabled={sesionId === null || agregar.isPending} className="rounded bg-sky-600 px-4 py-2 text-white disabled:opacity-50">
              Registrar
            </button>
          </form>
          {agregar.error && <p role="alert" className="text-sm text-red-700 sm:col-span-3">{agregar.error.message}</p>}
          <p className="text-xs text-slate-500 sm:col-span-3">
            Se compara con la última lectura del prototipo anterior al momento del registro.
          </p>
        </div>
      </EstadoCarga>

      {sesionId !== null && (
        <EstadoCarga cargando={validacion.isLoading} error={validacion.error}>
          {v && (
            <>
              <div
                className={`rounded-lg border p-4 ${cumple ? 'border-green-400 bg-green-50' : 'border-amber-400 bg-amber-50'}`}
              >
                <p className="font-semibold">Error medio porcentual: {formatoPorcentaje(v.error_medio_porcentual)}</p>
                <p className="text-sm">
                  Error medio absoluto: {formatoCorriente(v.error_medio_absoluto_a)} ·{' '}
                  {v.filas.length === 0 ? 'sin referencias aún' : cumple ? `cumple el objetivo (≤ ${OBJETIVO_PCT} %)` : `supera el objetivo (≤ ${OBJETIVO_PCT} %)`}
                </p>
              </div>
              <div className="overflow-x-auto rounded-lg border bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-2">Hora</th>
                      <th className="p-2">Prototipo</th>
                      <th className="p-2">Pinza</th>
                      <th className="p-2">Diferencia</th>
                      <th className="p-2">Error %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {v.filas.map((f) => (
                      <tr key={f.id} className="border-t">
                        <td className="p-2">{formatoHora(f.timestamp)}</td>
                        <td className="p-2">{formatoCorriente(f.i_prototipo)}</td>
                        <td className="p-2">{formatoCorriente(f.i_pinza)}</td>
                        <td className="p-2">{formatoCorriente(f.diferencia_abs)}</td>
                        <td className="p-2">{formatoPorcentaje(f.diferencia_pct)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </EstadoCarga>
      )}
    </>
  )
}
