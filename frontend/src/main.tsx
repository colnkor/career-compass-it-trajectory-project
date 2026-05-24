import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import './index.css'
import { routeTree } from './routeTree.gen'
import type { User } from './types/user'
import authFetch from './utils/api'

interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: User | null;
  isLoading: boolean;
}

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
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    isAdmin: false,
    user: null,
    isLoading: true, 
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authFetch('/api/users/me'); 
        
        if (response.ok) {
          const userData = await response.json();
          setAuth({
            isAuthenticated: true,
            isAdmin: userData.is_admin,
            user: userData,
            isLoading: false,
          });
        } else {
          throw new Error('Not authenticated');
        }
      } catch (error) {
        console.log(error);
        // Если токена нет, он протух, или сервер вернул 401
        setAuth({
          isAuthenticated: false,
          isAdmin: false,
          user: null,
          isLoading: false,
        });
      }
    };

    checkAuth();
  }, []);

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
          user: auth.user,
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