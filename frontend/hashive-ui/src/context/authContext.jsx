import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('hashive_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
  const storedToken = localStorage.getItem('hashive_token')

  if (storedToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`

    axios.get(`${API}/auth/me`)
      .then(r => setUser(r.data))
      .catch(err => {
        console.log("AUTH ERROR:", err)
        localStorage.removeItem('hashive_token')
        setUser(null)
      })
      .finally(() => setLoading(false))
  } else {
    setLoading(false)
  }
}, [])

  const login = async (username, password) => {
    const form = new FormData()
    form.append('username', username)
    form.append('password', password)
    const r = await axios.post(`${API}/auth/login`, form)
    const t = r.data.access_token
    localStorage.setItem('hashive_token', t)
    window.location.href="/dashboard"
  }

  const register = async (username, email, password) => {
    await axios.post(`${API}/auth/register`, { username, email, password })
    return login(username, password)
  }

  const logout = () => {
    localStorage.removeItem('hashive_token')
    delete axios.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, API }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)