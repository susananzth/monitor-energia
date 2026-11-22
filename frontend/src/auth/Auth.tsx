import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { alExpirarSesion, api } from '../api/cliente'
import { borrarSesion, guardarSesion, leerSesion } from '../api/sesion'
import type { UsuarioSesion } from '../api/tipos'

interface ContextoAuth {
  usuario: UsuarioSesion | null
  esAdmin: boolean
  iniciarSesion: (usuario: string, password: string) => Promise<void>
  cerrarSesion: () => Promise<void>
  /** true si la última sesión terminó sola (venció o fue cerrada por un admin). */
  expiro: boolean
}

const Contexto = createContext<ContextoAuth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(() => leerSesion()?.usuario ?? null)
  const [expiro, setExpiro] = useState(false)

  useEffect(() => {
    alExpirarSesion(() => {
      setUsuario(null)
      setExpiro(true)
      qc.clear()
    })
    return () => alExpirarSesion(null)
  }, [qc])

  const iniciarSesion = useCallback(async (nombre: string, password: string) => {
    const r = await api.login(nombre, password)
    const { id, usuario: u, nombre: n, rol } = r.usuario
    guardarSesion({ token: r.token, expira_en: r.expira_en, usuario: { id, usuario: u, nombre: n, rol } })
    setExpiro(false)
    setUsuario({ id, usuario: u, nombre: n, rol })
  }, [])

  const cerrarSesion = useCallback(async () => {
    try {
      await api.logout()
    } catch {
      /* si el token ya no vale, igual se cierra en el navegador */
    }
    borrarSesion()
    qc.clear()
    setExpiro(false)
    setUsuario(null)
  }, [qc])

  const valor = useMemo(
    () => ({ usuario, esAdmin: usuario?.rol === 'ADMIN', iniciarSesion, cerrarSesion, expiro }),
    [usuario, iniciarSesion, cerrarSesion, expiro],
  )
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useAuth(): ContextoAuth {
  const c = useContext(Contexto)
  if (!c) throw new Error('useAuth fuera de AuthProvider')
  return c
}

/** Deja pasar solo con sesión iniciada; si no, manda al login y recuerda a dónde iba. */
export function RutaProtegida() {
  const { usuario } = useAuth()
  const ubicacion = useLocation()
  if (!usuario) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />
  return <Outlet />
}

export function SoloAdmin({ children }: { children: ReactNode }) {
  const { esAdmin } = useAuth()
  if (!esAdmin)
    return (
      <p role="alert" className="rounded border border-amber-300 bg-amber-50 p-3 text-amber-900">
        Esta sección es solo para administradores.
      </p>
    )
  return <>{children}</>
}
