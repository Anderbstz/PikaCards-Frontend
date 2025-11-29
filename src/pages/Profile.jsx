import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Profile.css'

const PREF_IMG_SIZE_KEY = 'pikacards_pref_history_img_size'
const PREF_IMG_SIZE_MAP = {
  small: 96,
  medium: 140,
  large: 180,
}

export default function Profile() {
  const navigate = useNavigate()
  const { auth, isAuthenticated, logout } = useAuth()
  const [imgSizePref, setImgSizePref] = useState('medium')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREF_IMG_SIZE_KEY)
      if (stored && ['small', 'medium', 'large'].includes(stored)) {
        setImgSizePref(stored)
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(PREF_IMG_SIZE_KEY, imgSizePref)
    } catch {}
  }, [imgSizePref])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (!isAuthenticated()) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <h1>Perfil</h1>
          <p className="status-text">Debes iniciar sesión para ver tu perfil.</p>
          <button type="button" className="primary-btn" onClick={() => navigate('/login')}>
            Iniciar sesión
          </button>
        </div>
      </div>
    )
  }

  const username = auth?.user?.username ?? 'Entrenador'
  const email = auth?.user?.email ?? ''

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Mi perfil</h1>
        <button type="button" className="back-btn" onClick={() => navigate(-1)}>
          ← Volver
        </button>
      </div>

      <div className="profile-grid">
        <section className="profile-card">
          <div className="profile-identity">
            <div className="avatar" aria-hidden="true">👤</div>
            <div>
              <h2>{username}</h2>
              {email && <p className="muted">{email}</p>}
            </div>
          </div>
          <div className="profile-actions">
            <button type="button" className="ghost-btn" onClick={() => navigate('/history')}>
              Ver historial
            </button>
            <button type="button" className="ghost-btn" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </section>

        <section className="profile-card">
          <h3>Preferencias</h3>
          <div className="pref-row">
            <label>Tamaño de imagen en historial</label>
            <div className="pref-options">
              {['small', 'medium', 'large'].map((opt) => (
                <label key={opt} className={imgSizePref === opt ? 'is-active' : ''}>
                  <input
                    type="radio"
                    name="imgSize"
                    value={opt}
                    checked={imgSizePref === opt}
                    onChange={(e) => setImgSizePref(e.target.value)}
                  />
                  {opt === 'small' ? 'Pequeña' : opt === 'medium' ? 'Mediana' : 'Grande'}
                </label>
              ))}
            </div>
            <p className="muted">Actual: {PREF_IMG_SIZE_MAP[imgSizePref]}px</p>
          </div>

          <div className="pref-row">
            <label>Accesos rápidos</label>
            <div className="quick-links">
              <button type="button" className="ghost-btn" onClick={() => navigate('/search')}>
                Buscar cartas
              </button>
              <button type="button" className="ghost-btn" onClick={() => navigate('/cart')}>
                Ver carrito
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}