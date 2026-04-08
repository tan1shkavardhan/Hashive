import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import { Hash, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await login(form.username, form.password); navigate('/dashboard') }
    catch (err) { setError(err.response?.data?.detail || 'Login failed. Check credentials.') }
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
          <p className="text-muted font-mono text-[10px] mt-1">MEDICAPS UNIVERSITY // CSE // 2026</p>
        </div>

        <div className="bg-surface border-2 border-border shadow-brutal p-8">
          <div className="border-b-2 border-border pb-4 mb-6">
            <div className="text-[10px] font-mono text-muted tracking-widest">// AUTHENTICATE</div>
            <h2 className="font-display text-2xl font-bold text-text mt-1">Sign In</h2>
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
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-accent text-void font-mono font-bold text-sm tracking-widest py-4 border-2 border-accent shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE →'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-border text-center">
            <span className="text-muted font-mono text-xs">NO ACCOUNT? </span>
            <Link to="/register" className="text-accent font-mono text-xs font-bold hover:underline">REGISTER →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
