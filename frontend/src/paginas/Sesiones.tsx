import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../api/cliente'
import { EstadoCarga } from '../componentes/EstadoCarga'
import { Ayuda, EncabezadoPagina, GuiaPagina } from '../componentes/Ayuda'
import { duracionSesion, formatoDuracion, formatoEnergia, formatoFecha, formatoPorcentaje, SUPUESTO } from '../utilidades/formato'

function FormularioSesion({ alCrear }: { alCrear: () => void }) {
  const [dispositivo, setDispositivo] = useState('1')
  const [carga, setCarga] = useState('')
  const [vRef, setVRef] = useState('220')
  const crear = useMutation({
    mutationFn: () =>
      api.crearSesion({ dispositivo_id: Number(dispositivo), carga_declarada: carga.trim(), v_ref: Number(vRef) }),
    onSuccess: alCrear,
  })
  const enviar = (e: FormEvent) => {
    e.preventDefault()
    crear.mutate()
  }
  return (
    <form onSubmit={enviar} className="tarjeta grid gap-4 sm:grid-cols-4">
      <h3 className="font-semibold sm:col-span-4">Nueva medición</h3>
      <label className="etiqueta sm:col-span-2">
        ¿Qué aparato vas a medir?
        <Ayuda termino="carga" />
        <input className="campo" value={carga} onChange={(e) => setCarga(e.target.value)} required maxLength={200} placeholder="Ej.: Hervidor 2000 W" />
      </label>
      <label className="etiqueta">
        Medidor
        <Ayuda termino="dispositivo" />
        <input className="campo" type="number" min={1} value={dispositivo} onChange={(e) => setDispositivo(e.target.value)} required />
      </label>
      <label className="etiqueta">
        Voltaje de la red (V)
        <Ayuda termino="vref" />
        <input className="campo" type="number" min={1} step="any" value={vRef} onChange={(e) => setVRef(e.target.value)} required />
      </label>
      <p className="text-xs text-slate-500 sm:col-span-4">
        Si no sabes qué poner en medidor o voltaje, deja los valores que vienen: sirven para la mayoría de los casos.
      </p>
      <div className="sm:col-span-4 flex flex-wrap items-center gap-3">
        <button disabled={crear.isPending} className="btn-primario">
          Empezar a medir
        </button>
        {crear.error && <span role="alert" className="text-sm text-red-700">{crear.error.message}</span>}
      </div>
    </form>
  )
}

export function Sesiones() {
  const cliente = useQueryClient()
  const [mostrarForm, setMostrarForm] = useState(false)
  const lista = useQuery({ queryKey: ['sesiones', 'lista'], queryFn: () => api.listarSesiones(0, 100) })
  const finalizar = useMutation({
    mutationFn: (id: number) => api.finalizar(id),
    onSuccess: () => cliente.invalidateQueries({ queryKey: ['sesiones'] }),
  })

  return (
    <>
      <EncabezadoPagina
        titulo="Sesiones"
        descripcion="Cada sesión es la medición de un aparato. Aquí las inicias, las terminas y ves todas las anteriores."
        accion={
          <button onClick={() => setMostrarForm((v) => !v)} className={mostrarForm ? 'btn-secundario' : 'btn-primario'}>
            {mostrarForm ? 'Cancelar' : '+ Nueva sesión'}
          </button>
        }
      />
      <GuiaPagina
        id="sesiones"
        pasos={[
          <>Coloca la pinza del sensor alrededor de <strong>un solo cable</strong> del aparato (no del cable completo).</>,
          <>Pulsa <strong>Nueva sesión</strong> y escribe qué aparato es.</>,
          <>Enciende el aparato. Mira los datos en <Link className="enlace" to="/">Panel</Link> o <Link className="enlace" to="/en-vivo">En vivo</Link>.</>,
          <>Cuando termines, pulsa <strong>Finalizar</strong>. Solo puede haber una sesión activa por medidor.</>,
        ]}
      />
      {mostrarForm && (
        <FormularioSesion
          alCrear={() => {
            setMostrarForm(false)
            cliente.invalidateQueries({ queryKey: ['sesiones'] })
          }}
        />
      )}
      <EstadoCarga cargando={lista.isLoading} error={lista.error ?? finalizar.error}>
        <div className="tarjeta overflow-x-auto p-0">
          <table className="tabla">
            <thead>
              <tr>
                <th>Inicio</th>
                <th>Aparato</th>
                <th>Duración</th>
                <th title={SUPUESTO}>Energía <Ayuda termino="estimado" /></th>
                <th>Pérdida <Ayuda termino="perdida" /></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.data?.content.map((s) => (
                <tr key={s.id}>
                  <td className="whitespace-nowrap text-slate-500">{formatoFecha(s.inicio)}</td>
                  <td>
                    <Link className="enlace" to={`/sesiones/${s.id}`}>{s.carga_declarada}</Link>
                    {s.activa && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">● midiendo</span>}
                  </td>
                  <td>{formatoDuracion(duracionSesion(s.inicio, s.fin))}</td>
                  <td>{formatoEnergia(s.energia_estimada_kwh)}</td>
                  <td>{formatoPorcentaje(s.porcentaje_perdida)}</td>
                  <td className="text-right">
                    {s.activa && (
                      <button onClick={() => finalizar.mutate(s.id)} className="btn-secundario">
                        Finalizar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {lista.data?.content.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-slate-500">Todavía no hay sesiones. Pulsa <strong>+ Nueva sesión</strong> para empezar.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </EstadoCarga>
    </>
  )
}
