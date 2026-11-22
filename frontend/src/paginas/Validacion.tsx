import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/cliente'
import { EstadoCarga } from '../componentes/EstadoCarga'
import { Ayuda, EncabezadoPagina, GuiaPagina } from '../componentes/Ayuda'
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
      <EncabezadoPagina
        titulo="Validación"
        descripcion={<>Comprueba que el sistema mide bien comparándolo con una pinza amperimétrica<Ayuda termino="pinza" />.</>}
      />
      <GuiaPagina
        id="validacion"
        pasos={[
          'Elige la sesión que se está midiendo ahora.',
          'Con el aparato encendido, mide el mismo cable con la pinza amperimétrica.',
          <>Escribe el número que muestra la pinza y pulsa <strong>Registrar</strong>. Repite 3 a 5 veces.</>,
          'Si el error es de 5 % o menos, el sistema mide bien.',
        ]}
      />
      <EstadoCarga cargando={lista.isLoading} error={lista.error}>
        <div className="tarjeta grid gap-4 sm:grid-cols-3">
          <label className="etiqueta">
            Sesión
            <select className="campo" value={sesionId ?? ''} onChange={(e) => setSesionId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">Elige una sesión…</option>
              {lista.data?.content.map((s) => (
                <option key={s.id} value={s.id}>#{s.id} · {s.carga_declarada}</option>
              ))}
            </select>
          </label>
          <form onSubmit={enviar} className="flex items-end gap-2 sm:col-span-2">
            <label className="etiqueta flex-1">
              Valor que muestra la pinza (A)
              <input className="campo" type="number" min={0} step="any" required value={pinza} onChange={(e) => setPinza(e.target.value)} disabled={sesionId === null} />
            </label>
            <button disabled={sesionId === null || agregar.isPending} className="btn-primario">
              Registrar
            </button>
          </form>
          {agregar.error && <p role="alert" className="text-sm text-red-700 sm:col-span-3">{agregar.error.message}</p>}
          <p className="text-xs text-slate-500 sm:col-span-3">
            Se compara con la última lectura que envió el sistema antes de que pulsaras Registrar.
          </p>
        </div>
      </EstadoCarga>

      {sesionId !== null && (
        <EstadoCarga cargando={validacion.isLoading} error={validacion.error}>
          {v && (
            <>
              <div
                className={`rounded-2xl border p-5 ${v.filas.length === 0 ? 'border-slate-200 bg-white' : cumple ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50'}`}
              >
                <p className="text-lg font-semibold">
                  {v.filas.length === 0 ? '📏 Aún no hay comparaciones' : cumple ? '✅ El sistema mide bien' : '⚠️ El sistema se desvía más de lo esperado'}
                </p>
                <p className="mt-1 font-medium">
                  Error medio: {formatoPorcentaje(v.error_medio_porcentual)}
                  <Ayuda termino="error" />
                </p>
                <p className="text-sm">
                  Error medio absoluto: {formatoCorriente(v.error_medio_absoluto_a)} ·{' '}
                  {v.filas.length === 0 ? 'sin referencias aún' : cumple ? `cumple el objetivo (≤ ${OBJETIVO_PCT} %)` : `supera el objetivo (≤ ${OBJETIVO_PCT} %)`}
                </p>
              </div>
              <div className="tarjeta overflow-x-auto p-0">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Hora</th>
                      <th>Este sistema</th>
                      <th>Pinza</th>
                      <th>Diferencia</th>
                      <th>Error %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {v.filas.map((f) => (
                      <tr key={f.id}>
                        <td>{formatoHora(f.timestamp)}</td>
                        <td>{formatoCorriente(f.i_prototipo)}</td>
                        <td>{formatoCorriente(f.i_pinza)}</td>
                        <td>{formatoCorriente(f.diferencia_abs)}</td>
                        <td>{formatoPorcentaje(f.diferencia_pct)}</td>
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
