import Leaderboard from '../components/Leaderboard'
import AppShell from '../components/AppShell'
import ScoreEntry from '../components/ScoreEntry'
import WeeklyDraw from '../components/WeeklyDraw'
import { PROGRAM_IDS } from '../lib/programs'

function JustAMinute() {
  return (
    <AppShell title="Just a Minute" description="Choose a level, run today's draw, and capture the scores that count.">
      <div className="dashboard-grid">
        <WeeklyDraw programName="just_a_minute" showLevelToggle />
        <ScoreEntry programName="just_a_minute" />
        <Leaderboard programId={PROGRAM_IDS.just_a_minute} title="Just a Minute leaderboard" level="junior" showLevelToggle />
      </div>
    </AppShell>
  )
}

export default JustAMinute
