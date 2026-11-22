import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/cliente'
import { EstadoCarga } from '../componentes/EstadoCarga'
import { GraficaIrms, colorSerie } from '../componentes/GraficaIrms'
import { Tarjeta } from '../componentes/Tarjeta'
import { Ayuda } from '../componentes/Ayuda'
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
              <Link to="/sesiones" className="enlace text-sm">← Volver a sesiones</Link>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">{s.carga_declarada}</h2>
              <p className="text-sm text-slate-500">
                Sesión #{s.id} · duró {formatoDuracion(duracionSesion(s.inicio, s.fin))} · calculada con {s.v_ref} V
                <Ayuda termino="vref" />
              </p>
            </div>
            <button type="button" onClick={() => api.descargarCsv(id).catch((e: Error) => alert(e.message))} className="btn-primario" title="Descarga todas las lecturas para abrirlas en Excel">⬇ Descargar datos (CSV)</button>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <Tarjeta tipo="medido" tono="corriente" ayuda="irms" titulo="Corriente promedio" valor={formatoCorriente(s.i_rms_promedio)} />
            <Tarjeta tipo="medido" tono="corriente" titulo="Corriente máxima" valor={formatoCorriente(s.i_rms_max)} />
            <Tarjeta tipo="estimado" tono="energia" ayuda="energia" titulo="Energía" valor={formatoEnergia(s.energia_estimada_kwh)} />
            <Tarjeta tipo="medido" ayuda="perdida" titulo="Pérdida de lecturas" valor={formatoPorcentaje(s.porcentaje_perdida)} detalle={`${s.n_lecturas} lecturas`} />
          </div>
          <section className="tarjeta">
            <h3 className="font-semibold">Corriente durante la medición</h3>
            <p className="mb-3 text-sm text-slate-500">El eje horizontal es el tiempo desde que empezó la sesión.</p>
            <GraficaIrms series={[{ nombre: 'Irms (medido)', color: colorSerie(0), puntos: aPuntos(lecturas.data ?? []) }]} />
          </section>
        </>
      )}
    </EstadoCarga>
  )
}
