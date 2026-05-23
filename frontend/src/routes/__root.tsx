import { createRootRouteWithContext, Outlet } from "@tanstack/react-router"

interface RouterContext {
  auth: {
    isAuthenticated: boolean
    isAdmin: boolean
    user: any
  }
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
})