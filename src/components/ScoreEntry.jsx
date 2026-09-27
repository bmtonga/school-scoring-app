import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const todayAsDateString = () => new Date().toISOString().slice(0, 10)

const buildClassLabel = (classInfo) => `Grade ${classInfo.grade} ${classInfo.name} (${classInfo.level})`

function ScoreEntry({ programName }) {
  const [programId, setProgramId] = useState(null)
  const [drawRows, setDrawRows] = useState([])
  const [pointsByDraw, setPointsByDraw] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchProgram = async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('id')
        .eq('name', programName)
        .single()

      if (!isMounted) {
        return
      }

      if (error) {
        setProgramId(null)
        setErrorMessage(error.message)
        setIsLoading(false)
        return
      }

      setProgramId(data.id)
    }

    fetchProgram()

    return () => {
      isMounted = false
    }
  }, [programName])

  useEffect(() => {
    if (!programId) {
      return
    }

    let isMounted = true

    const fetchDrawsForToday = async () => {
      setIsLoading(true)
      setErrorMessage('')
      setSuccessMessage('')
      setIsSubmitted(false)

      const today = todayAsDateString()
      const { data: draws, error: drawsError } = await supabase
        .from('draws')
        .select('id, class_id, student_id, draw_date, present')
        .eq('program_id', programId)
        .eq('draw_date', today)
        .eq('present', true)

      if (!isMounted) {
        return
      }

      if (drawsError) {
        setDrawRows([])
        setPointsByDraw({})
        setErrorMessage(drawsError.message)
        setIsLoading(false)
        return
      }

      const drawList = draws ?? []

      if (drawList.length === 0) {
        setDrawRows([])
        setPointsByDraw({})
        setIsLoading(false)
        return
      }

      const drawIds = drawList.map((item) => item.id)
      const { data: existingScores, error: scoresError } = await supabase
        .from('scores')
        .select('draw_id')
        .in('draw_id', drawIds)

      if (!isMounted) {
        return
      }

      if (scoresError) {
        setDrawRows([])
        setPointsByDraw({})
        setErrorMessage(scoresError.message)
        setIsLoading(false)
        return
      }

      const scoredDrawIds = new Set((existingScores ?? []).map((score) => score.draw_id))
      const unscoredDraws = drawList.filter((draw) => !scoredDrawIds.has(draw.id))

      if (unscoredDraws.length === 0) {
        setDrawRows([])
        setPointsByDraw({})
        setSuccessMessage("Today's draws already have scores recorded.")
        setIsLoading(false)
        return
      }

      const studentIds = [...new Set(unscoredDraws.map((draw) => draw.student_id))]
      const classIds = [...new Set(unscoredDraws.map((draw) => draw.class_id))]

      const [studentsResult, classesResult] = await Promise.all([
        supabase.from('students').select('id, name').in('id', studentIds),
        supabase.from('classes').select('id, grade, name, level').in('id', classIds),
      ])

      if (!isMounted) {
        return
      }

      if (studentsResult.error) {
        setDrawRows([])
        setPointsByDraw({})
        setErrorMessage(studentsResult.error.message)
        setIsLoading(false)
        return
      }

      if (classesResult.error) {
        setDrawRows([])
        setPointsByDraw({})
        setErrorMessage(classesResult.error.message)
        setIsLoading(false)
        return
      }

      const studentsById = Object.fromEntries((studentsResult.data ?? []).map((row) => [row.id, row]))
      const classesById = Object.fromEntries((classesResult.data ?? []).map((row) => [row.id, row]))

      const mergedRows = unscoredDraws
        .map((draw) => ({
          drawId: draw.id,
          student: studentsById[draw.student_id],
          classInfo: classesById[draw.class_id],
        }))
        .filter((row) => row.student && row.classInfo)
        .sort((a, b) => {
          if (a.classInfo.grade !== b.classInfo.grade) {
            return a.classInfo.grade - b.classInfo.grade
          }

          return a.classInfo.name.localeCompare(b.classInfo.name)
        })

      const initialPoints = {}
      mergedRows.forEach((row) => {
        initialPoints[row.drawId] = ''
      })

      setDrawRows(mergedRows)
      setPointsByDraw(initialPoints)
      setIsLoading(false)
    }

    fetchDrawsForToday()

    return () => {
      isMounted = false
    }
  }, [programId])

  const handlePointsChange = (drawId, value) => {
    setPointsByDraw((previous) => ({
      ...previous,
      [drawId]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (drawRows.length === 0) {
      return
    }

    const invalidEntry = drawRows.find((row) => {
      const raw = pointsByDraw[row.drawId]
      if (raw === undefined || raw === '') {
        return true
      }

      const numericValue = Number(raw)
      return !Number.isInteger(numericValue) || numericValue < 0
    })

    if (invalidEntry) {
      setErrorMessage('Enter a whole number of points (0 or more) for every student.')
      setSuccessMessage('')
      return
    }

    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    const payload = drawRows.map((row) => ({
      id: crypto.randomUUID(),
      draw_id: row.drawId,
      points: Number(pointsByDraw[row.drawId]),
    }))

    const { error } = await supabase.from('scores').insert(payload)

    if (error) {
      setErrorMessage(error.message)
      setIsSaving(false)
      return
    }

    setIsSubmitted(true)
    setSuccessMessage('Scores submitted successfully.')
    setIsSaving(false)
  }

  return (
    <section>
      <h2>Score Entry</h2>

      {isLoading ? <p>Loading today&apos;s draws...</p> : null}
      {errorMessage ? <p>{errorMessage}</p> : null}
      {successMessage ? <p>{successMessage}</p> : null}

      {!isLoading && drawRows.length === 0 ? <p>No unscored draws found for today.</p> : null}

      {!isLoading && drawRows.length > 0 ? (
        <form onSubmit={handleSubmit}>
          {drawRows.map((row) => (
            <div key={row.drawId}>
              <p>
                <strong>{row.student.name}</strong> — {buildClassLabel(row.classInfo)}
              </p>
              <label htmlFor={`points-${row.drawId}`}>Points</label>
              <input
                id={`points-${row.drawId}`}
                type="number"
                min="0"
                step="1"
                value={pointsByDraw[row.drawId] ?? ''}
                onChange={(event) => handlePointsChange(row.drawId, event.target.value)}
                disabled={isSaving || isSubmitted}
                required
              />
            </div>
          ))}

          <button type="submit" disabled={isSaving || isSubmitted}>
            {isSaving ? 'Saving...' : isSubmitted ? 'Submitted' : 'Submit Scores'}
          </button>
        </form>
      ) : null}
    </section>
  )
}

export default ScoreEntry
