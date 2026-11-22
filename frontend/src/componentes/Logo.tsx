/** Logo del sistema (public/logo.png). Va sobre una placa blanca porque la imagen tiene fondo blanco. */
export function Logo({ tamano = 'md' }: { tamano?: 'md' | 'lg' }) {
  const caja = tamano === 'lg' ? 'h-20 w-20 rounded-2xl p-1.5' : 'h-10 w-10 rounded-xl p-0.5'
  return (
    <span className={`inline-flex ${caja} items-center justify-center bg-white shadow-md`}>
      <img src="/logo.png" alt="" className="h-full w-full object-contain" />
    </span>
  )
}
