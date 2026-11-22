import { describe, expect, it } from 'vitest'
import type { Sesion } from '../api/tipos'
import { equivalencia, nivelConsumo, potenciaPromedio, resumenHistorico, tiempoMedido } from './panel'

const sesion = (p: Partial<Sesion>): Sesion => ({
  id: 1,
  dispositivo_id: 1,
  carga_declarada: 'Foco',
  v_ref: 220,
  factor_potencia_supuesto: 1,
  inicio: '2026-01-01T00:00:00Z',
  fin: '2026-01-01T00:05:00Z',
  activa: false,
  n_lecturas: 60,
  i_rms_promedio: 0.45,
  i_rms_max: 0.5,
  energia_estimada_kwh: 0.01,
  porcentaje_perdida: 0,
  ...p,
})

describe('panel', () => {
  it('nivel de consumo por tramos', () => {
    expect(nivelConsumo(99)).toBe('bajo')
    expect(nivelConsumo(1200)).toBe('medio')
    expect(nivelConsumo(2000)).toBe('alto')
  })
  it('equivalencia con aparatos', () => {
    expect(equivalencia(0)).toMatch(/apagado/)
    expect(equivalencia(99)).toMatch(/foco incandescente/)
    expect(equivalencia(2000)).toMatch(/hervidor/)
    expect(equivalencia(5000)).toMatch(/varios equipos/)
  })
  it('potencia promedio con los supuestos de la sesión', () => {
    expect(potenciaPromedio(sesion({}))).toBeCloseTo(99)
  })
  it('tiempo medido cubre las lecturas aunque la sesión dure menos', () => {
    expect(tiempoMedido(sesion({ fin: '2026-01-01T00:00:01Z' }))).toBe(300)
  })
  it('resumen histórico suma sesiones', () => {
    const r = resumenHistorico([sesion({}), sesion({ id: 2, i_rms_max: 7, energia_estimada_kwh: 0.2 })])
    expect(r.sesiones).toBe(2)
    expect(r.segundosMedidos).toBe(600)
    expect(r.energiaKwh).toBeCloseTo(0.21)
    expect(r.iMax).toBe(7)
    expect(r.lecturas).toBe(120)
  })
})
