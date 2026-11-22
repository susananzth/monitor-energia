import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/cliente'
import type { DispositivoCreado, Rol, Usuario } from '../api/tipos'
import { EstadoCarga } from '../componentes/EstadoCarga'
import { useAuth } from '../auth/Auth'
import { Ayuda, EncabezadoPagina } from '../componentes/Ayuda'
import { formatoFecha } from '../utilidades/formato'

const TEXTO_ROL: Record<Rol, string> = { ADMIN: 'Administrador', MIEMBRO: 'Miembro' }

function FormularioUsuario() {
  const qc = useQueryClient()
  const [usuario, setUsuario] = useState('')
  const [nombre, setNombre] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState<Rol>('MIEMBRO')
  const crear = useMutation({
    mutationFn: () => api.crearUsuario({ usuario: usuario.trim(), nombre: nombre.trim(), password, rol }),
    onSuccess: () => {
      setUsuario('')
      setNombre('')
      setPassword('')
      setRol('MIEMBRO')
      qc.invalidateQueries({ queryKey: ['usuarios'] })
    },
  })
  const enviar = (e: FormEvent) => {
    e.preventDefault()
    crear.mutate()
  }
  return (
    <form onSubmit={enviar} className="grid gap-3 tarjeta sm:grid-cols-4">
      <h3 className="font-semibold sm:col-span-4">Agregar una persona al equipo</h3>
      <label className="etiqueta">
        Nombre
        <input className="campo" value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={100} placeholder="Ana Pérez" />
      </label>
      <label className="etiqueta">
        Usuario
        <input
          className="campo"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          required
          minLength={3}
          maxLength={50}
          pattern="[A-Za-z0-9._\-]+"
          title="Letras, números, punto, guion o guion bajo"
          autoCapitalize="none"
          placeholder="ana.perez"
        />
      </label>
      <label className="etiqueta">
        Contraseña inicial
        <input className="campo" type="text" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" placeholder="mínimo 8 caracteres" />
      </label>
      <label className="etiqueta">
        Rol
        <Ayuda texto="Administrador: gestiona cuentas y medidores. Miembro: hace mediciones y consulta datos." />
        <select className="campo" value={rol} onChange={(e) => setRol(e.target.value as Rol)}>
          <option value="MIEMBRO">Miembro</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-4">
        <button disabled={crear.isPending} className="btn-primario">
          Crear cuenta
        </button>
        {crear.isSuccess && <span className="text-sm text-green-700">Cuenta creada. Comparte el usuario y la contraseña inicial con esa persona.</span>}
        {crear.error && <span role="alert" className="text-sm text-red-700">{crear.error.message}</span>}
      </div>
    </form>
  )
}

function FilaUsuario({ u, soyYo }: { u: Usuario; soyYo: boolean }) {
  const qc = useQueryClient()
  const [nuevaClave, setNuevaClave] = useState<string | null>(null)
  const actualizar = useMutation({
    mutationFn: (c: Parameters<typeof api.actualizarUsuario>[1]) => api.actualizarUsuario(u.id, c),
    onSuccess: () => {
      setNuevaClave(null)
      qc.invalidateQueries({ queryKey: ['usuarios'] })
    },
  })
  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-slate-800">
            {u.nombre} {soyYo && <span className="text-xs text-slate-500">(tú)</span>}
          </p>
          <p className="text-sm text-slate-500">
            @{u.usuario} · {TEXTO_ROL[u.rol]} · desde {formatoFecha(u.creado_en)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.activo ? 'bg-green-100 text-green-900' : 'bg-slate-200 text-slate-700'}`}>
            {u.activo ? '● Activa' : '○ Desactivada'}
          </span>
          {!soyYo && (
            <>
              <button
                className="btn-secundario"
                onClick={() => actualizar.mutate({ rol: u.rol === 'ADMIN' ? 'MIEMBRO' : 'ADMIN' })}
              >
                {u.rol === 'ADMIN' ? 'Hacer miembro' : 'Hacer admin'}
              </button>
              <button
                className="btn-secundario"
                onClick={() => {
                  if (!u.activo || confirm(`¿Desactivar la cuenta de ${u.nombre}? Se cerrarán sus sesiones abiertas.`))
                    actualizar.mutate({ activo: !u.activo })
                }}
              >
                {u.activo ? 'Desactivar' : 'Activar'}
              </button>
            </>
          )}
          <button className="btn-secundario" onClick={() => setNuevaClave(nuevaClave === null ? '' : null)}>
            Restablecer contraseña
          </button>
        </div>
      </div>
      {nuevaClave !== null && (
        <form
          className="mt-2 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            actualizar.mutate({ password: nuevaClave })
          }}
        >
          <input className="campo mt-0 w-auto py-1 text-sm" value={nuevaClave} onChange={(e) => setNuevaClave(e.target.value)} minLength={8} required placeholder="nueva contraseña (mín. 8)" autoComplete="new-password" />
          <button className="btn-primario px-3 py-1 text-sm">Guardar</button>
          <span className="text-xs text-slate-500">Se cerrarán sus sesiones abiertas.</span>
        </form>
      )}
      {actualizar.error && <p role="alert" className="mt-1 text-sm text-red-700">{actualizar.error.message}</p>}
    </li>
  )
}

function RegistrarDispositivo() {
  const [nombre, setNombre] = useState('')
  const [creado, setCreado] = useState<DispositivoCreado | null>(null)
  const registrar = useMutation({
    mutationFn: () => api.registrarDispositivo(nombre.trim()),
    onSuccess: (d) => {
      setCreado(d)
      setNombre('')
    },
  })
  return (
    <section className="space-y-3 tarjeta">
      <h3 className="font-semibold">Registrar un dispositivo (ESP32)</h3>
      <p className="text-sm text-slate-500">
        Genera el <strong>ID</strong> y la <strong>API key</strong> que van en <code>secrets.h</code> del firmware. La clave se muestra una sola vez.
      </p>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          registrar.mutate()
        }}
      >
        <input className="campo mt-0 flex-1" value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={100} placeholder="esp32-laboratorio" />
        <button disabled={registrar.isPending} className="btn-primario">
          Registrar
        </button>
      </form>
      {registrar.error && <p role="alert" className="text-sm text-red-700">{registrar.error.message}</p>}
      {creado && (
        <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
          <p className="font-medium text-amber-900">Copia estos datos ahora: la API key no se vuelve a mostrar.</p>
          <pre className="mt-2 overflow-x-auto rounded bg-white p-2 text-xs">
{`#define DEVICE_ID ${creado.id}
#define DEVICE_API_KEY "${creado.api_key}"`}
          </pre>
          <button className="mt-2 rounded border bg-white px-2 py-1 text-xs" onClick={() => navigator.clipboard?.writeText(`#define DEVICE_ID ${creado.id}\n#define DEVICE_API_KEY "${creado.api_key}"`)}>
            Copiar
          </button>
        </div>
      )}
    </section>
  )
}

export function Usuarios() {
  const { usuario } = useAuth()
  const lista = useQuery({ queryKey: ['usuarios'], queryFn: api.usuarios })
  return (
    <div className="space-y-4">
      <EncabezadoPagina titulo="Equipo" descripcion="Crea las cuentas de tu equipo y registra los medidores (ESP32)." />
      <FormularioUsuario />
      <section className="tarjeta">
        <h3 className="font-semibold">Cuentas</h3>
        <p className="text-sm text-slate-500">Los administradores gestionan cuentas y dispositivos; los miembros miden y consultan.</p>
        <EstadoCarga cargando={lista.isLoading} error={lista.error}>
          <ul className="divide-y">
            {(lista.data ?? []).map((u) => (
              <FilaUsuario key={u.id} u={u} soyYo={u.id === usuario?.id} />
            ))}
          </ul>
        </EstadoCarga>
      </section>
      <RegistrarDispositivo />
    </div>
  )
}
