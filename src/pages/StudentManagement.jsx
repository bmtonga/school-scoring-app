import { useEffect, useMemo, useState } from 'react'
import AppShell from '../components/AppShell'
import { PROGRAM_IDS } from '../lib/programs'
import { supabase } from '../lib/supabaseClient'

const LEVELS = ['all', 'junior', 'senior']
const GRADE_OPTIONS = [1, 2, 10, 11, 12]
const STATUS_OPTIONS = ['active', 'archived', 'all']

const gradeLabel = (grade) => (grade < 3 ? `Form ${grade}` : `Grade ${grade}`)

function StudentManagement({ programName, title }) {
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [selectedGrade, setSelectedGrade] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('active')
  const [newStudentName, setNewStudentName] = useState('')
  const [newStudentClassId, setNewStudentClassId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [actionMessage, setActionMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchStudents = async () => {
      setIsLoading(true)
      setErrorMessage('')

      const [studentsResult, classesResult, drawsResult] = await Promise.all([
        supabase
          .from('students')
          .select('id, name, class_id, archived_at, classes!inner(id, grade, name, level)')
          .order('name', { ascending: true }),
        supabase
          .from('classes')
          .select('id, grade, name, level')
          .order('grade', { ascending: true })
          .order('name', { ascending: true }),
        supabase
          .from('draws')
          .select('student_id')
          .eq('program_id', PROGRAM_IDS[programName]),
      ])

      if (!isMounted) {
        return
      }

      if (studentsResult.error) {
        setErrorMessage(studentsResult.error.message)
        setStudents([])
        setIsLoading(false)
        return
      }

      if (drawsResult.error) {
        setErrorMessage(drawsResult.error.message)
        setStudents([])
        setIsLoading(false)
        return
      }

      if (classesResult.error) {
        setErrorMessage(classesResult.error.message)
        setClasses([])
        setIsLoading(false)
        return
      }

      const selectedStudentIds = new Set((drawsResult.data ?? []).map((draw) => draw.student_id))
      setClasses(classesResult.data ?? [])
      setStudents((studentsResult.data ?? []).map((student) => ({
        id: student.id,
        name: student.name,
        archivedAt: student.archived_at,
        classInfo: student.classes,
        hasBeenSelected: selectedStudentIds.has(student.id),
      })))
      setIsLoading(false)
    }

    fetchStudents()

    return () => {
      isMounted = false
    }
  }, [programName])

  const reloadStudents = async () => {
    const [studentsResult, drawsResult] = await Promise.all([
      supabase
        .from('students')
        .select('id, name, class_id, archived_at, classes!inner(id, grade, name, level)')
        .order('name', { ascending: true }),
      supabase
        .from('draws')
        .select('student_id')
        .eq('program_id', PROGRAM_IDS[programName]),
    ])

    if (studentsResult.error || drawsResult.error) {
      setErrorMessage(studentsResult.error?.message ?? drawsResult.error.message)
      return
    }

    const selectedStudentIds = new Set((drawsResult.data ?? []).map((draw) => draw.student_id))
    setStudents((studentsResult.data ?? []).map((student) => ({
      id: student.id,
      name: student.name,
      archivedAt: student.archived_at,
      classInfo: student.classes,
      hasBeenSelected: selectedStudentIds.has(student.id),
    })))
  }

  const handleAddStudent = async (event) => {
    event.preventDefault()
    const name = newStudentName.trim()

    if (!name || !newStudentClassId) {
      setErrorMessage('Choose a class and enter a student name.')
      return
    }

    setIsSaving(true)
    setErrorMessage('')
    setActionMessage('')
    const { error } = await supabase.from('students').insert({
      id: crypto.randomUUID(),
      name,
      class_id: newStudentClassId,
    })

    if (error) {
      setErrorMessage(error.message)
      setIsSaving(false)
      return
    }

    setNewStudentName('')
    setActionMessage(`${name} was added to the class.`)
    await reloadStudents()
    setIsSaving(false)
  }

  const handleArchiveToggle = async (student) => {
    setIsSaving(true)
    setErrorMessage('')
    setActionMessage('')
    const { data, error } = await supabase
      .from('students')
      .update({ archived_at: student.archivedAt ? null : new Date().toISOString() })
      .eq('id', student.id)
      .select('id')

    if (error) {
      setErrorMessage(error.message)
      setIsSaving(false)
      return
    }

    if (!data?.length) {
      setErrorMessage('You do not have permission to update this student.')
      setIsSaving(false)
      return
    }

    setActionMessage(`${student.name} was ${student.archivedAt ? 'restored' : 'archived'}.`)
    await reloadStudents()
    setIsSaving(false)
  }

  const filteredStudents = useMemo(
    () => students.filter((student) => {
      const matchesLevel = selectedLevel === 'all' || student.classInfo.level === selectedLevel
      const matchesGrade = selectedGrade === 'all' || String(student.classInfo.grade) === selectedGrade
      const matchesStatus = selectedStatus === 'all'
        || (selectedStatus === 'archived' ? Boolean(student.archivedAt) : !student.archivedAt)
      return matchesLevel && matchesGrade && matchesStatus
    }),
    [selectedGrade, selectedLevel, selectedStatus, students],
  )

  const groupedStudents = useMemo(
    () => filteredStudents.reduce((groups, student) => {
      const groupKey = `${student.classInfo.grade}-${student.classInfo.level}`
      if (!groups[groupKey]) {
        groups[groupKey] = { grade: student.classInfo.grade, level: student.classInfo.level, students: [] }
      }
      groups[groupKey].students.push(student)
      return groups
    }, {}),
    [filteredStudents],
  )

  const selectedCount = filteredStudents.filter((student) => student.hasBeenSelected).length
  return (
    <AppShell title={`${title} students`} description={`See every student in ${title}, organised by grade and programme level.`}>
      <section className="surface student-toolbar">
        <div>
          <h2>Student directory</h2>
          <p className="section-kicker">{filteredStudents.length} students shown · {selectedCount} selected before for {title}</p>
        </div>
        <div className="student-filters">
          <label htmlFor={`${programName}-status-filter`}>Status
            <select id={`${programName}-status-filter`} value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
              {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}
            </select>
          </label>
          <label htmlFor={`${programName}-level-filter`}>Level
            <select id={`${programName}-level-filter`} value={selectedLevel} onChange={(event) => setSelectedLevel(event.target.value)}>
              {LEVELS.map((level) => <option key={level} value={level}>{level === 'all' ? 'All levels' : level[0].toUpperCase() + level.slice(1)}</option>)}
            </select>
          </label>
          <label htmlFor={`${programName}-grade-filter`}>Grade
            <select id={`${programName}-grade-filter`} value={selectedGrade} onChange={(event) => setSelectedGrade(event.target.value)}>
              <option value="all">All grades</option>
              {GRADE_OPTIONS.map((grade) => <option key={grade} value={grade}>{gradeLabel(grade)}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="surface student-add-panel">
        <div><h2>Add student</h2><p className="section-kicker">Add a name to any existing class.</p></div>
        <form className="student-add-form" onSubmit={handleAddStudent} noValidate>
          <label htmlFor={`${programName}-new-student-class`}>Class
            <select id={`${programName}-new-student-class`} value={newStudentClassId} onChange={(event) => setNewStudentClassId(event.target.value)} disabled={isSaving} required>
              <option value="">Choose a class</option>
              {classes.map((item) => <option key={item.id} value={item.id}>{gradeLabel(item.grade)} {item.name}</option>)}
            </select>
          </label>
          <label htmlFor={`${programName}-new-student-name`}>Student name
            <input id={`${programName}-new-student-name`} value={newStudentName} onChange={(event) => setNewStudentName(event.target.value)} disabled={isSaving} placeholder="Student name" required />
          </label>
          <button type="submit" disabled={isSaving || classes.length === 0}>{isSaving ? 'Saving...' : 'Add student'}</button>
        </form>
      </section>
      {actionMessage ? <p className="status-message" role="status">{actionMessage}</p> : null}

      {isLoading ? <section className="surface"><p className="muted">Loading students...</p></section> : null}
      {errorMessage ? <p className="status-message error-message" role="alert">{errorMessage}</p> : null}
      {!isLoading && !errorMessage && filteredStudents.length === 0 ? <section className="surface"><p className="muted">No students match these filters.</p></section> : null}

      {!isLoading && !errorMessage ? (
        <div className="student-groups">
          {Object.values(groupedStudents).map((group) => (
            <section className="surface student-group" key={`${group.grade}-${group.level}`}>
              <div className="student-group-heading"><div><p className="eyebrow">{group.level}</p><h2>{gradeLabel(group.grade)}</h2></div><span className="badge">{group.students.length} students</span></div>
              <div className="student-list">
                {group.students.map((student) => (
                  <div className="student-row" key={student.id}>
                    <span className="avatar">{student.name[0]?.toUpperCase() ?? '?'}</span>
                    <div><strong>{student.name}</strong><small>Class {student.classInfo.name}</small></div>
                    {student.archivedAt ? <span className="badge">Archived</span> : null}
                    <span className={student.hasBeenSelected ? 'badge' : 'badge pending'}>{student.hasBeenSelected ? 'Selected before' : 'Not selected'}</span>
                    <button className="remove-student-button" type="button" onClick={() => handleArchiveToggle(student)} disabled={isSaving} title={student.archivedAt ? `Restore ${student.name}` : `Archive ${student.name}`} aria-label={student.archivedAt ? `Restore ${student.name}` : `Archive ${student.name}`}>
                      {student.archivedAt ? 'Restore' : 'Archive'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </AppShell>
  )
}

export default StudentManagement
