import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import './Success.css'

export default function Success() {
  const { clearCart } = useCart()

  useEffect(() => {
    // Vaciar carrito local al entrar en la vista de éxito
    clearCart()
  }, [clearCart])

  return (
    <div className="success-container">
      <div className="success-card">
        <h1>¡Pago completado!</h1>
        <p className="success-message">
          Gracias por tu compra. Tu pedido está siendo procesado.
        </p>
        <div className="success-actions">
          <Link to="/">
            <button type="button" className="primary-btn large-btn">
              Explorar más cartas
            </button>
          </Link>
          <Link to="/cart">
            <button type="button" className="ghost-btn">
              Ver carrito
            </button>
          </Link>
          <Link to="/history">
            <button type="button" className="ghost-btn">
              Ver historial
            </button>
          </Link>
        </div>
        <p className="success-hint">
          Si necesitas ayuda, contáctanos por soporte.
        </p>
      </div>
    </div>
  )
}