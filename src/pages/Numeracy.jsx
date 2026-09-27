import ScoreEntry from '../components/ScoreEntry'
import WeeklyDraw from '../components/WeeklyDraw'

function Numeracy() {
  return (
    <main>
      <h1>Numeracy Dashboard</h1>
      <WeeklyDraw programName="numeracy" />
      <ScoreEntry programName="numeracy" />
    </main>
  )
}

export default Numeracy
