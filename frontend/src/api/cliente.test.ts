import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { alExpirarSesion, api } from './cliente'
import { guardarSesion, leerSesion } from './sesion'

const sesion = () =>
  guardarSesion({
    token: 'tok-123',
    expira_en: new Date(Date.now() + 3_600_000).toISOString(),
    usuario: { id: 1, usuario: 'ana', nombre: 'Ana', rol: 'MIEMBRO' },
  })

const respuesta = (estado: number, cuerpo?: unknown) =>
  new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status: estado })

describe('cliente de la API con sesión', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => {
    vi.unstubAllGlobals()
    alExpirarSesion(null)
  })

  it('envía el token en Authorization', async () => {
    sesion()
    const fetchFalso = vi.fn().mockResolvedValue(respuesta(200, { content: [] }))
    vi.stubGlobal('fetch', fetchFalso)
    await api.listarSesiones()
    expect(fetchFalso.mock.calls[0][1].headers.Authorization).toBe('Bearer tok-123')
  })

  it('sin sesión no envía Authorization', async () => {
    const fetchFalso = vi.fn().mockResolvedValue(respuesta(200, { content: [] }))
    vi.stubGlobal('fetch', fetchFalso)
    await api.listarSesiones()
    expect(fetchFalso.mock.calls[0][1].headers.Authorization).toBeUndefined()
  })

  it('si el servidor rechaza el token, borra la sesión y avisa', async () => {
    sesion()
    const aviso = vi.fn()
    alExpirarSesion(aviso)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(401, { detail: 'Inicia sesión para continuar.' })))
    await expect(api.listarSesiones()).rejects.toThrow('Tu sesión terminó')
    expect(leerSesion()).toBeNull()
    expect(aviso).toHaveBeenCalledOnce()
  })

  it('un login fallido muestra el mensaje del servidor', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(401, { detail: 'Usuario o contraseña incorrectos' })))
    await expect(api.login('ana', 'mala')).rejects.toThrow('Usuario o contraseña incorrectos')
  })

  it('una sesión vencida no se usa', () => {
    guardarSesion({ token: 'x', expira_en: new Date(Date.now() - 1000).toISOString(), usuario: { id: 1, usuario: 'a', nombre: 'A', rol: 'ADMIN' } })
    expect(leerSesion()).toBeNull()
  })
})
