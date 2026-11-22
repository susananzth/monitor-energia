import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../api/cliente'
import { Tarjeta } from '../componentes/Tarjeta'
import { EstadoCarga } from '../componentes/EstadoCarga'
import { EncabezadoPagina } from '../componentes/Ayuda'
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
        <div className="tarjeta text-center">
          <p className="text-4xl" aria-hidden>🔌</p>
          <p className="mb-4 mt-2 text-lg font-medium">No hay ninguna medición en curso.</p>
          <Link to="/sesiones" className="btn-primario">
            Iniciar una sesión
          </Link>
        </div>
      ) : (
        <>
          <EncabezadoPagina
            titulo={`En vivo: ${activa.carga_declarada}`}
            descripcion={`Sesión #${activa.id}. Los valores se actualizan solos cada 5 segundos.`}
            accion={
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                sinDatos === null || sinDatos > 15 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}
            >
              {sinDatos === null ? 'Sin datos todavía' : sinDatos > 15 ? `Sin datos hace ${sinDatos} s` : '● Recibiendo datos'}
            </span>
            }
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <Tarjeta grande tipo="medido" tono="corriente" ayuda="irms" titulo="Corriente actual" valor={ultima ? formatoCorriente(ultima.i_rms) : '—'} />
            </div>
            <Tarjeta tipo="estimado" tono="potencia" ayuda="potencia" titulo="Potencia" valor={ultima ? formatoPotencia(ultima.p_est) : '—'} />
            <Tarjeta
              tipo="estimado"
              tono="energia"
              ayuda="energia"
              titulo="Energía acumulada"
              valor={ultima ? formatoEnergia(ultima.energia_acumulada_kwh) : '—'}
            />
            <Tarjeta
              tipo="medido"
              ayuda="perdida"
              titulo="Lecturas recibidas"
              valor={String(resumen.data?.n_lecturas ?? 0)}
              detalle={`Pérdida: ${(resumen.data?.porcentaje_perdida ?? 0).toFixed(1)} %`}
            />
          </div>

          <section className="tarjeta">
            <h3 className="font-semibold">Corriente de los últimos {VENTANA_MIN} minutos</h3>
            <p className="mb-3 text-sm text-slate-500">Si la línea sube, el aparato está consumiendo más.</p>
            <GraficaIrms series={[{ nombre: 'Irms (medido)', color: colorSerie(0), puntos: aPuntos(puntos) }]} />
          </section>
        </>
      )}
    </EstadoCarga>
  )
}
