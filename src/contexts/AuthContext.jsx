/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'
import { AUTH_URL } from '../config'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

const AUTH_STORAGE_KEY = 'pikacards_auth'

const loadAuthFromLocalStorage = () => {
  try {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

const saveAuthToLocalStorage = (auth) => {
  try {
    if (typeof window === 'undefined') return
    if (auth) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  } catch (error) {
    console.error('Error saving auth:', error)
  }
}

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(loadAuthFromLocalStorage)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    saveAuthToLocalStorage(auth)
  }, [auth])

  const extractErrorMessage = (payload, fallback) => {
    if (!payload) return fallback
    if (typeof payload === 'string') return payload
    if (payload.error) return payload.error
    if (payload.message) return payload.message
    const firstKey = Object.keys(payload)[0]
    const firstValue = payload[firstKey]
    if (Array.isArray(firstValue)) {
      return firstValue[0]
    }
    if (typeof firstValue === 'string') {
      return firstValue
    }
    return fallback
  }

  const login = async (username, password) => {
    setLoading(true)
    try {
      const response = await fetch(`${AUTH_URL}/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(extractErrorMessage(data, 'Error al iniciar sesión'))
      }

      const authData = {
        user: data.user || { username },
        token: data.access,
        refresh: data.refresh,
      }

      setAuth(authData)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const register = async (username, email, password) => {
    setLoading(true)
    try {
      const response = await fetch(`${AUTH_URL}/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(extractErrorMessage(data, 'Error al registrar'))
      }

      return { success: true, message: data.message }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setAuth(null)
  }

  const isAuthenticated = () => {
    return !!auth?.token
  }

  const getAuthHeaders = () => {
    if (!auth?.token) return {}
    return {
      Authorization: `Bearer ${auth.token}`,
    }
  }

  const value = {
    auth,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    getAuthHeaders,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

