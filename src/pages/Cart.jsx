import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { CHECKOUT_URL, API_URL } from '../config'
import { FALLBACK_CARD_IMAGE, formatCurrency } from '../utils/cards'
import './Cart.css'

export default function Cart() {
  const navigate = useNavigate()
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart()
  const { isAuthenticated, getAuthHeaders } = useAuth()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  const handleCheckout = async () => {
    if (!isAuthenticated()) {
      setError('Debes iniciar sesión para continuar con el pago')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
      return
    }

    if (cart.length === 0) {
      setError('El carrito está vacío')
      return
    }

    // Validar datos de envío en Perfil (provincia y dirección)
    try {
      const authKey = `pikacards_profile_${(JSON.parse(localStorage.getItem('pikacards_auth'))?.user?.username) || 'default'}`
      const savedProfile = localStorage.getItem(authKey)
      const parsed = savedProfile ? JSON.parse(savedProfile) : {}
      const hasAddress = Boolean((parsed.address || '').trim())
      const hasProvince = Boolean((parsed.province || '').trim())
      if (!hasAddress || !hasProvince) {
        setError('Necesitas completar tu dirección de envío (provincia y dirección) en tu Perfil antes de pagar.')
        setTimeout(() => navigate('/profile'), 1500)
        return
      }
    } catch (_) {
      setError('No pudimos verificar tu dirección. Actualiza tu Perfil antes de pagar.')
      setTimeout(() => navigate('/profile'), 1500)
      return
    }

    setProcessing(true)
    setError('')

    try {
      // Asegurar que el carrito del backend esté sincronizado con el local
      try {
        const res = await fetch(`${API_URL}/cart/`, {
          headers: { ...getAuthHeaders() },
        })
        const serverItems = res.ok ? await res.json() : []
        if ((!Array.isArray(serverItems) || serverItems.length === 0) && cart.length > 0) {
          for (const item of cart) {
            for (let i = 0; i < item.qty; i++) {
              await fetch(`${API_URL}/cart/add/`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...getAuthHeaders(),
                },
                body: JSON.stringify({ card_id: item.id }),
              })
            }
          }
        }
      } catch (syncError) {
        console.error('Error sincronizando carrito con backend:', syncError)
      }

      // Solicitar checkout usando el carrito persistido en backend
      const response = await fetch(CHECKOUT_URL, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
        },
      })

      // Manejo robusto: si no es JSON, leer como texto para evitar "Unexpected token <"
      const contentType = response.headers.get('content-type') || ''
      let data
      if (contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const text = await response.text()
        data = { error: text }
      }

      if (!response.ok) {
        // Mensaje claro según estado
        if (response.status === 401) {
          throw new Error('Tu sesión expiró. Inicia sesión nuevamente.')
        }
        throw new Error(data.error || 'Error al crear sesión de pago')
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        throw new Error('No se recibió URL de pago')
      }
    } catch (fetchError) {
      setError(fetchError.message ?? 'Error al procesar el pago')
      setProcessing(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="cart-container">
        <h1>Carrito de Compras</h1>
        <div className="empty-cart">
          <p>Tu carrito está vacío</p>
          <button
            type="button"
            className="primary-btn"
            onClick={() => navigate('/')}
          >
            Explorar Cartas
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-container">
      <h1>Carrito de Compras</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="cart-content">
        <div className="cart-items">
          {cart.map((item) => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-image">
                <img
                  src={item.image || FALLBACK_CARD_IMAGE}
                  alt={item.name}
                  onError={(event) => {
                    event.currentTarget.src = FALLBACK_CARD_IMAGE
                  }}
                />
              </div>
              <div className="cart-item-info">
                <h3>{item.name}</h3>
                <p className="cart-item-price">{formatCurrency(item.price)}</p>
              </div>
              <div className="cart-item-controls">
                <div className="quantity-controls">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.qty - 1)}
                    className="quantity-btn"
                  >
                    −
                  </button>
                  <span className="quantity-value">{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.qty + 1)}
                    className="quantity-btn"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.id)}
                  className="remove-btn"
                >
                  Eliminar
                </button>
              </div>
              <div className="cart-item-total">
                {formatCurrency(parseFloat(item.price) * item.qty)}
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <div className="summary-card">
            <h2>Resumen</h2>
            {/* Hint si falta dirección (sin bloquear aquí, el bloqueo está en handleCheckout) */}
            {(() => {
              try {
                const authKey = `pikacards_profile_${(JSON.parse(localStorage.getItem('pikacards_auth'))?.user?.username) || 'default'}`
                const savedProfile = localStorage.getItem(authKey)
                const parsed = savedProfile ? JSON.parse(savedProfile) : {}
                const hasAddress = Boolean((parsed.address || '').trim())
                const hasProvince = Boolean((parsed.province || '').trim())
                if (!hasAddress || !hasProvince) {
                  return (
                    <div className="error-message" style={{ marginBottom: '0.6rem' }}>
                      Completa tu dirección de envío en <button type="button" className="link-btn" onClick={() => navigate('/profile')}>Perfil</button>.
                    </div>
                  )
                }
              } catch {}
              return null
            })()}
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatCurrency(cartTotal())}</span>
            </div>
            <div className="summary-row">
              <span>Envío</span>
              <span>Gratis</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row total">
              <span>Total</span>
              <span>{formatCurrency(cartTotal())}</span>
            </div>
            <button
              type="button"
              className="primary-btn large-btn checkout-btn"
              onClick={handleCheckout}
              disabled={processing}
            >
              {processing ? 'Procesando...' : 'Pagar ahora'}
            </button>
            {!isAuthenticated() && (
              <p className="login-hint">
                Debes iniciar sesión para continuar
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

