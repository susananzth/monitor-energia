import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../api/cliente'
import type { Lectura, Sesion } from '../api/tipos'
import { EstadoCarga } from '../componentes/EstadoCarga'
import { Ayuda, EncabezadoPagina, GuiaPagina } from '../componentes/Ayuda'
import { TONOS, type Tono } from '../componentes/Tarjeta'
import { ConfigTarifa } from '../componentes/ConfigTarifa'
import { costo, costoMensual, DIAS_MES, formatoDinero, useTarifa } from '../utilidades/tarifa'
import type { Termino } from '../utilidades/glosario'
import {
  duracionSesion,
  formatoCorriente,
  formatoDuracion,
  formatoEnergia,
  formatoFecha,
  formatoHora,
  formatoPotencia,
  segundosSinDatos,
  SUPUESTO,
} from '../utilidades/formato'
import {
  equivalencia,
  ESCALA_MAX_W,
  nivelConsumo,
  potenciaPromedio,
  resumenHistorico,
  tiempoMedido,
  TEXTO_NIVEL,
} from '../utilidades/panel'

const REFRESCO_MS = 5000
const VENTANA_MIN = 5
const SESIONES_GRAFICA = 10
const AZUL = '#2a78d6'
const TINTA_SECUNDARIA = '#64748b'
const REJILLA = '#e2e8f0'

function Caja({ titulo, ayuda, children }: { titulo: string; ayuda?: string; children: React.ReactNode }) {
  return (
    <section className="tarjeta">
      <h3 className="font-semibold text-slate-800">{titulo}</h3>
      {ayuda && <p className="mb-3 text-sm text-slate-500">{ayuda}</p>}
      {children}
    </section>
  )
}

function Dato({ titulo, valor, explicacion, estimado, tono = 'neutro', ayuda }: {
  titulo: string
  valor: string
  explicacion: string
  estimado?: boolean
  tono?: Tono
  ayuda?: Termino
}) {
  const t = TONOS[tono]
  return (
    <div className="tarjeta">
      <div className="flex items-center gap-2">
        <span aria-hidden className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${t.burbuja}`}>{t.icono}</span>
        <p className="text-sm text-slate-500">
          {titulo}
          {ayuda && <Ayuda termino={ayuda} />}
        </p>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{valor}</p>
      <p className="mt-1 text-xs text-slate-500">
        {explicacion}
        {estimado && (
          <span title={SUPUESTO} className="ml-1 cursor-help rounded-full bg-amber-100 px-1.5 text-amber-900">
            estimado
          </span>
        )}
      </p>
    </div>
  )
}

function Semaforo({ w }: { w: number }) {
  const n = TEXTO_NIVEL[nivelConsumo(w)]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${n.clase}`}>
      <span aria-hidden>{n.icono}</span>
      {n.etiqueta}
    </span>
  )
}

function BarraNivel({ w }: { w: number }) {
  const n = TEXTO_NIVEL[nivelConsumo(w)]
  const pct = Math.min(100, (w / ESCALA_MAX_W) * 100)
  return (
    <div>
      <div
        className="h-3 overflow-hidden rounded-full bg-slate-100"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={ESCALA_MAX_W}
        aria-valuenow={Math.round(w)}
        aria-label="Nivel de consumo"
      >
        <div className={`h-full rounded-full transition-all ${n.barra}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-xs text-slate-500">
        <span>0 W</span>
        <span>Bajo · menos de 300 W</span>
        <span>Medio · hasta 1,5 kW</span>
        <span>{ESCALA_MAX_W / 1000} kW o más</span>
      </div>
    </div>
  )
}

function Ahora({ activa, ahora }: { activa: Sesion; ahora: number }) {
  const lecturas = useQuery({
    queryKey: ['lecturas', activa.id, 'panel'],
    queryFn: () => api.lecturas(activa.id, new Date(Date.now() - VENTANA_MIN * 60_000).toISOString()),
    refetchInterval: REFRESCO_MS,
  })
  const puntos: Lectura[] = lecturas.data ?? []
  const ultima = puntos[puntos.length - 1]
  const sinDatos = segundosSinDatos(ultima?.timestamp, ahora)
  const conectado = sinDatos !== null && sinDatos <= 15
  const serie = puntos.map((l) => ({ t: new Date(l.timestamp).getTime(), w: l.p_est, i: l.i_rms }))
  const { tarifa } = useTarifa()

  return (
    <div className="space-y-4">
      <div className="tarjeta border-marca-100 bg-gradient-to-br from-marca-50 via-white to-acento-50">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">
              Midiendo ahora: <strong className="text-slate-800">{activa.carga_declarada}</strong> · sesión #{activa.id}
            </p>
            {ultima ? (
              <>
                <p className="mt-2 text-5xl font-bold tracking-tight text-slate-900">
                  {formatoPotencia(ultima.p_est)}
                  <span className="ml-2 align-middle text-sm font-medium text-slate-500">
                    consumo estimado
                    <Ayuda termino="potencia" />
                  </span>
                </p>
                <p className="mt-1 text-slate-700">
                  Es parecido a lo que consume <strong>{equivalencia(ultima.p_est)}</strong>.
                </p>
              </>
            ) : (
              <p className="mt-2 text-lg text-slate-700">Esperando la primera lectura del sensor…</p>
            )}
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
              conectado ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'
            }`}
          >
            <span aria-hidden className={conectado ? 'animate-pulse' : ''}>
              {conectado ? '●' : '○'}
            </span>
            {sinDatos === null ? 'Sin datos todavía' : conectado ? 'Recibiendo datos' : `Sin datos hace ${formatoDuracion(sinDatos)}`}
          </span>
        </div>

        {ultima && (
          <div className="mt-4 space-y-3">
            <Semaforo w={ultima.p_est} />
            <BarraNivel w={ultima.p_est} />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Dato
          titulo="Corriente medida"
          tono="corriente"
          ayuda="irms"
          valor={ultima ? formatoCorriente(ultima.i_rms) : '—'}
          explicacion="Lo que mide el sensor en el cable (amperios)."
        />
        <Dato
          titulo="Energía de esta sesión"
          tono="energia"
          ayuda="energia"
          valor={ultima ? formatoEnergia(ultima.energia_acumulada_kwh) : '—'}
          explicacion="Lo consumido desde que empezó la sesión."
          estimado
        />
        <Dato
          titulo="Costo de esta sesión"
          tono="dinero"
          ayuda="costo"
          valor={tarifa && ultima ? formatoDinero(costo(ultima.energia_acumulada_kwh, tarifa), tarifa) : '—'}
          explicacion={
            tarifa
              ? `Con tu tarifa de ${formatoDinero(tarifa.precioKwh, tarifa)} por kWh.`
              : 'Pon el precio del kWh de tu recibo en «¿Cuánto me cuesta?», más abajo.'
          }
          estimado={!!tarifa}
        />
        <Dato
          titulo="Tiempo midiendo"
          tono="tiempo"
          valor={formatoDuracion(duracionSesion(activa.inicio, null, ahora))}
          explicacion={`Desde ${formatoFecha(activa.inicio)}.`}
        />
      </div>

      <Caja
        titulo={`Consumo de los últimos ${VENTANA_MIN} minutos`}
        ayuda="Cada punto es una lectura (llega una cada 5 s). Si la línea sube, el aparato está consumiendo más."
      >
        {serie.length === 0 ? (
          <p className="py-10 text-center text-slate-500">Aún no hay lecturas en este rato.</p>
        ) : (
          <div style={{ height: 260 }} aria-label="Gráfica de potencia de los últimos minutos">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serie} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="relleno" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={AZUL} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={AZUL} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={REJILLA} vertical={false} />
                <XAxis
                  dataKey="t"
                  type="number"
                  scale="time"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(v: number) => formatoHora(new Date(v).toISOString())}
                  tick={{ fill: TINTA_SECUNDARIA, fontSize: 12 }}
                  minTickGap={40}
                />
                <YAxis
                  tickFormatter={(v: number) => formatoPotencia(v)}
                  tick={{ fill: TINTA_SECUNDARIA, fontSize: 12 }}
                  width={72}
                />
                <Tooltip
                  labelFormatter={(v) => `A las ${formatoHora(new Date(Number(v)).toISOString())}`}
                  formatter={(_v, _n, item) => {
                    const p = item.payload as { w: number; i: number }
                    return [`${formatoPotencia(p.w)} (corriente ${formatoCorriente(p.i)})`, 'Consumo']
                  }}
                />
                <Area type="monotone" dataKey="w" stroke={AZUL} strokeWidth={2} fill="url(#relleno)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Caja>
    </div>
  )
}

function Historico({ sesiones, ahora }: { sesiones: Sesion[]; ahora: number }) {
  const r = resumenHistorico(sesiones, ahora)
  const { tarifa } = useTarifa()
  const enDinero = (kwh: number) => (tarifa ? ` · ${formatoDinero(costo(kwh, tarifa), tarifa)}` : '')
  const recientes = [...sesiones].sort((a, b) => b.inicio.localeCompare(a.inicio))
  const grafica = recientes
    .slice(0, SESIONES_GRAFICA)
    .reverse()
    .map((s) => ({ nombre: `#${s.id} ${s.carga_declarada}`, wh: s.energia_estimada_kwh * 1000, s }))

  if (sesiones.length === 0)
    return (
      <Caja titulo="Histórico">
        <p className="py-6 text-center text-slate-500">Todavía no hay mediciones guardadas.</p>
      </Caja>
    )

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Dato titulo="Mediciones realizadas" tono="neutro" ayuda="sesion" valor={String(r.sesiones)} explicacion={`${r.lecturas} lecturas en total.`} />
        <Dato titulo="Tiempo total medido" tono="tiempo" valor={formatoDuracion(r.segundosMedidos)} explicacion="Suma de todas las sesiones." />
        <Dato titulo="Energía total" tono="energia" ayuda="energia" valor={formatoEnergia(r.energiaKwh)} explicacion={tarifa ? `Te costó unos ${formatoDinero(costo(r.energiaKwh, tarifa), tarifa)}.` : 'Todo lo consumido en las mediciones.'} estimado />
        <Dato titulo="Corriente más alta" tono="corriente" ayuda="irms" valor={formatoCorriente(r.iMax)} explicacion="El pico registrado por el sensor." />
      </div>

      <Caja
        titulo="¿Cuánta energía usó cada medición?"
        ayuda={`Últimas ${grafica.length} sesiones, de la más antigua a la más reciente. Barra más alta = más consumo.`}
      >
        <div style={{ height: 260 }} aria-label="Gráfica de energía por sesión">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={grafica} margin={{ top: 8, right: 16, bottom: 0, left: 0 }} barCategoryGap="25%">
              <CartesianGrid stroke={REJILLA} vertical={false} />
              <XAxis
                dataKey="nombre"
                tick={{ fill: TINTA_SECUNDARIA, fontSize: 12 }}
                interval={0}
                tickFormatter={(v: string) => (v.length > 16 ? `${v.slice(0, 15)}…` : v)}
              />
              <YAxis
                tickFormatter={(v: number) => `${Number(v.toFixed(1))} Wh`}
                tick={{ fill: TINTA_SECUNDARIA, fontSize: 12 }}
                width={72}
              />
              <Tooltip
                cursor={{ fill: '#f1f5f9' }}
                formatter={(_v, _n, item) => {
                  const s = (item.payload as { s: Sesion }).s
                  return [
                    `${formatoEnergia(s.energia_estimada_kwh)} en ${formatoDuracion(tiempoMedido(s, ahora))}${enDinero(s.energia_estimada_kwh)}`,
                    'Energía (estimada)',
                  ]
                }}
              />
              <Bar dataKey="wh" fill={AZUL} radius={[4, 4, 0, 0]} maxBarSize={56} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Caja>

      <Caja titulo="Últimas mediciones" ayuda="Toca una medición para ver su gráfica completa y exportar los datos.">
        <ul className="divide-y">
          {recientes.slice(0, 8).map((s) => {
            const w = potenciaPromedio(s)
            return (
              <li key={s.id}>
                <Link
                  to={`/sesiones/${s.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded px-2 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {s.carga_declarada}
                      {s.activa && <span className="ml-2 rounded bg-green-100 px-1.5 text-xs text-green-900">en curso</span>}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatoFecha(s.inicio)} · {formatoDuracion(tiempoMedido(s, ahora))} · promedio{' '}
                      {formatoPotencia(w)} · {formatoEnergia(s.energia_estimada_kwh)}
                      {enDinero(s.energia_estimada_kwh)}
                    </p>
                  </div>
                  <Semaforo w={w} />
                </Link>
              </li>
            )
          })}
        </ul>
      </Caja>
    </div>
  )
}

const HORAS_RAPIDAS = [0.25, 1, 4, 8, 24]

function textoHoras(h: number): string {
  if (h < 1) return `${Math.round(h * 60)} min`
  return `${Number(h.toFixed(2))} h`
}

function CuantoCuesta({ sesiones, activa }: { sesiones: Sesion[]; activa?: Sesion }) {
  const { tarifa } = useTarifa()
  const [cambiando, setCambiando] = useState(false)
  const opciones = [...sesiones].filter((s) => s.n_lecturas > 0).sort((a, b) => b.inicio.localeCompare(a.inicio))
  const [elegidaId, setElegidaId] = useState<number | null>(null)
  const [horas, setHoras] = useState(1)
  const elegida = opciones.find((s) => s.id === elegidaId) ?? (activa && activa.n_lecturas > 0 ? activa : opciones[0])

  if (!tarifa || cambiando)
    return (
      <Caja
        titulo={tarifa ? 'Cambiar tu tarifa' : '¿Cuánto me cuesta en dinero?'}
        ayuda="Escribe cuánto te cobra tu empresa de luz por cada kWh. Así verás en soles (o tu moneda) lo que gasta cada aparato que midas."
      >
        <ConfigTarifa alGuardar={() => setCambiando(false)} />
        {tarifa && (
          <button type="button" onClick={() => setCambiando(false)} className="mt-2 text-sm text-slate-500 hover:underline">
            Cancelar
          </button>
        )}
      </Caja>
    )

  const w = elegida ? potenciaPromedio(elegida) : 0
  const porHora = costoMensual(w, 1, tarifa) / DIAS_MES
  const porDia = porHora * horas
  const alMes = costoMensual(w, horas, tarifa)

  return (
    <section className="tarjeta border-acento-100 bg-gradient-to-br from-acento-50 via-white to-white">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-800">
            ¿Cuánto me cuesta?
            <Ayuda termino="costo" />
          </h3>
          <p className="text-sm text-slate-500">
            Tu tarifa: <strong>{formatoDinero(tarifa.precioKwh, tarifa)}</strong> por kWh.{' '}
            <button type="button" onClick={() => setCambiando(true)} className="font-medium text-marca-700 hover:underline">
              Cambiar
            </button>
          </p>
        </div>
        <span title={SUPUESTO} className="cursor-help rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
          estimado
        </span>
      </div>

      {!elegida ? (
        <p className="py-6 text-center text-slate-500">Mide un aparato y aquí verás cuánto te costaría usarlo cada mes.</p>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="etiqueta block">
              Aparato medido
              <select className="campo" value={elegida.id} onChange={(e) => setElegidaId(Number(e.target.value))}>
                {opciones.map((s) => (
                  <option key={s.id} value={s.id}>
                    #{s.id} {s.carga_declarada} · {formatoPotencia(potenciaPromedio(s))}
                    {s.activa ? ' (en curso)' : ''}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <label className="etiqueta block">
                ¿Cuánto lo usas al día? <strong className="text-slate-900">{textoHoras(horas)}</strong>
                <input
                  type="range"
                  min={0.25}
                  max={24}
                  step={0.25}
                  value={horas}
                  onChange={(e) => setHoras(Number(e.target.value))}
                  className="mt-2 w-full accent-acento-600"
                />
              </label>
              <div className="mt-1 flex flex-wrap gap-1">
                {HORAS_RAPIDAS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHoras(h)}
                    className={`rounded-full px-2 py-0.5 text-xs ${h === horas ? 'bg-acento-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {textoHoras(h)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
              <p className="text-xs text-slate-500">Por cada hora de uso</p>
              <p className="text-xl font-bold text-slate-900">{formatoDinero(porHora, tarifa)}</p>
            </div>
            <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
              <p className="text-xs text-slate-500">Al día ({textoHoras(horas)})</p>
              <p className="text-xl font-bold text-slate-900">{formatoDinero(porDia, tarifa)}</p>
            </div>
            <div className="rounded-xl bg-acento-600 p-3 text-white">
              <p className="text-xs text-acento-50">Al mes ({DIAS_MES} días)</p>
              <p className="text-2xl font-bold">{formatoDinero(alMes, tarifa)}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Usa el consumo promedio de la medición ({formatoPotencia(w)}). La medición en sí costó{' '}
            {formatoDinero(costo(elegida.energia_estimada_kwh, tarifa), tarifa)} ({formatoEnergia(elegida.energia_estimada_kwh)}).
          </p>
        </div>
      )}
    </section>
  )
}

export function Panel() {
  const sesiones = useQuery({
    queryKey: ['sesiones', 'panel'],
    queryFn: () => api.listarSesiones(0, 100),
    refetchInterval: REFRESCO_MS,
  })
  const lista = sesiones.data?.content ?? []
  const activa = lista.find((s) => s.activa)

  const [ahora, setAhora] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <EstadoCarga cargando={sesiones.isLoading} error={sesiones.error}>
      <div className="space-y-8">
        <EncabezadoPagina titulo="Panel" descripcion="Lo que se está midiendo ahora y el resumen de todas tus mediciones." />
        <GuiaPagina
          id="panel"
          pasos={[
            <>Para medir un aparato, ve a <Link className="enlace" to="/sesiones">Sesiones</Link> y pulsa <strong>Nueva sesión</strong>.</>,
            'Enciende el aparato: los datos aparecen aquí solos, cada 5 segundos.',
            'El color te dice si el consumo es bajo (verde), medio (ámbar) o alto (rojo).',
          ]}
        />
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Ahora mismo</h2>
          {activa ? (
            <Ahora activa={activa} ahora={ahora} />
          ) : (
            <div className="tarjeta text-center">
              <p className="text-4xl" aria-hidden>🔌</p>
              <p className="mb-1 mt-2 text-lg font-medium">No se está midiendo nada en este momento.</p>
              <p className="mb-4 text-sm text-slate-500">Inicia una sesión e indica qué aparato vas a medir.</p>
              <Link to="/sesiones" className="btn-primario">
                Iniciar una medición
              </Link>
            </div>
          )}
        </div>

        <CuantoCuesta sesiones={lista} activa={activa} />

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Histórico</h2>
          <Historico sesiones={lista} ahora={ahora} />
        </div>

        <details className="tarjeta text-sm text-slate-600">
          <summary className="cursor-pointer font-medium text-slate-800">¿Cómo leer este panel?</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Corriente (A):</strong> es lo único que mide el sensor directamente.
            </li>
            <li>
              <strong>Potencia (W) y energía (Wh/kWh):</strong> se calculan a partir de la corriente. {SUPUESTO}
            </li>
            <li>
              <strong>Costo:</strong> energía × el precio del kWh que pusiste. No incluye cargos fijos del recibo.
            </li>
            <li>
              <strong>Colores:</strong> verde = consumo bajo (menos de 300 W), ámbar = medio (hasta 1,5 kW), rojo = alto.
            </li>
            <li>Los datos se actualizan solos cada 5 segundos.</li>
          </ul>
        </details>
      </div>
    </EstadoCarga>
  )
}
