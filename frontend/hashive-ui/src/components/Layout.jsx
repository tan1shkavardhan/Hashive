import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import { LayoutDashboard, Files, BarChart3, LogOut, Hash, Menu, X, User } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'DASHBOARD' },
  { to: '/files', icon: Files, label: 'MY FILES' },
  { to: '/analytics', icon: BarChart3, label: 'ANALYTICS' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const location = useLocation()

  const handleLogout = async () => {
    setLoggingOut(true)
    setTimeout(() => {
      logout()
      navigate('/login')
    }, 400)
  }

  const pageTitle = navItems.find(n => location.pathname.startsWith(n.to))?.label || 'HASHIVE'

  return (
    <div className="min-h-screen grid-bg flex flex-col">

      {/* ── TOP NAVBAR ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-surface border-b-2 border-border flex items-center justify-between px-4 md:px-6 h-14">

        {/* Left: Logo + App name */}
        <div className="flex items-center gap-3">
          <button className="md:hidden text-text-dim hover:text-accent mr-1" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-accent flex items-center justify-center border-2 border-void shadow-brutal-sm shrink-0">
              <Hash className="w-4 h-4 text-void" strokeWidth={3} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xl font-extrabold text-accent tracking-widest leading-none">HASHIVE</span>
              <span className="text-[9px] font-mono text-muted hidden sm:block">v1.0</span>
            </div>
          </div>

          {/* Breadcrumb separator on md+ */}
          <div className="hidden md:flex items-center gap-2 ml-2 pl-3 border-l border-border">
            <span className="text-muted font-mono text-xs">/</span>
            <span className="text-text-dim font-mono text-xs font-bold tracking-widest">{pageTitle}</span>
          </div>
        </div>

        {/* Center: Nav links (desktop) */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 font-mono text-[11px] font-bold tracking-widest border-2 transition-all duration-150
                ${isActive
                  ? 'bg-accent text-void border-accent'
                  : 'text-text-dim border-transparent hover:border-border hover:text-accent'}`
              }
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right: User + Logout */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-panel border border-border">
            <User className="w-3 h-3 text-muted" />
            <span className="font-mono text-xs text-text-dim font-bold">{user?.username}</span>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 px-3 py-2 font-mono text-[11px] font-bold tracking-widest border-2 border-danger text-danger hover:bg-danger hover:text-void transition-all duration-150 disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span className="hidden sm:block">{loggingOut ? '...' : 'LOGOUT'}</span>
          </button>
        </div>
      </header>

      {/* ── MOBILE SIDEBAR ─────────────────────────────────────── */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed top-14 left-0 bottom-0 w-64 bg-surface border-r-2 border-border z-50 md:hidden p-4 space-y-2 animate-slide-in">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 font-mono text-xs font-bold tracking-widest border-2 transition-all
                  ${isActive ? 'bg-accent text-void border-accent' : 'text-text-dim border-border hover:border-accent hover:text-accent'}`
                }
              >
                <Icon className="w-4 h-4" strokeWidth={2.5} />
                {label}
              </NavLink>
            ))}
            <div className="pt-4 border-t border-border">
              <div className="text-[10px] text-muted font-mono mb-1">LOGGED IN AS</div>
              <div className="text-accent font-mono text-sm font-bold">{user?.username}</div>
              <div className="text-text-dim text-[10px] font-mono">{user?.email}</div>
            </div>
          </div>
        </>
      )}

      {/* ── STATUS BAR ─────────────────────────────────────────── */}
      <div className="bg-void border-b border-border px-6 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[9px] font-mono text-muted">
          <span>SHA-256</span>
          <span className="text-border">·</span>
          <span>GZIP</span>
          <span className="text-border">·</span>
          <span>DEDUP</span>
          <span className="text-border">·</span>
          <span>REST API</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[9px] font-mono text-accent">SYSTEM ONLINE</span>
        </div>
      </div>

      {/* ── MAIN CONTENT ───────────────────────────────────────── */}
      <main className="flex-1 p-4 md:p-6 animate-fade-in">
        <Outlet />
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="border-t border-border px-6 py-2 flex items-center justify-between">
        <span className="text-[9px] font-mono text-muted">HASHIVE v1.0 // MEDICAPS UNIVERSITY // CSE // 2026</span>
        <span className="text-[9px] font-mono text-muted">TANISHKA CHOUHAN // EN23CS3011069</span>
      </footer>
    </div>
  )
}