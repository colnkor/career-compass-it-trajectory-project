import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import './index.css'
import { routeTree } from './routeTree.gen'

const router = createRouter({ 
    routeTree,
    context: {
      auth: undefined!,
    } 
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function App() {
  const auth = {
    isAuthenticated: true,
    isAdmin: true,
    isLoading: false,
  }

  if (auth.isLoading) {
    return <div className="flex h-screen items-center justify-center">Загрузка...</div>
  }

  return (
    <RouterProvider 
      router={router} 
      context={{
        auth: {
          isAuthenticated: auth.isAuthenticated,
          isAdmin: auth.isAdmin,
          user: null,
        }
      }}
    />
  )
}

const rootElement = document.getElementById('root')!

if (!rootElement.innerHTML) {
  const root = createRoot(rootElement)
  root.render(
    <StrictMode>
      <App/>
    </StrictMode>,
  )
}