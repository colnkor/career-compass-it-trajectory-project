import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/professions')({
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
