import { describe, expect, it } from 'vitest'
import { duracionSesion, formatoCorriente, formatoDuracion, formatoEnergia, formatoPotencia, segundosSinDatos } from './formato'

describe('formato', () => {
  it('corriente con 3 decimales', () => expect(formatoCorriente(0.4567)).toBe('0.457 A'))
  it('potencia en W o kW', () => {
    expect(formatoPotencia(99.94)).toBe('99.9 W')
    expect(formatoPotencia(1500)).toBe('1.50 kW')
  })
  it('energía en Wh o kWh', () => {
    expect(formatoEnergia(0.00278)).toBe('2.78 Wh')
    expect(formatoEnergia(1.2345)).toBe('1.234 kWh')
  })
  it('duración legible', () => {
    expect(formatoDuracion(45)).toBe('45 s')
    expect(formatoDuracion(125)).toBe('2 min 5 s')
    expect(formatoDuracion(3900)).toBe('1 h 5 min')
  })
  it('duración de sesión activa usa la hora actual', () => {
    expect(duracionSesion('2026-01-01T00:00:00Z', null, Date.parse('2026-01-01T00:01:00Z'))).toBe(60)
  })
  it('segundos sin datos', () => {
    expect(segundosSinDatos(undefined)).toBeNull()
    expect(segundosSinDatos('2026-01-01T00:00:00Z', Date.parse('2026-01-01T00:00:20Z'))).toBe(20)
  })
})
