import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import JustAMinute from './pages/JustAMinute'
import Literacy from './pages/Literacy'
import Login from './pages/Login'
import Numeracy from './pages/Numeracy'
import Principal from './pages/Principal'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/numeracy"
        element={
          <ProtectedRoute allowedRoles={['numeracy']}>
            <Numeracy />
          </ProtectedRoute>
        }
      />
      <Route
        path="/literacy"
        element={
          <ProtectedRoute allowedRoles={['literacy']}>
            <Literacy />
          </ProtectedRoute>
        }
      />
      <Route
        path="/just-a-minute"
        element={
          <ProtectedRoute allowedRoles={['just_a_minute']}>
            <JustAMinute />
          </ProtectedRoute>
        }
      />
      <Route
        path="/principal"
        element={
          <ProtectedRoute allowedRoles={['principal']}>
            <Principal />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
