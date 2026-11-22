import type { UsuarioSesion } from './tipos'

/** Sesión del usuario guardada en el navegador (token opaco emitido por el backend). */
export interface SesionGuardada {
  token: string
  expira_en: string
  usuario: UsuarioSesion
}

const CLAVE = 'monitor-energia.sesion'

export function leerSesion(): SesionGuardada | null {
  try {
    const crudo = localStorage.getItem(CLAVE)
    if (!crudo) return null
    const s = JSON.parse(crudo) as SesionGuardada
    if (!s.token || new Date(s.expira_en).getTime() <= Date.now()) {
      localStorage.removeItem(CLAVE)
      return null
    }
    return s
  } catch {
    return null
  }
}

export function guardarSesion(s: SesionGuardada): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(s))
  } catch {
    /* sin almacenamiento: la sesión dura lo que la pestaña */
  }
}

export function borrarSesion(): void {
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    /* nada que borrar */
  }
}
