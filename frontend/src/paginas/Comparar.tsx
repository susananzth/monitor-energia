import { useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { api } from '../api/cliente'
import { EstadoCarga } from '../componentes/EstadoCarga'
import { GraficaIrms, colorSerie } from '../componentes/GraficaIrms'
import { aPuntos } from '../utilidades/series'
import { formatoCorriente, formatoEnergia, SUPUESTO } from '../utilidades/formato'

const MAX = 3

export function Comparar() {
  const [elegidas, setElegidas] = useState<number[]>([])
  const lista = useQuery({ queryKey: ['sesiones', 'lista'], queryFn: () => api.listarSesiones(0, 100) })
  const resumenes = useQueries({ queries: elegidas.map((id) => ({ queryKey: ['sesion', id], queryFn: () => api.sesion(id) })) })
  const series = useQueries({ queries: elegidas.map((id) => ({ queryKey: ['lecturas', id], queryFn: () => api.lecturas(id) })) })

  const alternar = (id: number) =>
    setElegidas((a) => (a.includes(id) ? a.filter((x) => x !== id) : a.length < MAX ? [...a, id] : a))

  return (
    <>
      <h2 className="text-xl font-bold">Comparar sesiones</h2>
      <EstadoCarga cargando={lista.isLoading} error={lista.error}>
        <fieldset className="rounded-lg border bg-white p-4">
          <legend className="px-1 text-sm text-slate-600">Elige de 2 a {MAX} sesiones</legend>
          <div className="grid gap-1 sm:grid-cols-2">
            {lista.data?.content.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={elegidas.includes(s.id)}
                  disabled={!elegidas.includes(s.id) && elegidas.length >= MAX}
                  onChange={() => alternar(s.id)}
                />
                #{s.id} · {s.carga_declarada}
              </label>
            ))}
          </div>
        </fieldset>
      </EstadoCarga>

      {elegidas.length >= 2 && (
        <>
          <section className="rounded-lg border bg-white p-4">
            <GraficaIrms
              series={elegidas.map((id, n) => ({
                nombre: `#${id} ${resumenes[n].data?.carga_declarada ?? ''}`,
                color: colorSerie(n),
                puntos: aPuntos(series[n].data ?? []),
              }))}
            />
          </section>
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2">Sesión</th>
                  <th className="p-2">Irms promedio (medido)</th>
                  <th className="p-2" title={SUPUESTO}>Energía (estimada)</th>
                </tr>
              </thead>
              <tbody>
                {resumenes.map((r, n) =>
                  r.data ? (
                    <tr key={r.data.id} className="border-t">
                      <td className="p-2" style={{ color: colorSerie(n) }}>#{r.data.id} {r.data.carga_declarada}</td>
                      <td className="p-2">{formatoCorriente(r.data.i_rms_promedio)}</td>
                      <td className="p-2">{formatoEnergia(r.data.energia_estimada_kwh)}</td>
                    </tr>
                  ) : null,
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}
