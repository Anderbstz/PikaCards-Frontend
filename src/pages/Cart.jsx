import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { CHECKOUT_URL } from '../config'
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

    setProcessing(true)
    setError('')

    try {
      // Format cart for backend
      const cartItems = cart.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.qty,
        price: item.price,
        image: item.image,
      }))

      const response = await fetch(CHECKOUT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ cart: cartItems }),
      })

      const data = await response.json()

      if (!response.ok) {
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

