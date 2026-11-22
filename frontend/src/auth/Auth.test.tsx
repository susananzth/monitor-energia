import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, RutaProtegida } from './Auth'
import { Login } from '../paginas/Login'
import { leerSesion } from '../api/sesion'

function montar(ruta: string) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>
        <MemoryRouter initialEntries={[ruta]}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<RutaProtegida />}>
              <Route path="/sesiones" element={<p>Pantalla de sesiones</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

describe('login y rutas protegidas', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.unstubAllGlobals())

  it('sin sesión manda al login y, al entrar, vuelve a donde iba', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            token: 'tok',
            expira_en: new Date(Date.now() + 3_600_000).toISOString(),
            usuario: { id: 1, usuario: 'ana', nombre: 'Ana', rol: 'MIEMBRO', activo: true, creado_en: '' },
          }),
          { status: 200 },
        ),
      ),
    )
    montar('/sesiones')
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Usuario'), 'ana')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'clave-secreta')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Pantalla de sesiones')).toBeInTheDocument()
    expect(leerSesion()?.token).toBe('tok')
  })

  it('muestra el error si la contraseña es incorrecta', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: 'Usuario o contraseña incorrectos' }), { status: 401 })),
    )
    montar('/login')
    await userEvent.type(screen.getByLabelText('Usuario'), 'ana')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'mala')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Usuario o contraseña incorrectos')
  })
})
