import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from './App'
import { AuthProvider } from './auth/Auth'
import './index.css'

const cliente = new QueryClient({ defaultOptions: {
    queries: {
      // No reintenta si el servidor dijo "sin sesión" o "sin permiso".
      retry: (n, e) => n < 1 && ![401, 403].includes((e as { estado?: number }).estado ?? 0),
      refetchOnWindowFocus: false,
    },
  }, })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={cliente}>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
