import { useNavigate } from 'react-router-dom'
import './Cancel.css'

export default function Cancel() {
  const navigate = useNavigate()

  return (
    <div className="cancel-container">
      <div className="cancel-card">
        <h1>Pago cancelado</h1>
        <p className="cancel-message">
          Has cancelado el proceso de pago. Puedes revisar tu carrito o seguir explorando.
        </p>
        <div className="cancel-actions">
          <button
            type="button"
            className="primary-btn large-btn"
            onClick={() => navigate('/cart')}
          >
            Volver al carrito
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => navigate('/')}
          >
            Explorar cartas
          </button>
        </div>
        <p className="cancel-hint">
          Si crees que fue un error, intenta nuevamente.
        </p>
      </div>
    </div>
  )
}