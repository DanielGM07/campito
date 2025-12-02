// File: frontend/src/context/AuthContext.jsx

import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api/http'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    async function fetchMe() {
      try {
        const res = await api.get('me')
        if (isMounted) setUser(res.user)
      } catch (err) {
        if (isMounted) setUser(null)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchMe()
    return () => {
      isMounted = false
    }
  }, [])

  const login = async (email, password) => {
    const res = await api.post('auth_login', { email, password })
    setUser(res.user)
  }

  const logout = async () => {
    try {
      await api.post('auth_logout')
    } catch (e) {
      // ignore
    }
    setUser(null)
  }

  const registerPlayer = async (payload) => {
    const res = await api.post('auth_register_player', payload)
    setUser(res.user)
  }

  const value = {
    user,
    loading,
    login,
    logout,
    registerPlayer,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
