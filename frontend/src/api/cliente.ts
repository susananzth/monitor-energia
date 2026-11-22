import type {
  CambiosUsuario,
  DispositivoCreado,
  Lectura,
  LoginRespuesta,
  NuevaSesion,
  NuevoUsuario,
  Pagina,
  Sesion,
  Usuario,
  UsuarioSesion,
  Validacion,
} from './tipos'
import { borrarSesion, leerSesion } from './sesion'

export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1'

export class ErrorApi extends Error {
  constructor(public estado: number, mensaje: string) {
    super(mensaje)
  }
}

let alExpirar: (() => void) | null = null

/** Se llama cuando el backend rechaza el token (venció, se cerró o se desactivó la cuenta). */
export function alExpirarSesion(fn: (() => void) | null): void {
  alExpirar = fn
}

async function solicitar(ruta: string, init?: RequestInit): Promise<Response> {
  const token = leerSesion()?.token
  let r: Response
  try {
    r = await fetch(`${API_URL}${ruta}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    })
  } catch {
    throw new ErrorApi(0, 'No se pudo conectar con el servidor.')
  }
  if (!r.ok) {
    let detalle = `Error ${r.status}`
    try {
      const p = await r.json()
      detalle = p.detail ?? p.title ?? detalle
    } catch {
      /* sin cuerpo JSON */
    }
    if (r.status === 401 && token) {
      borrarSesion()
      alExpirar?.()
      detalle = 'Tu sesión terminó. Vuelve a iniciar sesión.'
    }
    throw new ErrorApi(r.status, detalle)
  }
  return r
}

async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
  const r = await solicitar(ruta, init)
  if (r.status === 204) return undefined as T
  return (await r.json()) as T
}

const json = (metodo: string, cuerpo?: unknown): RequestInit => ({
  method: metodo,
  body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
})

export const api = {
  // Autenticación
  login: (usuario: string, password: string) => pedir<LoginRespuesta>('/auth/login', json('POST', { usuario, password })),
  yo: () => pedir<UsuarioSesion>('/auth/yo'),
  logout: () => pedir<void>('/auth/logout', json('POST')),
  cambiarPassword: (actual: string, nueva: string) => pedir<void>('/auth/password', json('PATCH', { actual, nueva })),

  // Usuarios y dispositivos (solo admin)
  usuarios: () => pedir<Usuario[]>('/usuarios'),
  crearUsuario: (datos: NuevoUsuario) => pedir<Usuario>('/usuarios', json('POST', datos)),
  actualizarUsuario: (id: number, cambios: CambiosUsuario) => pedir<Usuario>(`/usuarios/${id}`, json('PATCH', cambios)),
  registrarDispositivo: (nombre: string) => pedir<DispositivoCreado>('/dispositivos', json('POST', { nombre })),

  // Mediciones
  listarSesiones: (pagina = 0, tamano = 50) =>
    pedir<Pagina<Sesion>>(`/sesiones?pagina=${pagina}&tamano=${tamano}`),
  sesion: (id: number) => pedir<Sesion>(`/sesiones/${id}`),
  lecturas: (id: number, desde?: string) =>
    pedir<Lectura[]>(`/sesiones/${id}/lecturas${desde ? `?desde=${encodeURIComponent(desde)}` : ''}`),
  ultima: (id: number) => pedir<Lectura>(`/sesiones/${id}/ultima`),
  crearSesion: (datos: NuevaSesion) => pedir<unknown>('/sesiones', json('POST', datos)),
  finalizar: (id: number) => pedir<unknown>(`/sesiones/${id}/finalizar`, json('PATCH')),
  validacion: (id: number) => pedir<Validacion>(`/sesiones/${id}/validacion`),
  agregarReferencia: (id: number, i_pinza: number) =>
    pedir<unknown>(`/sesiones/${id}/referencias`, json('POST', { i_pinza })),

  /** Descarga el CSV con el token (un enlace directo no enviaría el encabezado Authorization). */
  descargarCsv: async (id: number) => {
    const r = await solicitar(`/sesiones/${id}/export.csv`, { headers: { Accept: 'text/csv' } })
    const url = URL.createObjectURL(await r.blob())
    const a = document.createElement('a')
    a.href = url
    a.download = `sesion-${id}.csv`
    a.click()
    URL.revokeObjectURL(url)
  },
}
