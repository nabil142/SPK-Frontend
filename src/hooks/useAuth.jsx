import { createContext, useContext, useState, useCallback } from 'react'
import { login as loginAPI } from '../services/api'

const AuthContext = createContext(null)

const DUMMY = { username: 'admin', password: 'admin123', role: 'admin', user_id: 1 }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem('spk_user')
      return s ? JSON.parse(s) : null
    } catch { return null }
  })

  // login(username, password) — 2 argumen terpisah sesuai LoginPage
  const login = useCallback(async (username, password) => {
    try {
      const { data } = await loginAPI({ username, password })
      const userData = data.user || data
      localStorage.setItem('spk_token', data.access_token || 'token')
      localStorage.setItem('spk_user', JSON.stringify(userData))
      setUser(userData)
      return { success: true }
    } catch {
      // Fallback dummy untuk development
      if (username === DUMMY.username && password === DUMMY.password) {
        const userData = { user_id: 1, username: DUMMY.username, role: DUMMY.role }
        localStorage.setItem('spk_token', 'dummy_token_dev')
        localStorage.setItem('spk_user', JSON.stringify(userData))
        setUser(userData)
        return { success: true }
      }
      return { success: false, message: 'Username atau password salah.' }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('spk_token')
    localStorage.removeItem('spk_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)