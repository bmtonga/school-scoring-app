import { Link } from 'react-router-dom'
import Leaderboard from '../components/Leaderboard'
import AppShell from '../components/AppShell'
import { PROGRAM_IDS } from '../lib/programs'

function PrincipalDashboard() {
  return (
    <AppShell title="Principal dashboard" description="A read-only view of performance across every scoring programme.">
      <div className="principal-action"><Link className="button-link" to="/manage-classes">Manage classes</Link></div>
      <div className="principal-grid">
        <Leaderboard programId={PROGRAM_IDS.numeracy} title="Numeracy" />
        <Leaderboard programId={PROGRAM_IDS.literacy} title="Literacy" />
        <Leaderboard programId={PROGRAM_IDS.just_a_minute} title="Just a Minute" level="junior" showLevelToggle />
      </div>
    </AppShell>
  )
}

export default PrincipalDashboard
