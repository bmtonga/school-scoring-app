import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { loading, session, role } = useAuth()

  if (loading) {
    return <p>Loading...</p>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
