import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/adm/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/adm/"!</div>
}
