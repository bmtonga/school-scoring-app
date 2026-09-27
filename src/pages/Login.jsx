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
    <main>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {errorMessage ? <p>{errorMessage}</p> : null}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}

export default Login
