import { redirect } from 'next/navigation'
import { auth } from '../../../auth'
import AdminSidebar from './admin-sidebar'

const ADMIN_ROLES = ['PLATFORM_MANAGER', 'SYSTEM_MANAGER', 'OPERATIONS_MANAGER', 'ADMIN', 'SUPER_ADMIN']

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin')
  }

  const role = session.user.role
  if (!ADMIN_ROLES.includes(role)) {
    redirect('/?error=unauthorized')
  }

  const isOperationsManager = role === 'OPERATIONS_MANAGER'

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar
        role={role}
        isOperationsManager={isOperationsManager}
        email={session.user.email ?? ''}
      />

      {/* Main content */}
      <main className="flex-1 ml-60 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  )
}
