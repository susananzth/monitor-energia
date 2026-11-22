import { useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { api } from '../api/cliente'
import { EstadoCarga } from '../componentes/EstadoCarga'
import { Ayuda, EncabezadoPagina } from '../componentes/Ayuda'
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
      <EncabezadoPagina
        titulo="Comparar"
        descripcion="Pon hasta 3 mediciones en la misma gráfica para ver cuál consume más."
      />
      <EstadoCarga cargando={lista.isLoading} error={lista.error}>
        <fieldset className="tarjeta">
          <legend className="sr-only">Sesiones a comparar</legend>
          <p className="mb-3 text-sm font-medium text-slate-700">Marca de 2 a {MAX} sesiones</p>
          <div className="grid gap-1 sm:grid-cols-2">
            {lista.data?.content.map((s) => (
              <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-marca-50">
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
          <section className="tarjeta">
            <p className="mb-3 text-sm text-slate-500">Cada color es una sesión. La línea más alta es la que consume más corriente.</p>
            <GraficaIrms
              series={elegidas.map((id, n) => ({
                nombre: `#${id} ${resumenes[n].data?.carga_declarada ?? ''}`,
                color: colorSerie(n),
                puntos: aPuntos(series[n].data ?? []),
              }))}
            />
          </section>
          <div className="tarjeta overflow-x-auto p-0">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Sesión</th>
                  <th>Corriente promedio <Ayuda termino="irms" /></th>
                  <th title={SUPUESTO}>Energía <Ayuda termino="estimado" /></th>
                </tr>
              </thead>
              <tbody>
                {resumenes.map((r, n) =>
                  r.data ? (
                    <tr key={r.data.id}>
                      <td>
                        <span aria-hidden className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: colorSerie(n) }} />
                        #{r.data.id} {r.data.carga_declarada}
                      </td>
                      <td>{formatoCorriente(r.data.i_rms_promedio)}</td>
                      <td>{formatoEnergia(r.data.energia_estimada_kwh)}</td>
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
