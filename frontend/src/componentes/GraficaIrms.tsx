import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export interface Serie {
  nombre: string
  color: string
  puntos: { t: number; i: number }[]
}

const COLORES = ['#0284c7', '#dc2626', '#16a34a']
export const colorSerie = (n: number) => COLORES[n % COLORES.length]

/** Gráfica de Irms (medido) contra el tiempo transcurrido en segundos. */
export function GraficaIrms({ series, alto = 288 }: { series: Serie[]; alto?: number }) {
  const hayDatos = series.some((s) => s.puntos.length > 0)
  if (!hayDatos) return <p className="py-8 text-center text-slate-500">Aún no hay lecturas.</p>
  return (
    <div style={{ height: alto }} aria-label="Gráfica de corriente Irms">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="t"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(v: number) => `${Math.round(v)} s`}
          />
          <YAxis unit=" A" width={60} />
          <Tooltip
            formatter={(v) => [`${Number(v).toFixed(3)} A (medido)`, 'Irms']}
            labelFormatter={(v) => `${Number(v).toFixed(0)} s`}
          />
          <Legend />
          {series.map((s) => (
            <Line
              key={s.nombre}
              name={s.nombre}
              data={s.puntos}
              dataKey="i"
              stroke={s.color}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
