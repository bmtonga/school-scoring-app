import Leaderboard from '../components/Leaderboard'
import AppShell from '../components/AppShell'
import ScoreEntry from '../components/ScoreEntry'
import WeeklyDraw from '../components/WeeklyDraw'
import { PROGRAM_IDS } from '../lib/programs'

function Numeracy() {
  return (
    <AppShell title="Numeracy" description="Run this week's draw, record scores, and keep an eye on class progress.">
      <div className="dashboard-grid">
        <WeeklyDraw programName="numeracy" />
        <ScoreEntry programName="numeracy" />
        <Leaderboard programId={PROGRAM_IDS.numeracy} title="Numeracy leaderboard" />
      </div>
    </AppShell>
  )
}

export default Numeracy
