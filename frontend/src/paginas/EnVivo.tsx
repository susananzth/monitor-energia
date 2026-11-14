import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../api/cliente'
import { Tarjeta } from '../componentes/Tarjeta'
import { EstadoCarga } from '../componentes/EstadoCarga'
import { GraficaIrms, colorSerie } from '../componentes/GraficaIrms'
import { aPuntos } from '../utilidades/series'
import { formatoCorriente, formatoEnergia, formatoPotencia, segundosSinDatos } from '../utilidades/formato'

const REFRESCO_MS = 5000
const VENTANA_MIN = 5

export function EnVivo() {
  const sesiones = useQuery({ queryKey: ['sesiones', 'activa'], queryFn: () => api.listarSesiones(0, 50), refetchInterval: REFRESCO_MS })
  const activa = sesiones.data?.content.find((s) => s.activa)

  const lecturas = useQuery({
    queryKey: ['lecturas', activa?.id, 'vivo'],
    queryFn: () => api.lecturas(activa!.id, new Date(Date.now() - VENTANA_MIN * 60_000).toISOString()),
    enabled: !!activa,
    refetchInterval: REFRESCO_MS,
  })
  const resumen = useQuery({
    queryKey: ['sesion', activa?.id],
    queryFn: () => api.sesion(activa!.id),
    enabled: !!activa,
    refetchInterval: REFRESCO_MS,
  })

  const [ahora, setAhora] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const puntos = lecturas.data ?? []
  const ultima = puntos[puntos.length - 1]
  const sinDatos = segundosSinDatos(ultima?.timestamp, ahora)

  return (
    <EstadoCarga cargando={sesiones.isLoading} error={sesiones.error}>
      {!activa ? (
        <div className="rounded-lg border bg-white p-6 text-center">
          <p className="mb-3">No hay una sesión activa.</p>
          <Link to="/sesiones" className="rounded bg-sky-600 px-4 py-2 text-white">
            Iniciar una sesión
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold">Sesión #{activa.id}</h2>
              <p className="text-slate-600">Carga declarada: {activa.carga_declarada}</p>
            </div>
            <span
              className={`rounded px-3 py-1 text-sm font-medium ${
                sinDatos === null || sinDatos > 15 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}
            >
              {sinDatos === null ? 'Sin datos todavía' : sinDatos > 15 ? `Sin datos hace ${sinDatos} s` : 'Recibiendo datos'}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <Tarjeta grande tipo="medido" titulo="Corriente Irms actual" valor={ultima ? formatoCorriente(ultima.i_rms) : '—'} />
            </div>
            <Tarjeta tipo="estimado" titulo="Potencia" valor={ultima ? formatoPotencia(ultima.p_est) : '—'} />
            <Tarjeta
              tipo="estimado"
              titulo="Energía acumulada"
              valor={ultima ? formatoEnergia(ultima.energia_acumulada_kwh) : '—'}
            />
            <Tarjeta
              tipo="medido"
              titulo="Lecturas recibidas"
              valor={String(resumen.data?.n_lecturas ?? 0)}
              detalle={`Pérdida: ${(resumen.data?.porcentaje_perdida ?? 0).toFixed(1)} %`}
            />
          </div>

          <section className="rounded-lg border bg-white p-4">
            <h3 className="mb-2 font-semibold">Últimos {VENTANA_MIN} minutos (se actualiza cada 5 s)</h3>
            <GraficaIrms series={[{ nombre: 'Irms (medido)', color: colorSerie(0), puntos: aPuntos(puntos) }]} />
          </section>
        </>
      )}
    </EstadoCarga>
  )
}
