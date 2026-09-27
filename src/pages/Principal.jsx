import { Link } from 'react-router-dom'

function Principal() {
  return (
    <main>
      <h1>Principal Dashboard</h1>
      <p>Manage class records and review school progress.</p>
      <Link to="/manage-classes">Manage Classes</Link>
    </main>
  )
}

export default Principal
