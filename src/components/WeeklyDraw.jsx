import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { PROGRAM_IDS } from '../lib/programs'

const LEVEL_OPTIONS = ['junior', 'senior']

const randomFromList = (items) => items[Math.floor(Math.random() * items.length)]

const toClassLabel = (classInfo) => `Grade ${classInfo.grade} ${classInfo.name} (${classInfo.level})`

function WeeklyDraw({ programName, showLevelToggle = false }) {
  const [programId, setProgramId] = useState(null)
  const [selectedLevel, setSelectedLevel] = useState('junior')
  const [classGroups, setClassGroups] = useState({})
  const [drawsByClass, setDrawsByClass] = useState({})
  const [isLoadingProgram, setIsLoadingProgram] = useState(true)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    setIsLoadingProgram(true)
    setErrorMessage('')
    setProgramId(PROGRAM_IDS[programName] ?? null)
    setIsLoadingProgram(false)
  }, [programName])

  const classEntries = useMemo(
    () =>
      Object.values(drawsByClass).sort((a, b) => {
        if (a.classInfo.grade !== b.classInfo.grade) {
          return a.classInfo.grade - b.classInfo.grade
        }

        return a.classInfo.name.localeCompare(b.classInfo.name)
      }),
    [drawsByClass],
  )

  const allConfirmed = classEntries.length > 0 && classEntries.every((entry) => entry.confirmed)

  const fetchEligibleStudents = async () => {
    let query = supabase
      .from('students')
      .select(
        `
          id,
          name,
          class_id,
          classes!inner (
            id,
            grade,
            name,
            level
          )
        `,
      )

    if (showLevelToggle) {
      query = query.eq('classes.level', selectedLevel)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    const grouped = {}

    ;(data ?? []).forEach((student) => {
      if (!grouped[student.class_id]) {
        grouped[student.class_id] = {
          classInfo: student.classes,
          students: [],
        }
      }

      grouped[student.class_id].students.push({
        id: student.id,
        name: student.name,
      })
    })

    return grouped
  }

  const startDraw = async () => {
    setIsDrawing(true)
    setErrorMessage('')
    setSuccessMessage('')
    setIsSaved(false)

    try {
      const nextClassGroups = await fetchEligibleStudents()
      const nextDrawsByClass = {}

      Object.entries(nextClassGroups).forEach(([classId, group]) => {
        if (group.students.length === 0) {
          return
        }

        const initialStudent = randomFromList(group.students)

        nextDrawsByClass[classId] = {
          classInfo: group.classInfo,
          currentStudent: initialStudent,
          absentStudentIds: [],
          redrawHistory: [],
          confirmed: false,
        }
      })

      if (Object.keys(nextDrawsByClass).length === 0) {
        setClassGroups({})
        setDrawsByClass({})
        setErrorMessage('No eligible students were found for this draw.')
        setIsDrawing(false)
        return
      }

      setClassGroups(nextClassGroups)
      setDrawsByClass(nextDrawsByClass)
    } catch (error) {
      setClassGroups({})
      setDrawsByClass({})
      setErrorMessage(error.message)
    } finally {
      setIsDrawing(false)
    }
  }

  const markPresent = (classId) => {
    setDrawsByClass((previous) => ({
      ...previous,
      [classId]: {
        ...previous[classId],
        confirmed: true,
      },
    }))
    setSuccessMessage('')
    setErrorMessage('')
  }

  const redrawAbsent = (classId) => {
    const currentClassDraw = drawsByClass[classId]
    const currentClassGroup = classGroups[classId]

    if (!currentClassDraw || !currentClassGroup) {
      return
    }

    const nextAbsentIds = [...currentClassDraw.absentStudentIds, currentClassDraw.currentStudent.id]
    const nextCandidates = currentClassGroup.students.filter(
      (student) => !nextAbsentIds.includes(student.id),
    )

    if (nextCandidates.length === 0) {
      setErrorMessage('No additional students are available to redraw for this class.')
      return
    }

    const nextStudent = randomFromList(nextCandidates)

    setDrawsByClass((previous) => ({
      ...previous,
      [classId]: {
        ...previous[classId],
        currentStudent: nextStudent,
        absentStudentIds: nextAbsentIds,
        redrawHistory: [
          ...previous[classId].redrawHistory,
          {
            id: currentClassDraw.currentStudent.id,
            name: currentClassDraw.currentStudent.name,
            redrawn: true,
          },
        ],
        confirmed: false,
      },
    }))

    setSuccessMessage('')
    setErrorMessage('')
  }

  const saveFinalDraws = async () => {
    if (!programId || !allConfirmed) {
      return
    }

    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    const today = new Date().toISOString().slice(0, 10)
    const payload = classEntries.map((entry) => ({
      id: crypto.randomUUID(),
      program_id: programId,
      class_id: entry.classInfo.id,
      student_id: entry.currentStudent.id,
      draw_date: today,
      present: true,
      redrawn: false,
    }))

    const { error } = await supabase.from('draws').insert(payload)

    if (error) {
      setErrorMessage(error.message)
      setIsSaving(false)
      return
    }

    setIsSaved(true)
    setSuccessMessage('Weekly draw saved successfully.')
    setIsSaving(false)
  }

  return (
    <section className="surface">
      <h2>Weekly Draw</h2>
      <p className="section-kicker">Select one student from every participating class.</p>

      {showLevelToggle ? (
        <fieldset>
          <legend>Just a Minute Level</legend>
          {LEVEL_OPTIONS.map((levelOption) => (
            <label key={levelOption} htmlFor={`draw-level-${levelOption}`}>
              <input
                id={`draw-level-${levelOption}`}
                type="radio"
                name="draw-level"
                value={levelOption}
                checked={selectedLevel === levelOption}
                onChange={(event) => {
                  setSelectedLevel(event.target.value)
                  setDrawsByClass({})
                  setClassGroups({})
                  setIsSaved(false)
                  setErrorMessage('')
                  setSuccessMessage('')
                }}
                disabled={isDrawing || isSaving}
              />
              {levelOption}
            </label>
          ))}
        </fieldset>
      ) : null}

      <button type="button" onClick={startDraw} disabled={isDrawing || isLoadingProgram || isSaving}>
        {isDrawing ? 'Drawing...' : 'Start Weekly Draw'}
      </button>

      {errorMessage ? <p className="status-message error-message" role="alert">{errorMessage}</p> : null}
      {successMessage ? <p className="status-message" role="status">{successMessage}</p> : null}

      {classEntries.length > 0 ? (
        <div>
          <p className="muted">{classEntries.filter((entry) => entry.confirmed).length} of {classEntries.length} classes confirmed</p>
          <div className="progress-line"><span style={{ width: `${(classEntries.filter((entry) => entry.confirmed).length / classEntries.length) * 100}%` }} /></div>
          <div className="draw-grid">
          {classEntries.map((entry) => (
            <article className="draw-card" key={entry.classInfo.id}>
              <div className="draw-card-header"><h3>{toClassLabel(entry.classInfo)}</h3><span className={entry.confirmed ? 'badge' : 'badge pending'}>{entry.confirmed ? 'Present' : 'Awaiting'}</span></div>
              <p>Drawn student: <strong>{entry.currentStudent.name}</strong></p>

              {entry.redrawHistory.length > 0 ? (
                <div>
                  <p>Redrawn (Not Present):</p>
                  <ul>
                    {entry.redrawHistory.map((historyItem) => (
                      <li key={historyItem.id}>{historyItem.name}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="draw-actions"><button
                type="button"
                onClick={() => markPresent(entry.classInfo.id)}
                disabled={entry.confirmed || isSaving || isSaved}
              >
                Present
              </button>
              <button
                className="button-danger"
                type="button"
                onClick={() => redrawAbsent(entry.classInfo.id)}
                disabled={isSaving || isSaved}
              >
                Not Present
              </button></div>
            </article>
          ))}
          </div>

          <button type="button" onClick={saveFinalDraws} disabled={!allConfirmed || isSaving || isSaved}>
            {isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save Weekly Draw'}
          </button>
        </div>
      ) : null}
    </section>
  )
}

export default WeeklyDraw
