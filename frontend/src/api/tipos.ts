// Tipos de la API (JSON en snake_case). i_rms es MEDIDO; p_est y energía son ESTIMADOS.
export interface Sesion {
  id: number
  dispositivo_id: number
  carga_declarada: string
  v_ref: number
  factor_potencia_supuesto: number
  inicio: string
  fin: string | null
  activa: boolean
  n_lecturas: number
  i_rms_promedio: number
  i_rms_max: number
  energia_estimada_kwh: number
  porcentaje_perdida: number
}

export interface Pagina<T> {
  content: T[]
  total_elements: number
  total_pages: number
  number: number
}

export interface Lectura {
  id: number
  sesion_id: number
  timestamp: string
  i_rms: number
  p_est: number
  intervalo_s: number
  energia_acumulada_kwh: number
  secuencia: number
}

export interface NuevaSesion {
  dispositivo_id: number
  carga_declarada: string
  v_ref?: number
  factor_potencia_supuesto?: number
  notas?: string
}

export interface Referencia {
  id: number
  timestamp: string
  i_pinza: number
  i_prototipo: number
  diferencia_abs: number
  diferencia_pct: number
}

export interface Validacion {
  filas: Referencia[]
  error_medio_absoluto_a: number
  error_medio_porcentual: number
}

export type Rol = 'ADMIN' | 'MIEMBRO'

export interface UsuarioSesion {
  id: number
  usuario: string
  nombre: string
  rol: Rol
}

export interface Usuario extends UsuarioSesion {
  activo: boolean
  creado_en: string
}

export interface LoginRespuesta {
  token: string
  expira_en: string
  usuario: Usuario
}

export interface NuevoUsuario {
  usuario: string
  nombre: string
  password: string
  rol: Rol
}

export interface CambiosUsuario {
  nombre?: string
  rol?: Rol
  activo?: boolean
  password?: string
}

export interface DispositivoCreado {
  id: number
  nombre: string
  creado_en: string
  api_key: string
}
