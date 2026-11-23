import { useState, type FormEvent } from 'react'
import { Ayuda } from './Ayuda'
import { MONEDA_POR_DEFECTO, tarifaValida, useTarifa } from '../utilidades/tarifa'

/** Formulario para indicar cuánto cobra la empresa de luz por cada kWh. */
export function ConfigTarifa({ alGuardar }: { alGuardar?: () => void }) {
  const { tarifa, guardar } = useTarifa()
  const [precio, setPrecio] = useState(tarifa ? String(tarifa.precioKwh) : '')
  const [moneda, setMoneda] = useState(tarifa?.moneda ?? MONEDA_POR_DEFECTO)
  const [aviso, setAviso] = useState<string | null>(null)
  const [listo, setListo] = useState(false)

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    const nueva = { precioKwh: Number(precio.replace(',', '.')), moneda: moneda.trim() || MONEDA_POR_DEFECTO }
    if (!tarifaValida(nueva)) {
      setAviso('Escribe un precio mayor que 0, por ejemplo 0.75.')
      setListo(false)
      return
    }
    setAviso(null)
    guardar(nueva)
    setListo(true)
    alGuardar?.()
  }

  const borrar = () => {
    guardar(null)
    setPrecio('')
    setListo(false)
  }

  return (
    <form onSubmit={enviar} className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="etiqueta block w-24">
          Moneda
          <input className="campo" value={moneda} onChange={(e) => setMoneda(e.target.value)} maxLength={4} />
        </label>
        <label className="etiqueta block flex-1">
          Precio de 1 kWh
          <Ayuda termino="tarifa" />
          <input
            className="campo"
            inputMode="decimal"
            placeholder="Ejemplo: 0.75"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            required
          />
        </label>
        <button className="btn-primario">Guardar tarifa</button>
        {tarifa && (
          <button type="button" onClick={borrar} className="text-sm text-slate-500 hover:underline">
            Quitar
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500">
        En tu recibo de luz busca el <strong>precio unitario</strong> o el <strong>cargo por energía</strong>, en {moneda || MONEDA_POR_DEFECTO}/kWh. Si no lo
        encuentras, divide el total del recibo entre los kWh consumidos del mes: así incluyes impuestos y cargos fijos. Se guarda solo en este navegador.
      </p>
      {aviso && <p role="alert" className="text-sm text-red-700">{aviso}</p>}
      {listo && <p className="text-sm text-green-700">Tarifa guardada. Ya puedes ver cuánto cuesta cada medición.</p>}
    </form>
  )
}
