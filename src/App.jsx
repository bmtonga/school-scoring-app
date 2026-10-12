import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import JustAMinute from './pages/JustAMinute'
import Literacy from './pages/Literacy'
import Login from './pages/Login'
import ManageClasses from './pages/ManageClasses'
import Numeracy from './pages/Numeracy'
import PrincipalDashboard from './pages/PrincipalDashboard'
import StudentManagement from './pages/StudentManagement'

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
        path="/numeracy/students"
        element={
          <ProtectedRoute allowedRoles={['numeracy']}>
            <StudentManagement programName="numeracy" title="Numeracy" />
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
        path="/literacy/students"
        element={
          <ProtectedRoute allowedRoles={['literacy']}>
            <StudentManagement programName="literacy" title="Literacy" />
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
        path="/just-a-minute/students"
        element={
          <ProtectedRoute allowedRoles={['just_a_minute']}>
            <StudentManagement programName="just_a_minute" title="Just a Minute" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/principal"
        element={
          <ProtectedRoute allowedRoles={['principal']}>
            <PrincipalDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manage-classes"
        element={
          <ProtectedRoute allowedRoles={['principal']}>
            <ManageClasses />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
