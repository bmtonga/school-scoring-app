import { Link } from 'react-router-dom'
import Leaderboard from '../components/Leaderboard'
import { PROGRAM_IDS } from '../lib/programs'

function PrincipalDashboard() {
  return (
    <main>
      <h1>Principal Dashboard</h1>
      <p>Read-only leaderboard overview across all programs.</p>
      <p>
        <Link to="/manage-classes">Manage Classes</Link>
      </p>

      <Leaderboard programId={PROGRAM_IDS.numeracy} title="Numeracy Leaderboard" />
      <Leaderboard programId={PROGRAM_IDS.literacy} title="Literacy Leaderboard" />
      <Leaderboard
        programId={PROGRAM_IDS.just_a_minute}
        title="Just a Minute Leaderboard"
        level="junior"
        showLevelToggle
      />
    </main>
  )
}

export default PrincipalDashboard
