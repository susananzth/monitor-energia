import { Route, Routes } from 'react-router-dom'
import { Layout } from './componentes/Layout'
import { EnVivo } from './paginas/EnVivo'
import { Sesiones } from './paginas/Sesiones'
import { DetalleSesion } from './paginas/DetalleSesion'
import { Comparar } from './paginas/Comparar'
import { Validacion } from './paginas/Validacion'
import { Acerca } from './paginas/Acerca'

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<EnVivo />} />
        <Route path="sesiones" element={<Sesiones />} />
        <Route path="sesiones/:id" element={<DetalleSesion />} />
        <Route path="comparar" element={<Comparar />} />
        <Route path="validacion" element={<Validacion />} />
        <Route path="acerca" element={<Acerca />} />
      </Route>
    </Routes>
  )
}
