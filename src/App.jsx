import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Numeracy from './pages/Numeracy'
import Literacy from './pages/Literacy'
import JustAMinute from './pages/JustAMinute'
import Principal from './pages/Principal'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/numeracy" element={<Numeracy />} />
      <Route path="/literacy" element={<Literacy />} />
      <Route path="/just-a-minute" element={<JustAMinute />} />
      <Route path="/principal" element={<Principal />} />
    </Routes>
  )
}

export default App
