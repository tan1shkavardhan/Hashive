import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import { Hash, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const strength = (p) => {
    if (!p) return 0
    let s = 0
    if (p.length >= 8) s++; if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  }
  const s = strength(form.password)
  const sLabel = ['', 'WEAK', 'FAIR', 'GOOD', 'STRONG'][s]
  const sColor = ['', 'text-danger', 'text-warn', 'text-info', 'text-accent'][s]
  const sBg = ['', 'bg-danger', 'bg-warn', 'bg-info', 'bg-accent'][s]

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    setLoading(true)
    try { await register(form.username, form.email, form.password); navigate('/dashboard') }
    catch (err) { setError(err.response?.data?.detail || 'Registration failed.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-accent flex items-center justify-center border-2 border-void shadow-brutal">
              <Hash className="w-8 h-8 text-void" strokeWidth={3} />
            </div>
          </div>
          <h1 className="font-display text-5xl font-extrabold text-accent tracking-widest">HASHIVE</h1>
          <p className="text-text-dim font-mono text-xs mt-2 tracking-widest">INTELLIGENT FILE STORAGE OPTIMIZATION SYSTEM</p>
        </div>

        <div className="bg-surface border-2 border-border shadow-brutal p-8">
          <div className="border-b-2 border-border pb-4 mb-6">
            <div className="text-[10px] font-mono text-muted tracking-widest">// NEW_USER_INIT</div>
            <h2 className="font-display text-2xl font-bold text-text mt-1">Create Account</h2>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 bg-danger/10 border-2 border-danger px-4 py-3 text-danger text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono font-bold text-muted tracking-widest mb-2">USERNAME</label>
              <input type="text" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                className="w-full bg-panel border-2 border-border px-4 py-3 text-text font-mono text-sm focus:border-accent transition-colors"
                placeholder="your_username" required />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-bold text-muted tracking-widest mb-2">EMAIL</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full bg-panel border-2 border-border px-4 py-3 text-text font-mono text-sm focus:border-accent transition-colors"
                placeholder="you@example.com" required />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-bold text-muted tracking-widest mb-2">PASSWORD</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full bg-panel border-2 border-border px-4 py-3 pr-12 text-text font-mono text-sm focus:border-accent transition-colors"
                  placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-accent">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">{[1,2,3,4].map(i => (
                    <div key={i} className={`h-1 flex-1 ${i <= s ? sBg : 'bg-border'} transition-all`} />
                  ))}</div>
                  <span className={`text-[10px] font-mono font-bold ${sColor}`}>{sLabel}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-mono font-bold text-muted tracking-widest mb-2">CONFIRM PASSWORD</label>
              <div className="relative">
                <input type="password" value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                  className="w-full bg-panel border-2 border-border px-4 py-3 pr-10 text-text font-mono text-sm focus:border-accent transition-colors"
                  placeholder="••••••••" required />
                {form.confirm && form.password === form.confirm && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
                )}
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-accent text-void font-mono font-bold text-sm tracking-widest py-4 border-2 border-accent shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {loading ? 'INITIALIZING...' : 'INITIALIZE ACCOUNT →'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-border text-center">
            <span className="text-muted font-mono text-xs">HAVE ACCOUNT? </span>
            <Link to="/login" className="text-accent font-mono text-xs font-bold hover:underline">AUTHENTICATE →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}