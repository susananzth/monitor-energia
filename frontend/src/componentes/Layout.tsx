import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/Auth'
import { Logo } from './Logo'

const ENLACES = [
  ['/', 'Panel', '📊'],
  ['/en-vivo', 'En vivo', '📡'],
  ['/sesiones', 'Sesiones', '🗂️'],
  ['/comparar', 'Comparar', '📈'],
  ['/validacion', 'Validación', '✅'],
  ['/ayuda', 'Ayuda', '❓'],
] as const

const estiloEnlace = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
    isActive ? 'bg-acento-400 text-marca-950 shadow-sm' : 'text-marca-100 hover:bg-white/10 hover:text-white'
  }`

function Marca() {
  return (
    <NavLink to="/" className="flex items-center gap-3">
      <Logo />
      <span className="leading-tight">
        <span className="block font-bold text-white">Monitor de energía</span>
        <span className="block text-xs text-marca-200">Medición no invasiva</span>
      </span>
    </NavLink>
  )
}

/** Contenido del menú: el mismo en la barra lateral fija y en el panel móvil. */
function Menu() {
  const { usuario, esAdmin, cerrarSesion } = useAuth()
  const inicial = usuario?.nombre.trim().charAt(0).toUpperCase() ?? '?'
  return (
    <div className="flex h-full flex-col gap-6 px-4 py-5">
      <nav aria-label="Menú principal" className="flex flex-1 flex-col gap-1">
        {ENLACES.map(([ruta, texto, icono]) => (
          <NavLink key={ruta} to={ruta} end={ruta === '/'} className={estiloEnlace}>
            <span aria-hidden className="w-5 text-center">{icono}</span>
            {texto}
          </NavLink>
        ))}
        {esAdmin && (
          <NavLink to="/usuarios" className={estiloEnlace}>
            <span aria-hidden className="w-5 text-center">👥</span>
            Equipo
          </NavLink>
        )}
      </nav>
      <div className="space-y-2 border-t border-white/10 pt-4">
        <NavLink to="/cuenta" className={estiloEnlace} title="Mi cuenta">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-acento-500 text-xs font-bold text-marca-950">
            {inicial}
          </span>
          <span className="min-w-0">
            <span className="block truncate">{usuario?.nombre}</span>
            <span className="block text-xs font-normal opacity-75">{esAdmin ? 'Administrador' : 'Miembro'}</span>
          </span>
        </NavLink>
        <button
          onClick={cerrarSesion}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-marca-100 transition hover:bg-white/10 hover:text-white"
        >
          <span aria-hidden className="w-5 text-center">↩</span>
          Salir
        </button>
      </div>
    </div>
  )
}

const FONDO_MENU = 'bg-gradient-to-b from-marca-900 via-marca-800 to-marca-950'

export function Layout() {
  const [abierto, setAbierto] = useState(false)
  const ubicacion = useLocation()
  const botonAbrir = useRef<HTMLButtonElement>(null)
  const botonCerrar = useRef<HTMLButtonElement>(null)

  // Al navegar, el menú móvil se cierra.
  useEffect(() => setAbierto(false), [ubicacion.pathname])

  // Con el menú abierto: Esc lo cierra, el fondo no se desplaza y el foco va al botón de cerrar.
  useEffect(() => {
    if (!abierto) return
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false)
    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', alTeclear)
    botonCerrar.current?.focus()
    const abrir = botonAbrir.current
    return () => {
      document.body.style.overflow = overflowPrevio
      document.removeEventListener('keydown', alTeclear)
      abrir?.focus()
    }
  }, [abierto])

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Barra lateral fija (pantallas grandes) */}
      <aside className={`fixed inset-y-0 left-0 z-30 hidden w-64 flex-col ${FONDO_MENU} shadow-xl lg:flex`}>
        <div className="border-b border-white/10 px-4 py-4">
          <Marca />
        </div>
        <div className="flex-1 overflow-y-auto">
          <Menu />
        </div>
      </aside>

      {/* Barra superior (móvil) */}
      <header className={`sticky top-0 z-30 flex items-center justify-between ${FONDO_MENU} px-4 py-3 shadow-md lg:hidden`}>
        <Marca />
        <button
          ref={botonAbrir}
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          aria-expanded={abierto}
          aria-controls="menu-movil"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-acento-300"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </header>

      {/* Menú móvil: se superpone al contenido con un fondo oscurecido */}
      <div
        className={`fixed inset-0 z-40 bg-marca-950/50 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          abierto ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setAbierto(false)}
        aria-hidden
      />
      <div
        id="menu-movil"
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
        inert={!abierto}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col ${FONDO_MENU} shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          abierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <Marca />
          <button
            ref={botonCerrar}
            type="button"
            onClick={() => setAbierto(false)}
            aria-label="Cerrar menú"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-acento-300"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Menu />
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 lg:py-8">
        <Outlet />
      </main>
    </div>
  )
}
