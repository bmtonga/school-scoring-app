import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'

const NAV_ITEMS = [
  { path: '/numeracy', label: 'Numeracy', role: 'numeracy', icon: 'N' },
  { path: '/literacy', label: 'Literacy', role: 'literacy', icon: 'L' },
  { path: '/just-a-minute', label: 'Just a Minute', role: 'just_a_minute', icon: 'J' },
  { path: '/principal', label: 'Principal overview', role: 'principal', icon: 'P' },
]

const roleLabels = {
  numeracy: 'Numeracy team',
  literacy: 'Literacy team',
  just_a_minute: 'Just a Minute team',
  principal: 'Principal',
}

function AppShell({ children, title, description }) {
  const { user, role } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const visibleItems = NAV_ITEMS.filter((item) => item.role === role)
  const isPrincipal = role === 'principal'

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <button
        className="mobile-menu-button"
        type="button"
        aria-label="Open navigation"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
        <span />
        <span />
        <span />
      </button>
      {isOpen ? <button className="sidebar-backdrop" type="button" aria-label="Close navigation" onClick={() => setIsOpen(false)} /> : null}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <Link to={isPrincipal ? '/principal' : visibleItems[0]?.path ?? '/login'} onClick={() => setIsOpen(false)}>
            <span className="brand-mark"><img src={logo} alt="Vinjeru School Trust" /></span>
            <span><strong>School</strong><small>Scoring hub</small></span>
          </Link>
        </div>
        <div className="sidebar-label">Workspace</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {visibleItems.map((item) => (
            <div key={item.path} className="nav-group">
              <NavLink to={item.path} end onClick={() => setIsOpen(false)} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
              {item.role !== 'principal' ? <NavLink to={`${item.path}/students`} onClick={() => setIsOpen(false)} className={({ isActive }) => isActive ? 'nav-subitem active' : 'nav-subitem'}>Students</NavLink> : null}
            </div>
          ))}
          {isPrincipal ? <NavLink to="/manage-classes" onClick={() => setIsOpen(false)} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><span className="nav-icon" aria-hidden="true">+</span><span>Manage classes</span></NavLink> : null}
        </nav>
        <div className="sidebar-footer">
          <div className="account-summary"><span className="avatar">{(user?.email?.[0] ?? 'U').toUpperCase()}</span><span><strong>{user?.email ?? 'Signed in user'}</strong><small>{roleLabels[role] ?? 'Account'}</small></span></div>
          <button className="sign-out-button" type="button" onClick={handleSignOut}>Sign out</button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> {title}</div>
          <div className="topbar-role">{roleLabels[role] ?? 'School Scoring'}</div>
        </header>
        <main className="page-content" data-route={location.pathname}>
          <div className="page-header"><div><p className="eyebrow">{isPrincipal ? 'School leadership' : 'Weekly scoring'}</p><h1>{title}</h1>{description ? <p className="page-description">{description}</p> : null}</div></div>
          {children}
        </main>
      </div>
    </div>
  )
}

export default AppShell
