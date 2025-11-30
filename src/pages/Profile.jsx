import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { API_URL, AUTH_URL } from '../config'
import './Profile.css'

const PREF_IMG_SIZE_KEY = 'pikacards_pref_history_img_size'
const PREF_IMG_SIZE_MAP = {
  small: 96,
  medium: 140,
  large: 180,
}

export default function Profile() {
  const navigate = useNavigate()
  const { auth, isAuthenticated, logout, getAuthHeaders } = useAuth()
  const [imgSizePref, setImgSizePref] = useState('medium')
  const [profileData, setProfileData] = useState({ province: '', address: '', avatar: '' })
  const [security, setSecurity] = useState({ current: '', next: '', confirm: '' })
  const [statusMsg, setStatusMsg] = useState('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREF_IMG_SIZE_KEY)
      if (stored && ['small', 'medium', 'large'].includes(stored)) {
        setImgSizePref(stored)
      }
    } catch {}
  }, [])

  // Cargar perfil guardado localmente (provincia, dirección, avatar)
  useEffect(() => {
    try {
      const key = `pikacards_profile_${auth?.user?.username || 'default'}`
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved)
        setProfileData((prev) => ({ ...prev, ...parsed }))
      }
    } catch {}
  }, [auth?.user?.username])

  useEffect(() => {
    try {
      localStorage.setItem(PREF_IMG_SIZE_KEY, imgSizePref)
    } catch {}
  }, [imgSizePref])

  const saveProfileLocal = () => {
    try {
      const key = `pikacards_profile_${auth?.user?.username || 'default'}`
      localStorage.setItem(key, JSON.stringify(profileData))
      setStatusMsg('Datos de perfil guardados localmente')
      setTimeout(() => setStatusMsg(''), 3000)
    } catch {
      setStatusMsg('No se pudo guardar el perfil')
    }
  }

  const handleAvatarChange = async (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setProfileData((p) => ({ ...p, avatar: reader.result }))
    }
    reader.readAsDataURL(file)
  }

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
  const firstName = auth?.user?.first_name || ''
  const lastName = auth?.user?.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim()
  const provinces = [
    'Lima', 'Arequipa', 'Cusco', 'La Libertad', 'Piura', 'Junín', 'Lambayeque', 'Ancash', 'Ica', 'Callao', 'Puno', 'Tacna', 'Ayacucho', 'Cajamarca'
  ]

  const changePassword = async (e) => {
    e.preventDefault()
    setStatusMsg('')
    if (security.next !== security.confirm) {
      setStatusMsg('La nueva contraseña no coincide')
      return
    }
    try {
      const res = await fetch(`${AUTH_URL}/change-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ current_password: security.current, new_password: security.next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al cambiar contraseña')
      setStatusMsg('Contraseña actualizada correctamente')
      setSecurity({ current: '', next: '', confirm: '' })
      setTimeout(() => setStatusMsg(''), 4000)
    } catch (err) {
      setStatusMsg(err.message)
    }
  }

  const deleteAccount = async () => {
    const confirmText = prompt('Escribe DELETE para confirmar eliminación de tu cuenta:')
    if (!confirmText) return
    const password = prompt('Ingresa tu contraseña para confirmar:')
    if (!password) return
    try {
      const res = await fetch(`${AUTH_URL}/delete-account/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ confirm: confirmText, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo eliminar la cuenta')
      logout()
      navigate('/')
    } catch (err) {
      setStatusMsg(err.message)
    }
  }

  const managePaymentMethod = async () => {
    try {
      const res = await fetch(`${API_URL}/billing/portal/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'No se pudo abrir el portal de pagos')
      window.location.href = data.url
    } catch (err) {
      setStatusMsg(err.message)
    }
  }

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
            <div className="avatar" aria-hidden="true">
              {profileData.avatar ? (
                <img src={profileData.avatar} alt="Avatar" />
              ) : '👤'}
            </div>
            <div>
              {fullName && <h2>{fullName}</h2>}
              <p className="muted">@{username}</p>
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
          {statusMsg && <p className="muted" style={{ marginTop: '0.6rem' }}>{statusMsg}</p>}
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

        <section className="profile-card">
          <h3>Datos de envío</h3>
          <div className="pref-row">
            <label>Provincia</label>
            <select
              value={profileData.province}
              onChange={(e) => setProfileData((p) => ({ ...p, province: e.target.value }))}
            >
              <option value="">Selecciona una provincia</option>
              {provinces.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="pref-row">
            <label>Dirección</label>
            <input
              type="text"
              placeholder="Calle, número, referencia..."
              value={profileData.address}
              onChange={(e) => setProfileData((p) => ({ ...p, address: e.target.value }))}
            />
          </div>
          <div className="pref-row">
            <label>Imagen de perfil</label>
            <input type="file" accept="image/*" onChange={(e) => handleAvatarChange(e.target.files?.[0])} />
          </div>
          <button type="button" className="primary-btn" onClick={saveProfileLocal}>Guardar</button>
        </section>

        <section className="profile-card">
          <h3>Seguridad</h3>
          <form onSubmit={changePassword} className="security-form">
            <div className="pref-row">
              <label>Contraseña actual</label>
              <input type="password" value={security.current} onChange={(e) => setSecurity((s) => ({ ...s, current: e.target.value }))} />
            </div>
            <div className="pref-row">
              <label>Nueva contraseña</label>
              <input type="password" value={security.next} onChange={(e) => setSecurity((s) => ({ ...s, next: e.target.value }))} />
            </div>
            <div className="pref-row">
              <label>Confirmar nueva contraseña</label>
              <input type="password" value={security.confirm} onChange={(e) => setSecurity((s) => ({ ...s, confirm: e.target.value }))} />
            </div>
            <button type="submit" className="primary-btn">Cambiar contraseña</button>
          </form>
          <hr style={{ margin: '1rem 0' }} />
          <button type="button" className="danger-btn" onClick={deleteAccount}>Eliminar cuenta</button>
        </section>

        <section className="profile-card">
          <h3>Método de pago</h3>
          <p className="muted">Gestiona tus tarjetas y pagos desde el portal seguro de Stripe.</p>
          <button type="button" className="primary-btn" onClick={managePaymentMethod}>Gestionar método de pago</button>
        </section>
      </div>
    </div>
  )
}