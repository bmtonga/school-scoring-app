import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const LEVELS = ['junior', 'senior']

function Leaderboard({ programId, title = 'Leaderboard', level, showLevelToggle = false }) {
  const [activeLevel, setActiveLevel] = useState(level ?? 'junior')
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (level) {
      setActiveLevel(level)
    }
  }, [level])

  useEffect(() => {
    if (!programId) {
      setRows([])
      setIsLoading(false)
      return
    }

    let isMounted = true

    const fetchLeaderboard = async () => {
      setIsLoading(true)
      setErrorMessage('')

      let query = supabase
        .from('class_totals')
        .select('class_id, grade, class_name, level, total_points')
        .eq('program_id', programId)
        .order('total_points', { ascending: false })
        .order('grade', { ascending: true })
        .order('class_name', { ascending: true })

      if (showLevelToggle) {
        query = query.eq('level', activeLevel)
      }

      const { data, error } = await query

      if (!isMounted) {
        return
      }

      if (error) {
        setRows([])
        setErrorMessage(error.message)
        setIsLoading(false)
        return
      }

      setRows(data ?? [])
      setIsLoading(false)
    }

    fetchLeaderboard()

    return () => {
      isMounted = false
    }
  }, [activeLevel, programId, showLevelToggle])

  return (
    <section className="card">
      <h2>{title}</h2>

      {showLevelToggle ? (
        <fieldset>
          <legend>Level</legend>
          {LEVELS.map((levelOption) => (
            <label key={levelOption} htmlFor={`leaderboard-level-${programId}-${levelOption}`}>
              <input
                id={`leaderboard-level-${programId}-${levelOption}`}
                type="radio"
                name={`leaderboard-level-${programId}`}
                value={levelOption}
                checked={activeLevel === levelOption}
                onChange={(event) => setActiveLevel(event.target.value)}
              />
              {levelOption}
            </label>
          ))}
        </fieldset>
      ) : null}

      {isLoading ? <p>Loading leaderboard...</p> : null}
      {errorMessage ? <p>{errorMessage}</p> : null}

      {!isLoading && !errorMessage && rows.length === 0 ? <p>No leaderboard scores yet.</p> : null}

      {!isLoading && !errorMessage && rows.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Class</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.class_id} className={index === 0 ? 'leaderboard-row leader' : 'leaderboard-row'}>
                <td>{index + 1}</td>
                <td>
                  Grade {row.grade} {row.class_name} ({row.level})
                </td>
                <td>{row.total_points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  )
}

export default Leaderboard
