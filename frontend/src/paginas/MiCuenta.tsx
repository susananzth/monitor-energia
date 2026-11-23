import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../api/cliente'
import { useAuth } from '../auth/Auth'
import { ConfigTarifa } from '../componentes/ConfigTarifa'

export function MiCuenta() {
  const { usuario } = useAuth()
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [repetir, setRepetir] = useState('')
  const [aviso, setAviso] = useState<string | null>(null)
  const cambiar = useMutation({
    mutationFn: () => api.cambiarPassword(actual, nueva),
    onSuccess: () => {
      setActual('')
      setNueva('')
      setRepetir('')
    },
  })
  const enviar = (e: FormEvent) => {
    e.preventDefault()
    setAviso(null)
    if (nueva !== repetir) {
      setAviso('Las contraseñas nuevas no coinciden.')
      return
    }
    cambiar.mutate()
  }
  return (
    <div className="max-w-xl space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Mi cuenta</h2>
      <div className="tarjeta">
        <p className="font-medium">{usuario?.nombre}</p>
        <p className="text-sm text-slate-500">
          @{usuario?.usuario} · {usuario?.rol === 'ADMIN' ? 'Administrador' : 'Miembro'}
        </p>
      </div>
      <section className="tarjeta space-y-2">
        <h3 className="font-semibold">💰 Tarifa de luz</h3>
        <p className="text-sm text-slate-500">El precio del kWh de tu recibo. Con él, el panel muestra cuánto cuesta cada medición.</p>
        <ConfigTarifa />
      </section>
      <form onSubmit={enviar} className="space-y-3 tarjeta">
        <h3 className="font-semibold">Cambiar contraseña</h3>
        <label className="etiqueta block">
          Contraseña actual
          <input className="campo" type="password" value={actual} onChange={(e) => setActual(e.target.value)} required autoComplete="current-password" />
        </label>
        <label className="etiqueta block">
          Nueva contraseña
          <input className="campo" type="password" value={nueva} onChange={(e) => setNueva(e.target.value)} required minLength={8} autoComplete="new-password" />
        </label>
        <label className="etiqueta block">
          Repite la nueva contraseña
          <input className="campo" type="password" value={repetir} onChange={(e) => setRepetir(e.target.value)} required minLength={8} autoComplete="new-password" />
        </label>
        <button disabled={cambiar.isPending} className="btn-primario">
          Guardar
        </button>
        {aviso && <p role="alert" className="text-sm text-red-700">{aviso}</p>}
        {cambiar.error && <p role="alert" className="text-sm text-red-700">{cambiar.error.message}</p>}
        {cambiar.isSuccess && <p className="text-sm text-green-700">Contraseña actualizada. Tus otras sesiones abiertas se cerraron.</p>}
      </form>
    </div>
  )
}
