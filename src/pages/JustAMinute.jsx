import ScoreEntry from '../components/ScoreEntry'
import WeeklyDraw from '../components/WeeklyDraw'

function JustAMinute() {
  return (
    <main>
      <h1>Just a Minute Dashboard</h1>
      <WeeklyDraw programName="just_a_minute" showLevelToggle />
      <ScoreEntry programName="just_a_minute" />
    </main>
  )
}

export default JustAMinute
