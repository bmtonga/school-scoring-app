import Leaderboard from '../components/Leaderboard'
import ScoreEntry from '../components/ScoreEntry'
import WeeklyDraw from '../components/WeeklyDraw'
import { PROGRAM_IDS } from '../lib/programs'

function JustAMinute() {
  return (
    <main>
      <h1>Just a Minute Dashboard</h1>
      <WeeklyDraw programName="just_a_minute" showLevelToggle />
      <ScoreEntry programName="just_a_minute" />
      <Leaderboard
        programId={PROGRAM_IDS.just_a_minute}
        title="Just a Minute Leaderboard"
        level="junior"
        showLevelToggle
      />
    </main>
  )
}

export default JustAMinute
