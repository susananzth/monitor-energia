import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../api/cliente'
import { EstadoCarga } from '../componentes/EstadoCarga'
import { duracionSesion, formatoDuracion, formatoEnergia, formatoFecha, formatoPorcentaje, SUPUESTO } from '../utilidades/formato'

function FormularioSesion({ alCrear }: { alCrear: () => void }) {
  const [dispositivo, setDispositivo] = useState('1')
  const [carga, setCarga] = useState('')
  const [vRef, setVRef] = useState('220')
  const crear = useMutation({
    mutationFn: () =>
      api.crearSesion({ dispositivo_id: Number(dispositivo), carga_declarada: carga.trim(), v_ref: Number(vRef) }),
    onSuccess: alCrear,
  })
  const enviar = (e: FormEvent) => {
    e.preventDefault()
    crear.mutate()
  }
  const campo = 'mt-1 w-full rounded border px-2 py-1'
  return (
    <form onSubmit={enviar} className="grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-4">
      <label className="text-sm sm:col-span-2">
        Carga declarada
        <input className={campo} value={carga} onChange={(e) => setCarga(e.target.value)} required maxLength={200} placeholder="Foco 100 W" />
      </label>
      <label className="text-sm">
        Dispositivo (id)
        <input className={campo} type="number" min={1} value={dispositivo} onChange={(e) => setDispositivo(e.target.value)} required />
      </label>
      <label className="text-sm">
        V_ref (V)
        <input className={campo} type="number" min={1} step="any" value={vRef} onChange={(e) => setVRef(e.target.value)} required />
      </label>
      <div className="sm:col-span-4 flex flex-wrap items-center gap-3">
        <button disabled={crear.isPending} className="rounded bg-sky-600 px-4 py-2 text-white disabled:opacity-50">
          Iniciar sesión
        </button>
        {crear.error && <span role="alert" className="text-sm text-red-700">{crear.error.message}</span>}
      </div>
    </form>
  )
}

export function Sesiones() {
  const cliente = useQueryClient()
  const [mostrarForm, setMostrarForm] = useState(false)
  const lista = useQuery({ queryKey: ['sesiones', 'lista'], queryFn: () => api.listarSesiones(0, 100) })
  const finalizar = useMutation({
    mutationFn: (id: number) => api.finalizar(id),
    onSuccess: () => cliente.invalidateQueries({ queryKey: ['sesiones'] }),
  })

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Sesiones</h2>
        <button onClick={() => setMostrarForm((v) => !v)} className="rounded bg-sky-600 px-4 py-2 text-white">
          {mostrarForm ? 'Cancelar' : 'Nueva sesión'}
        </button>
      </div>
      {mostrarForm && (
        <FormularioSesion
          alCrear={() => {
            setMostrarForm(false)
            cliente.invalidateQueries({ queryKey: ['sesiones'] })
          }}
        />
      )}
      <EstadoCarga cargando={lista.isLoading} error={lista.error ?? finalizar.error}>
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2">Inicio</th>
                <th className="p-2">Carga</th>
                <th className="p-2">Duración</th>
                <th className="p-2" title={SUPUESTO}>Energía <em>(estimada)</em></th>
                <th className="p-2">Pérdida</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {lista.data?.content.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-2">{formatoFecha(s.inicio)}</td>
                  <td className="p-2">
                    <Link className="text-sky-700 underline" to={`/sesiones/${s.id}`}>{s.carga_declarada}</Link>
                    {s.activa && <span className="ml-2 rounded bg-green-100 px-2 text-xs text-green-800">activa</span>}
                  </td>
                  <td className="p-2">{formatoDuracion(duracionSesion(s.inicio, s.fin))}</td>
                  <td className="p-2">{formatoEnergia(s.energia_estimada_kwh)}</td>
                  <td className="p-2">{formatoPorcentaje(s.porcentaje_perdida)}</td>
                  <td className="p-2">
                    {s.activa && (
                      <button onClick={() => finalizar.mutate(s.id)} className="rounded border px-2 py-0.5 hover:bg-slate-100">
                        Finalizar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {lista.data?.content.length === 0 && (
                <tr><td colSpan={6} className="p-4 text-center text-slate-500">Todavía no hay sesiones.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </EstadoCarga>
    </>
  )
}
