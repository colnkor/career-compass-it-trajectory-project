import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/professions')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/professions"!</div>
}
