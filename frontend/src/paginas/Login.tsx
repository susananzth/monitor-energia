import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/Auth'
import { Logo } from '../componentes/Logo'

export function Login() {
  const { usuario, iniciarSesion, expiro } = useAuth()
  const navegar = useNavigate()
  const desde = (useLocation().state as { desde?: string } | null)?.desde ?? '/'
  const [nombre, setNombre] = useState('')
  const [password, setPassword] = useState('')
  const [ver, setVer] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (usuario) return <Navigate to={desde} replace />

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await iniciarSesion(nombre.trim(), password)
      navegar(desde, { replace: true })
    } catch (err) {
      setError((err as Error).message)
      setPassword('')
    } finally {
      setEnviando(false)
    }
  }

  const campo = 'campo'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-marca-950 via-marca-800 to-marca-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Logo tamano="lg" />
          <h1 className="mt-3 text-2xl font-bold text-white">Monitor de energía</h1>
          <p className="text-sm text-slate-400">Inicia sesión con la cuenta de tu equipo</p>
        </div>
        <form onSubmit={enviar} className="space-y-4 rounded-2xl bg-white p-6 shadow-2xl shadow-marca-950/50">
          {expiro && !error && (
            <p className="rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900">
              Tu sesión terminó. Vuelve a iniciar sesión.
            </p>
          )}
          <label className="block text-sm font-medium text-slate-700">
            Usuario
            <input
              className={campo}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              autoFocus
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Contraseña
            <div className="relative">
              <input
                className={`${campo} pr-20`}
                type={ver ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setVer((v) => !v)}
                className="absolute right-2 top-1/2 mt-0.5 -translate-y-1/2 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
              >
                {ver ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </label>
          {error && (
            <p role="alert" className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-800">
              {error}
            </p>
          )}
          <button
            disabled={enviando}
            className="btn-primario w-full"
          >
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-400">¿No tienes cuenta? Pídesela al administrador del equipo.</p>
      </div>
    </div>
  )
}
