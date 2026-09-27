import ScoreEntry from '../components/ScoreEntry'
import WeeklyDraw from '../components/WeeklyDraw'

function Literacy() {
  return (
    <main>
      <h1>Literacy Dashboard</h1>
      <WeeklyDraw programName="literacy" />
      <ScoreEntry programName="literacy" />
    </main>
  )
}

export default Literacy
