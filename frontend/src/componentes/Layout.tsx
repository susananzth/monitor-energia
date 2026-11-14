import { NavLink, Outlet } from 'react-router-dom'

const ENLACES = [
  ['/', 'En vivo'],
  ['/sesiones', 'Sesiones'],
  ['/comparar', 'Comparar'],
  ['/validacion', 'Validación'],
  ['/acerca', 'Acerca de'],
] as const

export function Layout() {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-lg font-bold">⚡ Monitor de energía</h1>
          <nav className="flex flex-wrap gap-1">
            {ENLACES.map(([ruta, texto]) => (
              <NavLink
                key={ruta}
                to={ruta}
                end={ruta === '/'}
                className={({ isActive }) =>
                  `rounded px-3 py-1 text-sm ${isActive ? 'bg-sky-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`
                }
              >
                {texto}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
