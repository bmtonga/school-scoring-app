import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardPath, useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'

function Login() {
  const navigate = useNavigate()
  const { session, role, loading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!loading && session) {
      navigate(getDashboardPath(role), { replace: true })
    }
  }, [loading, navigate, role, session])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMessage(error.message)
      setIsSubmitting(false)
      return
    }

    const nextRole = data.user?.user_metadata?.role
    const destination = getDashboardPath(nextRole)

    if (destination === '/login') {
      setErrorMessage('Your account role is not authorized for this app.')
      await supabase.auth.signOut()
      setIsSubmitting(false)
      return
    }

    navigate(destination, { replace: true })
    setIsSubmitting(false)
  }

  return (
    <main className="login-page">
      <section className="login-intro">
        <div className="brand-lockup login-brand"><span className="brand-mark">S</span></div>
        <div><h1>Make every score count.</h1><p>A calm, clear home for weekly draws, classroom scores, and school-wide progress.</p></div>
      </section>
      <section className="login-form-side">
        <form className="login-form" onSubmit={handleSubmit}>
          <p className="eyebrow">School Scoring Hub</p>
          <h2>Welcome back</h2>
          <p className="form-intro">Sign in to continue to your scoring workspace.</p>
          <div className="form-field"><label htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
          <div className="form-field"><label htmlFor="password">Password</label><input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
          {errorMessage ? <p className="status-message error-message" role="alert">{errorMessage}</p> : null}
          <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Sign in'}</button>
        </form>
      </section>
    </main>
  )
}

export default Login
