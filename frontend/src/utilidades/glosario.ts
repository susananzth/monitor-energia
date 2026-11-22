/** Explicaciones cortas, en lenguaje simple, de los términos que aparecen en la plataforma. */
export const GLOSARIO = {
  irms: {
    termino: 'Corriente (Irms)',
    texto: 'Cuánta electricidad pasa por el cable, en amperios (A). Es lo único que mide el sensor directamente.',
  },
  potencia: {
    termino: 'Potencia',
    texto: 'Qué tan rápido consume energía el aparato, en vatios (W). Un foco gasta unos 100 W; un hervidor, unos 2000 W.',
  },
  energia: {
    termino: 'Energía',
    texto: 'Lo consumido en total durante la medición. Se mide en Wh o kWh, la misma unidad de tu recibo de luz.',
  },
  estimado: {
    termino: 'Estimado',
    texto: 'Se calcula a partir de la corriente suponiendo 220 V. Es una buena aproximación, no una medida exacta.',
  },
  sesion: {
    termino: 'Sesión',
    texto: 'Una medición de un aparato, desde que la inicias hasta que la finalizas.',
  },
  carga: {
    termino: 'Carga declarada',
    texto: 'El aparato que vas a medir. Escríbelo con su potencia si la sabes, por ejemplo "Hervidor 2000 W".',
  },
  dispositivo: {
    termino: 'Dispositivo',
    texto: 'El número del medidor (ESP32) que enviará los datos. Si tu equipo tiene uno solo, déjalo en 1.',
  },
  vref: {
    termino: 'Voltaje de referencia',
    texto: 'El voltaje de los enchufes de tu país. En Perú es 220 V. Si no lo sabes, déjalo así.',
  },
  perdida: {
    termino: 'Pérdida de lecturas',
    texto: 'Lecturas que no llegaron (por ejemplo, por cortes de Wi-Fi). Menos de 5 % es normal.',
  },
  pinza: {
    termino: 'Pinza amperimétrica',
    texto: 'Un instrumento comercial que mide la corriente al abrazar un cable. Sirve para comprobar que este sistema mide bien.',
  },
  error: {
    termino: 'Error %',
    texto: 'Cuánto se diferencia nuestra medición de la pinza. Hasta 5 % se considera preciso.',
  },
} as const

export type Termino = keyof typeof GLOSARIO
