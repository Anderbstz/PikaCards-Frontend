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

const isTokenExpired = (token) => {
  if (!token) return true
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true
    const payload = JSON.parse(atob(parts[1]))
    if (!payload.exp) return true
    const nowSeconds = Date.now() / 1000
    return payload.exp < nowSeconds
  } catch {
    return true
  }
}

const loadAuthFromLocalStorage = () => {
  try {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored)
    if (!parsed?.token || isTokenExpired(parsed.token)) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }
    return parsed
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

  const loginWithGoogle = async (idToken) => {
    setLoading(true)
    try {
      const response = await fetch(`${AUTH_URL}/google/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: idToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(extractErrorMessage(data, 'Error al iniciar con Google'))
      }

      const authData = {
        user: data.user || null,
        token: data.access,
        refresh: data.refresh,
      }

      // Si Google trae un avatar y aún no tenemos uno guardado para este usuario,
      // lo usamos como foto de perfil por defecto (afecta perfil y chatbot).
      try {
        if (typeof window !== 'undefined' && data.user?.username && data.user?.avatar) {
          const key = `pikacards_profile_${data.user.username}`
          const existing = localStorage.getItem(key)
          if (!existing) {
            localStorage.setItem(key, JSON.stringify({ avatar: data.user.avatar }))
          } else {
            try {
              const parsed = JSON.parse(existing)
              if (!parsed.avatar) {
                localStorage.setItem(key, JSON.stringify({ ...parsed, avatar: data.user.avatar }))
              }
            } catch {
              localStorage.setItem(key, JSON.stringify({ avatar: data.user.avatar }))
            }
          }
        }
      } catch {
        // si falla, simplemente seguimos sin romper el login
      }

      setAuth(authData)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
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
    if (!auth?.token) return false
    if (isTokenExpired(auth.token)) {
      setAuth(null)
      return false
    }
    return true
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
    loginWithGoogle,
    register,
    logout,
    isAuthenticated,
    getAuthHeaders,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

