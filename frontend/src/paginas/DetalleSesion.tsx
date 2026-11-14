import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/cliente'
import { EstadoCarga } from '../componentes/EstadoCarga'
import { GraficaIrms, colorSerie } from '../componentes/GraficaIrms'
import { Tarjeta } from '../componentes/Tarjeta'
import { aPuntos } from '../utilidades/series'
import { duracionSesion, formatoCorriente, formatoDuracion, formatoEnergia, formatoPorcentaje } from '../utilidades/formato'

export function DetalleSesion() {
  const id = Number(useParams().id)
  const resumen = useQuery({ queryKey: ['sesion', id], queryFn: () => api.sesion(id), refetchInterval: (q) => (q.state.data?.activa ? 5000 : false) })
  const lecturas = useQuery({ queryKey: ['lecturas', id], queryFn: () => api.lecturas(id) })
  const s = resumen.data

  return (
    <EstadoCarga cargando={resumen.isLoading || lecturas.isLoading} error={resumen.error ?? lecturas.error}>
      {s && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Link to="/sesiones" className="text-sm text-sky-700 underline">← Sesiones</Link>
              <h2 className="text-xl font-bold">Sesión #{s.id}: {s.carga_declarada}</h2>
              <p className="text-sm text-slate-600">
                Duración {formatoDuracion(duracionSesion(s.inicio, s.fin))} · V_ref {s.v_ref} V · FP supuesto {s.factor_potencia_supuesto}
              </p>
            </div>
            <a href={api.urlCsv(id)} download className="rounded bg-sky-600 px-4 py-2 text-white">Exportar CSV</a>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <Tarjeta tipo="medido" titulo="Irms promedio" valor={formatoCorriente(s.i_rms_promedio)} />
            <Tarjeta tipo="medido" titulo="Irms máximo" valor={formatoCorriente(s.i_rms_max)} />
            <Tarjeta tipo="estimado" titulo="Energía" valor={formatoEnergia(s.energia_estimada_kwh)} />
            <Tarjeta tipo="medido" titulo="Pérdida de lecturas" valor={formatoPorcentaje(s.porcentaje_perdida)} detalle={`${s.n_lecturas} lecturas`} />
          </div>
          <section className="rounded-lg border bg-white p-4">
            <h3 className="mb-2 font-semibold">Irms vs. tiempo</h3>
            <GraficaIrms series={[{ nombre: 'Irms (medido)', color: colorSerie(0), puntos: aPuntos(lecturas.data ?? []) }]} />
          </section>
        </>
      )}
    </EstadoCarga>
  )
}
