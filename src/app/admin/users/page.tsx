import { auth } from '../../../../auth'
import AdminUsersClient from './users-client'

export default async function AdminUsersPage() {
  const session = await auth()
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'

  return <AdminUsersClient isSuperAdmin={isSuperAdmin} />
}
