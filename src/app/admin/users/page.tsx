import { auth } from '../../../../auth'
import AdminUsersClient from './users-client'

export default async function AdminUsersPage() {
  const session = await auth()
  const role = session?.user?.role ?? ''
  const isPlatformManager = role === 'PLATFORM_MANAGER' || role === 'SUPER_ADMIN'
  const isOperationsManager = role === 'OPERATIONS_MANAGER'

  return <AdminUsersClient isPlatformManager={isPlatformManager} isOperationsManager={isOperationsManager} />
}
