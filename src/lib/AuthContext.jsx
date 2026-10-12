import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabaseClient'

const AuthContext = createContext(undefined)

const ROLE_ROUTES = {
  numeracy: '/numeracy',
  literacy: '/literacy',
  just_a_minute: '/just-a-minute',
  principal: '/principal',
}

const getRoleFromSession = (session) => session?.user?.app_metadata?.role ?? null

export const getDashboardPath = (role) => ROLE_ROUTES[role] ?? '/login'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    let isMounted = true

    const initializeSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        if (!isMounted) {
          return
        }

        const currentSession = data.session
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        setRole(getRoleFromSession(currentSession))
      } catch (error) {
        if (isMounted) {
          setSession(null)
          setUser(null)
          setRole(null)
          setAuthError(error instanceof Error ? error.message : 'Unable to restore your session.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initializeSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setAuthError('')
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setRole(getRoleFromSession(nextSession))
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({
      session,
      user,
      role,
      loading,
      authError,
    }),
    [session, user, role, loading, authError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
