import type { Lectura, NuevaSesion, Pagina, Sesion, Validacion } from './tipos'

export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1'

export class ErrorApi extends Error {
  constructor(public estado: number, mensaje: string) {
    super(mensaje)
  }
}

async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
  let r: Response
  try {
    r = await fetch(`${API_URL}${ruta}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
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
    throw new ErrorApi(r.status, detalle)
  }
  return (await r.json()) as T
}

export const api = {
  listarSesiones: (pagina = 0, tamano = 50) =>
    pedir<Pagina<Sesion>>(`/sesiones?pagina=${pagina}&tamano=${tamano}`),
  sesion: (id: number) => pedir<Sesion>(`/sesiones/${id}`),
  lecturas: (id: number, desde?: string) =>
    pedir<Lectura[]>(`/sesiones/${id}/lecturas${desde ? `?desde=${encodeURIComponent(desde)}` : ''}`),
  ultima: (id: number) => pedir<Lectura>(`/sesiones/${id}/ultima`),
  crearSesion: (datos: NuevaSesion) =>
    pedir<unknown>('/sesiones', { method: 'POST', body: JSON.stringify(datos) }),
  finalizar: (id: number) => pedir<unknown>(`/sesiones/${id}/finalizar`, { method: 'PATCH' }),
  validacion: (id: number) => pedir<Validacion>(`/sesiones/${id}/validacion`),
  agregarReferencia: (id: number, i_pinza: number) =>
    pedir<unknown>(`/sesiones/${id}/referencias`, { method: 'POST', body: JSON.stringify({ i_pinza }) }),
  urlCsv: (id: number) => `${API_URL}/sesiones/${id}/export.csv`,
}
