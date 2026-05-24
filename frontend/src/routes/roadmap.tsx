import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/roadmap')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <main>
        <Outlet /> 
      </main>
    </div>
  )
}
