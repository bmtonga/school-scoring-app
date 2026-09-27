import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const INITIAL_FORM = {
  grade: '',
  name: '',
  level: 'junior',
}

function ManageClasses() {
  const [classes, setClasses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formValues, setFormValues] = useState(INITIAL_FORM)
  const [formErrors, setFormErrors] = useState({})
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
    }))

    setFormErrors((previous) => ({
      ...previous,
      [name]: '',
    }))
  }

  const validateForm = () => {
    const nextErrors = {}
    const gradeAsNumber = Number(formValues.grade)

    if (!Number.isInteger(gradeAsNumber) || gradeAsNumber < 8 || gradeAsNumber > 12) {
      nextErrors.grade = 'Grade must be a whole number between 8 and 12.'
    }

    if (!formValues.name.trim()) {
      nextErrors.name = 'Class name is required.'
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

  return (
    <main>
      <h1>Manage Classes</h1>
      <p>
        <Link to="/principal">Back to Principal Dashboard</Link>
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="grade">Grade (8-12)</label>
          <input
            id="grade"
            name="grade"
            type="number"
            min="8"
            max="12"
            step="1"
            value={formValues.grade}
            onChange={handleFieldChange}
            required
          />
          {formErrors.grade ? <p>{formErrors.grade}</p> : null}
        </div>

        <div>
          <label htmlFor="name">Class Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={formValues.name}
            onChange={handleFieldChange}
            required
          />
          {formErrors.name ? <p>{formErrors.name}</p> : null}
        </div>

        <fieldset>
          <legend>Level</legend>
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

      {requestError ? <p>{requestError}</p> : null}

      <section>
        <h2>All Classes</h2>
        {isLoading ? <p>Loading classes...</p> : null}

        {!isLoading && classes.length === 0 ? <p>No classes found.</p> : null}

        {!isLoading && classes.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Grade</th>
                <th>Name</th>
                <th>Level</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((item) => (
                <tr key={item.id}>
                  <td>{item.grade}</td>
                  <td>{item.name}</td>
                  <td>{item.level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </main>
  )
}

export default ManageClasses
