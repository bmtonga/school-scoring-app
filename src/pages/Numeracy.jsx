import Leaderboard from '../components/Leaderboard'
import ScoreEntry from '../components/ScoreEntry'
import WeeklyDraw from '../components/WeeklyDraw'
import { PROGRAM_IDS } from '../lib/programs'

function Numeracy() {
  return (
    <main>
      <h1>Numeracy Dashboard</h1>
      <WeeklyDraw programName="numeracy" />
      <ScoreEntry programName="numeracy" />
      <Leaderboard programId={PROGRAM_IDS.numeracy} title="Numeracy Leaderboard" />
    </main>
  )
}

export default Numeracy
