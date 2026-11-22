import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/Auth'

const ENLACES = [
  ['/', 'Panel'],
  ['/en-vivo', 'En vivo'],
  ['/sesiones', 'Sesiones'],
  ['/comparar', 'Comparar'],
  ['/validacion', 'Validación'],
  ['/acerca', 'Acerca de'],
] as const

const estiloEnlace = ({ isActive }: { isActive: boolean }) =>
  `rounded px-3 py-1 text-sm ${isActive ? 'bg-sky-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`

export function Layout() {
  const { usuario, esAdmin, cerrarSesion } = useAuth()
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-lg font-bold">⚡ Monitor de energía</h1>
            <div className="flex items-center gap-2 text-sm lg:hidden">
              <NavLink to="/cuenta" className="text-slate-600 hover:underline">{usuario?.nombre}</NavLink>
              <button onClick={cerrarSesion} className="rounded border px-2 py-1 hover:bg-slate-50">Salir</button>
            </div>
          </div>
          <nav className="flex flex-wrap gap-1">
            {ENLACES.map(([ruta, texto]) => (
              <NavLink key={ruta} to={ruta} end={ruta === '/'} className={estiloEnlace}>
                {texto}
              </NavLink>
            ))}
            {esAdmin && (
              <NavLink to="/usuarios" className={estiloEnlace}>
                Equipo
              </NavLink>
            )}
          </nav>
          <div className="hidden items-center gap-2 text-sm lg:flex">
            <NavLink to="/cuenta" className="text-slate-600 hover:underline" title="Mi cuenta">
              👤 {usuario?.nombre}
            </NavLink>
            <button onClick={cerrarSesion} className="rounded border px-2 py-1 hover:bg-slate-50">
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
