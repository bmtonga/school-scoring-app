import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import AppShell from '../components/AppShell'

const INITIAL_FORM = {
  grade: '',
  name: 'N',
  level: 'junior',
}

const GRADE_OPTIONS = [1, 2, 10, 11, 12]
const CLASS_OPTIONS = ['N', 'J', 'V', 'R']

function ManageClasses() {
  const [classes, setClasses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingStudent, setIsSavingStudent] = useState(false)
  const [formValues, setFormValues] = useState(INITIAL_FORM)
  const [studentName, setStudentName] = useState('')
  const [studentClassId, setStudentClassId] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [studentError, setStudentError] = useState('')
  const [requestError, setRequestError] = useState('')

  const fetchClasses = async () => {
    setIsLoading(true)

    const { data, error } = await supabase
      .from('classes')
      .select('id, grade, name, level')
      .order('grade', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      setRequestError(error.message)
      setClasses([])
      setIsLoading(false)
      return
    }

    setRequestError('')
    setClasses(data ?? [])
    setStudentClassId((currentClassId) => currentClassId || data?.[0]?.id || '')
    setIsLoading(false)
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  const handleFieldChange = (event) => {
    const { name, value } = event.target

    setFormValues((previous) => ({
      ...previous,
      [name]: value,
      ...(name === 'grade' && value ? { level: Number(value) < 3 ? 'junior' : 'senior' } : {}),
    }))

    setFormErrors((previous) => ({
      ...previous,
      [name]: '',
    }))
  }

  const validateForm = () => {
    const nextErrors = {}
    const gradeAsNumber = Number(formValues.grade)

    if (!GRADE_OPTIONS.includes(gradeAsNumber)) {
      nextErrors.grade = 'Choose Form 1, Form 2, Grade 10, 11, or 12.'
    }

    if (!['junior', 'senior'].includes(formValues.level)) {
      nextErrors.level = 'Level must be junior or senior.'
    }

    setFormErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSaving(true)
    setRequestError('')

    const payload = {
      id: crypto.randomUUID(),
      grade: Number(formValues.grade),
      name: formValues.name.trim(),
      level: formValues.level,
    }

    const { error } = await supabase.from('classes').insert(payload)

    if (error) {
      setRequestError(error.message)
      setIsSaving(false)
      return
    }

    setFormValues(INITIAL_FORM)
    setFormErrors({})
    await fetchClasses()
    setIsSaving(false)
  }

  const handleStudentSubmit = async (event) => {
    event.preventDefault()
    const trimmedName = studentName.trim()

    if (!studentClassId) {
      setStudentError('Choose a class before adding a student.')
      return
    }

    if (!trimmedName) {
      setStudentError('Student name is required.')
      return
    }

    setIsSavingStudent(true)
    setStudentError('')
    const { error } = await supabase.from('students').insert({
      id: crypto.randomUUID(),
      name: trimmedName,
      class_id: studentClassId,
    })

    if (error) {
      setStudentError(error.message)
      setIsSavingStudent(false)
      return
    }

    setStudentName('')
    setIsSavingStudent(false)
  }

  return (
    <AppShell title="Manage classes" description="Keep the class list ready for this week's scoring activities.">
      <Link className="back-link" to="/principal">Back to Principal Dashboard</Link>
      <div className="manage-grid">
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="grade">Form / Grade</label>
          <select
            id="grade"
            name="grade"
            value={formValues.grade}
            onChange={handleFieldChange}
            required
          >
            <option value="">Choose a grade</option>
            {GRADE_OPTIONS.map((grade) => <option key={grade} value={grade}>{grade < 3 ? `Form ${grade}` : `Grade ${grade}`}</option>)}
          </select>
          {formErrors.grade ? <p>{formErrors.grade}</p> : null}
        </div>

        <div className="form-field">
          <label htmlFor="name">Class</label>
          <select
            id="name"
            name="name"
            value={formValues.name}
            onChange={handleFieldChange}
            required
          >
            {CLASS_OPTIONS.map((className) => <option key={className} value={className}>{className}</option>)}
          </select>
        </div>

        <fieldset>
          <legend>Programme level</legend>
          <label htmlFor="level-junior">
            <input
              id="level-junior"
              type="radio"
              name="level"
              value="junior"
              checked={formValues.level === 'junior'}
              onChange={handleFieldChange}
            />
            Junior
          </label>
          <label htmlFor="level-senior">
            <input
              id="level-senior"
              type="radio"
              name="level"
              value="senior"
              checked={formValues.level === 'senior'}
              onChange={handleFieldChange}
            />
            Senior
          </label>
          {formErrors.level ? <p>{formErrors.level}</p> : null}
        </fieldset>

        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Add Class'}
        </button>
      </form>

      <form onSubmit={handleStudentSubmit} noValidate>
        <h2>Add student names</h2>
        <p className="section-kicker">Add names to the selected Form or Grade class.</p>
        <div className="form-field">
          <label htmlFor="student-class">Class</label>
          <select id="student-class" value={studentClassId} onChange={(event) => setStudentClassId(event.target.value)} required>
            <option value="">Choose a class</option>
            {classes.map((item) => <option key={item.id} value={item.id}>{item.grade < 3 ? `Form ${item.grade}` : `Grade ${item.grade}`} {item.name}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="student-name">Student name</label>
          <input id="student-name" type="text" value={studentName} onChange={(event) => setStudentName(event.target.value)} placeholder="e.g. Amara Ndlovu" required />
        </div>
        {studentError ? <p className="status-message error-message" role="alert">{studentError}</p> : null}
        <button type="submit" disabled={isSavingStudent || classes.length === 0}>{isSavingStudent ? 'Adding...' : 'Add student'}</button>
      </form>

      {requestError ? <p>{requestError}</p> : null}

      <section className="surface">
        <h2>All Classes</h2>
        {isLoading ? <p>Loading classes...</p> : null}

        {!isLoading && classes.length === 0 ? <p>No classes found.</p> : null}

        {!isLoading && classes.length > 0 ? (
          <div className="table-wrap"><table>
            <thead>
              <tr>
                <th>Form / Grade</th>
                <th>Class</th>
                <th>Level</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((item) => (
                <tr key={item.id}>
                  <td>{item.grade < 3 ? `Form ${item.grade}` : `Grade ${item.grade}`}</td>
                  <td>{item.name}</td>
                  <td>{item.level}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        ) : null}
      </section>
      </div>
    </AppShell>
  )
}

export default ManageClasses
