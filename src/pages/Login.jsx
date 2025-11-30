import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const { login, register, loginWithGoogle } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const googleButtonRef = useRef(null)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let result
      if (isLogin) {
        result = await login(formData.username, formData.password)
      } else {
        result = await register(
          formData.username,
          formData.email,
          formData.password
        )
        if (result.success) {
          // Auto login after registration
          const loginResult = await login(formData.username, formData.password)
          if (loginResult.success) {
            navigate('/')
            return
          }
        }
      }

      if (result.success) {
        navigate('/')
      } else {
        setError(result.error || 'Error al procesar la solicitud')
      }
    } catch (error) {
      console.error('Error en autenticación', error)
      setError('Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  // Cargar script de Google Identity y dibujar el botón
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    console.log('Google client ID desde Vite:', clientId)

    if (!clientId) {
      // Si no hay client ID, mostramos un error claro en la UI
      setError('Falta configurar VITE_GOOGLE_CLIENT_ID en el frontend (.env)')
      return
    }

    if (!googleButtonRef.current) return

    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    )

    const onLoad = () => {
      if (!window.google || !googleButtonRef.current) return
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          if (!response.credential) return
          const result = await loginWithGoogle(response.credential)
          if (result.success) {
            navigate('/')
          } else if (result.error) {
            setError(result.error)
          }
        },
      })

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
      })
    }

    if (existingScript) {
      if (existingScript.getAttribute('data-loaded') === 'true') {
        onLoad()
      } else {
        existingScript.addEventListener('load', onLoad)
      }
      return () => {
        existingScript.removeEventListener('load', onLoad)
      }
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      script.setAttribute('data-loaded', 'true')
      onLoad()
    }
    document.body.appendChild(script)

    return () => {
      script.removeEventListener('load', onLoad)
    }
  }, [loginWithGoogle, navigate])

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</h1>

        <button
          type="button"
          className="toggle-auth-btn"
          onClick={() => {
            setIsLogin(!isLogin)
            setError('')
            setFormData({ username: '', email: '', password: '' })
          }}
        >
          {isLogin
            ? '¿No tienes cuenta? Regístrate'
            : '¿Ya tienes cuenta? Inicia sesión'}
        </button>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Tu nombre de usuario"
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="tu@email.com"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="primary-btn large-btn"
            disabled={loading}
          >
            {loading
              ? 'Procesando...'
              : isLogin
                ? 'Iniciar Sesión'
                : 'Registrarse'}
          </button>
        </form>

        <div ref={googleButtonRef} style={{ marginTop: '1rem' }} />

        <Link to="/" className="back-link">
          ← Volver al inicio
        </Link>
      </div>
    </div>
  )
}

