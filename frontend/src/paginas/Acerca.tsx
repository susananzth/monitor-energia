export function Acerca() {
  return (
    <article className="space-y-4 rounded-lg border bg-white p-6">
      <h2 className="text-xl font-bold">Acerca de y supuestos</h2>
      <section>
        <h3 className="font-semibold">Cómo funciona</h3>
        <p>
          Un sensor de corriente tipo pinza (SCT-013-000) rodea un solo conductor del cable. Un ESP32 lee su señal
          y calcula la corriente eficaz (<strong>Irms</strong>) cada pocos segundos y la envía al servidor.
        </p>
      </section>
      <section>
        <h3 className="font-semibold">Medido vs. estimado</h3>
        <ul className="list-disc space-y-1 pl-5">
          <li><span className="rounded bg-sky-100 px-1 text-sky-900">medido</span> La corriente Irms sale directamente del sensor.</li>
          <li>
            <span className="rounded bg-amber-200 px-1 text-amber-900">estimado</span> La potencia y la energía se
            calculan: <code>P = V · Irms · FP</code>.
          </li>
        </ul>
      </section>
      <section>
        <h3 className="font-semibold">Por qué la energía es una estimación</h3>
        <p>
          El prototipo no mide el voltaje ni el desfase entre voltaje y corriente. Por eso se supone una tensión
          fija de <strong>220 V</strong> y un factor de potencia de <strong>1</strong> (carga resistiva). Con cargas
          inductivas o electrónicas, o si la tensión de la red varía, la energía real puede diferir.
        </p>
      </section>
      <section>
        <h3 className="font-semibold">Validación</h3>
        <p>
          La corriente se contrasta con una pinza amperimétrica comercial en la pantalla de Validación. El objetivo
          es un error medio de 5 % o menos.
        </p>
      </section>
      <section>
        <h3 className="font-semibold">Encuesta de comprensión</h3>
        <p>
          Ayúdanos a saber si esta pantalla se entiende:{' '}
          <a className="text-sky-700 underline" href={import.meta.env.VITE_ENCUESTA_URL ?? '#'} target="_blank" rel="noreferrer">
            responder la encuesta (3–5 preguntas)
          </a>
          .
        </p>
      </section>
    </article>
  )
}
