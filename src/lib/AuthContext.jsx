import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabaseClient'

const AuthContext = createContext(undefined)

const ROLE_ROUTES = {
  numeracy: '/numeracy',
  literacy: '/literacy',
  just_a_minute: '/just-a-minute',
  principal: '/principal',
}

const getRoleFromSession = (session) => session?.user?.user_metadata?.role ?? null

export const getDashboardPath = (role) => ROLE_ROUTES[role] ?? '/login'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const initializeSession = async () => {
      const { data } = await supabase.auth.getSession()

      if (!isMounted) {
        return
      }

      const currentSession = data.session
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      setRole(getRoleFromSession(currentSession))
      setLoading(false)
    }

    initializeSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
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
    }),
    [session, user, role, loading],
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
