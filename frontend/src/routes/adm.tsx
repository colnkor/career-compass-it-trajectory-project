// src/routes/adm.tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { AdminChecker } from '../utils/AdminChecker'

export const Route = createFileRoute('/adm')({
  beforeLoad: ({ context, location }) => {
    // Если не авторизован ИЛИ не админ — выкидываем отсюда
    console.log(context);
    if (!AdminChecker(context)) {
      throw redirect({
        to: '/',
      })
    }
    console.log("passed");
  },
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <div>
      <main>
        <Outlet /> 
      </main>
    </div>
  )
}