import { Link } from 'react-router-dom'
import { EncabezadoPagina } from '../componentes/Ayuda'
import { GLOSARIO } from '../utilidades/glosario'

const PASOS = [
  { icono: '🔌', titulo: 'Coloca el sensor', texto: 'Abre la pinza del sensor y ciérrala alrededor de un solo cable del aparato. Si abrazas el cable completo, marcará cero.' },
  { icono: '▶️', titulo: 'Inicia una sesión', texto: <>En <Link className="enlace" to="/sesiones">Sesiones</Link>, pulsa <strong>Nueva sesión</strong> y escribe qué aparato es.</> },
  { icono: '📈', titulo: 'Mira los datos', texto: <>Enciende el aparato. En <Link className="enlace" to="/">Panel</Link> verás el consumo, actualizado cada 5 segundos.</> },
  { icono: '⏹️', titulo: 'Finaliza', texto: <>Cuando termines, pulsa <strong>Finalizar</strong> en Sesiones. La medición queda guardada en el histórico.</> },
]

export function PaginaAyuda() {
  return (
    <div className="space-y-6">
      <EncabezadoPagina titulo="Ayuda" descripcion="Todo lo que necesitas para medir, sin saber de electricidad." />

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Cómo hacer una medición</h3>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PASOS.map((p, i) => (
            <li key={p.titulo} className="tarjeta">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-marca-600 text-sm font-bold text-white">{i + 1}</span>
                <span aria-hidden className="text-xl">{p.icono}</span>
              </div>
              <p className="mt-3 font-semibold">{p.titulo}</p>
              <p className="mt-1 text-sm text-slate-600">{p.texto}</p>
            </li>
          ))}
        </ol>
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          ⚠️ <strong>Seguridad:</strong> usa un cable separador de línea preparado por un técnico. No abras enchufes ni cables con la corriente encendida.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Palabras que verás en la plataforma</h3>
        <dl className="tarjeta grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {Object.values(GLOSARIO).map((g) => (
            <div key={g.termino}>
              <dt className="font-semibold text-slate-900">{g.termino}</dt>
              <dd className="text-sm text-slate-600">{g.texto}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="tarjeta">
          <h3 className="font-semibold">Medido y estimado</h3>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            <li>
              <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-cyan-800">medido</span> La corriente sale directamente del sensor.
            </li>
            <li>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">estimado</span> La potencia y la energía se calculan
              con la fórmula <code>P = V · Irms · FP</code>.
            </li>
          </ul>
        </div>
        <div className="tarjeta">
          <h3 className="font-semibold">Por qué la energía es una estimación</h3>
          <p className="mt-2 text-sm text-slate-600">
            El sistema no mide el voltaje. Supone <strong>220 V</strong> y un factor de potencia de <strong>1</strong>, que es exacto para
            aparatos que calientan (hervidor, plancha, foco incandescente). Con motores o cargadores la energía real puede ser algo menor.
          </p>
        </div>
        <div className="tarjeta">
          <h3 className="font-semibold">Cómo funciona por dentro</h3>
          <p className="mt-2 text-sm text-slate-600">
            El sensor (SCT-013-000) detecta el campo magnético que crea la corriente en el cable, sin cortarlo. Un ESP32 convierte esa señal en
            amperios y la envía por Wi-Fi a este servidor cada 5 segundos.
          </p>
        </div>
        <div className="tarjeta">
          <h3 className="font-semibold">¿Qué tan preciso es?</h3>
          <p className="mt-2 text-sm text-slate-600">
            Se compara con una pinza amperimétrica comercial en <Link className="enlace" to="/validacion">Validación</Link>. El objetivo es un error
            de 5 % o menos.
          </p>
        </div>
      </section>

      {import.meta.env.VITE_ENCUESTA_URL && (
        <p className="text-sm text-slate-600">
          ¿Te resultó fácil de entender?{' '}
          <a className="enlace" href={import.meta.env.VITE_ENCUESTA_URL} target="_blank" rel="noreferrer">
            Responde la encuesta (3 a 5 preguntas)
          </a>
          .
        </p>
      )}
    </div>
  )
}
