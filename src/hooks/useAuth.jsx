import { createContext, useContext, useState } from 'react'
import { login as loginApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('spk_user')
    return stored ? JSON.parse(stored) : null
  })

  const login = async (username, password) => {
    try {
      const res = await loginApi({ username, password })
      const { token, user: userData } = res.data
      localStorage.setItem('spk_token', token)
      localStorage.setItem('spk_user', JSON.stringify(userData))
      setUser(userData)
      return { success: true }
    } catch (err) {
      // Fallback to dummy login for demo
      if (username === 'admin' && password === 'admin123') {
        const dummyUser = { user_id: 1, username: 'admin', role: 'admin' }
        const dummyToken = 'dummy-token-12345'
        localStorage.setItem('spk_token', dummyToken)
        localStorage.setItem('spk_user', JSON.stringify(dummyUser))
        setUser(dummyUser)
        return { success: true }
      }
      return { success: false, message: err.response?.data?.detail || 'Login gagal' }
    }
  }

  const logout = () => {
    localStorage.removeItem('spk_token')
    localStorage.removeItem('spk_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
