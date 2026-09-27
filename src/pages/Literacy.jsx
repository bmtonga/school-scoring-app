import Leaderboard from '../components/Leaderboard'
import ScoreEntry from '../components/ScoreEntry'
import WeeklyDraw from '../components/WeeklyDraw'
import { PROGRAM_IDS } from '../lib/programs'

function Literacy() {
  return (
    <main>
      <h1>Literacy Dashboard</h1>
      <WeeklyDraw programName="literacy" />
      <ScoreEntry programName="literacy" />
      <Leaderboard programId={PROGRAM_IDS.literacy} title="Literacy Leaderboard" />
    </main>
  )
}

export default Literacy
