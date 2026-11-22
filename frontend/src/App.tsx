import { Route, Routes } from 'react-router-dom'
import { Layout } from './componentes/Layout'
import { RutaProtegida, SoloAdmin } from './auth/Auth'
import { Login } from './paginas/Login'
import { Panel } from './paginas/Panel'
import { EnVivo } from './paginas/EnVivo'
import { Sesiones } from './paginas/Sesiones'
import { DetalleSesion } from './paginas/DetalleSesion'
import { Comparar } from './paginas/Comparar'
import { Validacion } from './paginas/Validacion'
import { Acerca } from './paginas/Acerca'
import { Usuarios } from './paginas/Usuarios'
import { MiCuenta } from './paginas/MiCuenta'

export function App() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route element={<RutaProtegida />}>
        <Route element={<Layout />}>
          <Route index element={<Panel />} />
          <Route path="en-vivo" element={<EnVivo />} />
          <Route path="sesiones" element={<Sesiones />} />
          <Route path="sesiones/:id" element={<DetalleSesion />} />
          <Route path="comparar" element={<Comparar />} />
          <Route path="validacion" element={<Validacion />} />
          <Route path="acerca" element={<Acerca />} />
          <Route path="cuenta" element={<MiCuenta />} />
          <Route
            path="usuarios"
            element={
              <SoloAdmin>
                <Usuarios />
              </SoloAdmin>
            }
          />
        </Route>
      </Route>
    </Routes>
  )
}
