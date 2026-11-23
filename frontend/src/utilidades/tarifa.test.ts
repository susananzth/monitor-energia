import { beforeEach, describe, expect, it } from 'vitest'
import { costo, costoMensual, formatoDinero, guardarTarifa, leerTarifa, tarifaValida } from './tarifa'

const t = { precioKwh: 0.8, moneda: 'S/' }

describe('tarifa', () => {
  beforeEach(() => localStorage.clear())

  it('calcula el costo de la energía', () => {
    expect(costo(2, t)).toBeCloseTo(1.6)
  })

  it('proyecta el costo mensual: 1000 W, 1 h al día, 30 días = 30 kWh', () => {
    expect(costoMensual(1000, 1, t)).toBeCloseTo(24)
  })

  it('muestra céntimos pequeños sin redondear a cero', () => {
    expect(formatoDinero(1.234, t)).toBe('S/ 1.23')
    expect(formatoDinero(0.0016, t)).toBe('S/ 0.0016')
    expect(formatoDinero(0, t)).toBe('S/ 0.00')
  })

  it('rechaza precios vacíos, negativos o absurdos', () => {
    expect(tarifaValida({ precioKwh: 0, moneda: 'S/' })).toBe(false)
    expect(tarifaValida({ precioKwh: -1, moneda: 'S/' })).toBe(false)
    expect(tarifaValida({ precioKwh: Number.NaN, moneda: 'S/' })).toBe(false)
    expect(tarifaValida(t)).toBe(true)
  })

  it('guarda una tarifa distinta por usuario', () => {
    guardarTarifa(1, t)
    expect(leerTarifa(1)).toEqual(t)
    expect(leerTarifa(2)).toBeNull()
    guardarTarifa(1, null)
    expect(leerTarifa(1)).toBeNull()
  })
})
