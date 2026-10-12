import Leaderboard from '../components/Leaderboard'
import AppShell from '../components/AppShell'
import ScoreEntry from '../components/ScoreEntry'
import WeeklyDraw from '../components/WeeklyDraw'
import { PROGRAM_IDS } from '../lib/programs'

function Literacy() {
  return (
    <AppShell title="Literacy" description="Run this week's draw, record scores, and keep an eye on class progress.">
      <div className="dashboard-grid">
        <WeeklyDraw programName="literacy" />
        <ScoreEntry programName="literacy" />
        <Leaderboard programId={PROGRAM_IDS.literacy} title="Literacy leaderboard" />
      </div>
    </AppShell>
  )
}

export default Literacy
