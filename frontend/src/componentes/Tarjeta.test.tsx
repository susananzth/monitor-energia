import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Tarjeta } from './Tarjeta'

describe('Tarjeta', () => {
  it('marca lo estimado y explica el supuesto', () => {
    render(<Tarjeta titulo="Potencia" valor="100 W" tipo="estimado" />)
    const etiqueta = screen.getByText('estimado')
    expect(etiqueta).toHaveAttribute('title', expect.stringContaining('220 V'))
    expect(screen.getByText('100 W')).toBeInTheDocument()
  })
  it('marca lo medido', () => {
    render(<Tarjeta titulo="Irms" valor="0.450 A" tipo="medido" detalle="detalle" />)
    expect(screen.getByText('medido')).toBeInTheDocument()
    expect(screen.queryByText('estimado')).toBeNull()
    expect(screen.getByText('detalle')).toBeInTheDocument()
  })
})
