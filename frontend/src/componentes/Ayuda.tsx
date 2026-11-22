import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { GLOSARIO, type Termino } from '../utilidades/glosario'

/** Botón "?" que muestra una explicación corta al pasar el mouse, enfocar o tocar. */
export function Ayuda({ termino, texto }: { termino?: Termino; texto?: string }) {
  const [abierta, setAbierta] = useState(false)
  const id = useId()
  const caja = useRef<HTMLSpanElement>(null)
  const contenido = texto ?? (termino ? GLOSARIO[termino].texto : '')
  const nombre = termino ? GLOSARIO[termino].termino : 'este dato'

  useEffect(() => {
    if (!abierta) return
    const cerrar = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !caja.current?.contains(e.target as Node)) setAbierta(false)
    }
    document.addEventListener('mousedown', cerrar)
    document.addEventListener('keydown', cerrar)
    return () => {
      document.removeEventListener('mousedown', cerrar)
      document.removeEventListener('keydown', cerrar)
    }
  }, [abierta])

  return (
    <span ref={caja} className="relative inline-flex align-middle" onMouseLeave={() => setAbierta(false)}>
      <button
        type="button"
        aria-label={`¿Qué es ${nombre.toLowerCase()}?`}
        aria-describedby={abierta ? id : undefined}
        onClick={() => setAbierta((v) => !v)}
        onMouseEnter={() => setAbierta(true)}
        onFocus={() => setAbierta(true)}
        onBlur={() => setAbierta(false)}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-marca-100 text-[10px] font-bold text-marca-700 transition hover:bg-marca-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-marca-400"
      >
        ?
      </button>
      {abierta && (
        <span
          id={id}
          role="tooltip"
          className="absolute left-1/2 top-6 z-20 w-60 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-slate-100 shadow-lg"
        >
          {contenido}
        </span>
      )}
    </span>
  )
}

const CLAVE = 'monitor-energia.guias-cerradas'

function guiasCerradas(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) ?? '[]') as string[]
  } catch {
    return []
  }
}

/** Pasos cortos de "cómo se usa esta pantalla". Se cierra con "Entendido" y queda un botón para volver a verla. */
export function GuiaPagina({ id, pasos }: { id: string; pasos: ReactNode[] }) {
  const [abierta, setAbierta] = useState(() => !guiasCerradas().includes(id))

  const cambiar = (abrir: boolean) => {
    setAbierta(abrir)
    try {
      const resto = guiasCerradas().filter((x) => x !== id)
      localStorage.setItem(CLAVE, JSON.stringify(abrir ? resto : [...resto, id]))
    } catch {
      /* sin almacenamiento: solo dura esta visita */
    }
  }

  if (!abierta)
    return (
      <button type="button" onClick={() => cambiar(true)} className="text-sm font-medium text-marca-700 hover:underline">
        💡 ¿Cómo se usa esta pantalla?
      </button>
    )

  return (
    <aside className="rounded-2xl border border-marca-100 bg-gradient-to-r from-marca-50 to-acento-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-marca-950">💡 Cómo se usa</p>
        <button type="button" onClick={() => cambiar(false)} className="rounded-md px-2 py-0.5 text-sm font-medium text-marca-700 hover:bg-white/70">
          Entendido
        </button>
      </div>
      <ol className="mt-2 space-y-1.5 text-sm text-slate-700">
        {pasos.map((p, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-marca-600 text-xs font-bold text-white">
              {i + 1}
            </span>
            <span>{p}</span>
          </li>
        ))}
      </ol>
    </aside>
  )
}

/** Título de la pantalla con una línea que explica para qué sirve. */
export function EncabezadoPagina({ titulo, descripcion, accion }: { titulo: ReactNode; descripcion: ReactNode; accion?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{titulo}</h2>
        <p className="mt-0.5 text-slate-500">{descripcion}</p>
      </div>
      {accion}
    </div>
  )
}
