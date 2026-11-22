import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AuthProvider } from '../auth/Auth'
import { guardarSesion } from '../api/sesion'
import { Layout } from './Layout'

function montar() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<p>Inicio</p>} />
              <Route path="ayuda" element={<p>Página de ayuda</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

const botonMenu = () => screen.getByRole('button', { name: 'Abrir menú' })

describe('menú móvil', () => {
  beforeEach(() => {
    localStorage.clear()
    guardarSesion({
      token: 't',
      expira_en: new Date(Date.now() + 3_600_000).toISOString(),
      usuario: { id: 1, usuario: 'ana', nombre: 'Ana', rol: 'MIEMBRO' },
    })
  })

  it('abre con el botón y se cierra con Esc', async () => {
    montar()
    expect(botonMenu()).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(botonMenu())
    expect(botonMenu()).toHaveAttribute('aria-expanded', 'true')
    expect(document.body.style.overflow).toBe('hidden')
    await userEvent.keyboard('{Escape}')
    expect(botonMenu()).toHaveAttribute('aria-expanded', 'false')
    expect(document.body.style.overflow).toBe('')
  })

  it('se cierra al elegir una opción', async () => {
    montar()
    await userEvent.click(botonMenu())
    const menu = screen.getByRole('dialog', { name: 'Menú' })
    await userEvent.click(menu.querySelector('a[href="/ayuda"]')!)
    expect(await screen.findByText('Página de ayuda')).toBeInTheDocument()
    expect(botonMenu()).toHaveAttribute('aria-expanded', 'false')
  })

  it('un miembro no ve la opción Equipo', () => {
    montar()
    expect(screen.queryByText('Equipo')).toBeNull()
  })
})
