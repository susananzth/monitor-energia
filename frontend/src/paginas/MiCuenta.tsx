import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../api/cliente'
import { useAuth } from '../auth/Auth'

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
  const campo = 'mt-1 w-full rounded border px-2 py-1'
  return (
    <div className="max-w-md space-y-4">
      <h2 className="text-xl font-bold">Mi cuenta</h2>
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <p className="font-medium">{usuario?.nombre}</p>
        <p className="text-sm text-slate-500">
          @{usuario?.usuario} · {usuario?.rol === 'ADMIN' ? 'Administrador' : 'Miembro'}
        </p>
      </div>
      <form onSubmit={enviar} className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
        <h3 className="font-semibold">Cambiar contraseña</h3>
        <label className="block text-sm">
          Contraseña actual
          <input className={campo} type="password" value={actual} onChange={(e) => setActual(e.target.value)} required autoComplete="current-password" />
        </label>
        <label className="block text-sm">
          Nueva contraseña
          <input className={campo} type="password" value={nueva} onChange={(e) => setNueva(e.target.value)} required minLength={8} autoComplete="new-password" />
        </label>
        <label className="block text-sm">
          Repite la nueva contraseña
          <input className={campo} type="password" value={repetir} onChange={(e) => setRepetir(e.target.value)} required minLength={8} autoComplete="new-password" />
        </label>
        <button disabled={cambiar.isPending} className="rounded bg-sky-600 px-4 py-2 text-white disabled:opacity-50">
          Guardar
        </button>
        {aviso && <p role="alert" className="text-sm text-red-700">{aviso}</p>}
        {cambiar.error && <p role="alert" className="text-sm text-red-700">{cambiar.error.message}</p>}
        {cambiar.isSuccess && <p className="text-sm text-green-700">Contraseña actualizada. Tus otras sesiones abiertas se cerraron.</p>}
      </form>
    </div>
  )
}
