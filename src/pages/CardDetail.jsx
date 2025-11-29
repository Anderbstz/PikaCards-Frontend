import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { CARDS_URL } from '../config'
import {
  formatCurrency,
  getCardImage,
  getCardPrice,
  getCardSetName,
} from '../utils/cards'
import './CardDetail.css'

export default function CardDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCard = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`${CARDS_URL}/${id}/`)
        if (!response.ok) {
          throw new Error('Carta no encontrada')
        }
        const data = await response.json()
        setCard(data)
      } catch (fetchError) {
        setError(fetchError.message ?? 'Error al cargar la carta')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchCard()
    }
  }, [id])

  const handleAddToCart = () => {
    if (card) {
      addToCart(card)
    }
  }

  if (loading) {
    return (
      <div className="card-detail-container">
        <p className="status-text">Cargando carta...</p>
      </div>
    )
  }

  if (error || !card) {
    return (
      <div className="card-detail-container">
        <p className="status-text error">{error || 'Carta no encontrada'}</p>
        <button type="button" className="primary-btn" onClick={() => navigate('/')}>
          Volver al inicio
        </button>
      </div>
    )
  }

  const price = formatCurrency(getCardPrice(card))

  return (
    <div className="card-detail-container">
      <button
        type="button"
        className="back-btn"
        onClick={() => navigate(-1)}
      >
        ← Volver
      </button>

      <div className="card-detail-grid">
        <div className="card-detail-image">
          <img src={getCardImage(card)} alt={card.name} />
        </div>

        <div className="card-detail-info">
          <div className="card-detail-header">
            <h1>{card.name}</h1>
            {card.rarity && (
              <span className="rarity-badge">{card.rarity}</span>
            )}
          </div>

          <p className="card-set-label">
            <strong>Set:</strong> {getCardSetName(card)}
          </p>

          {card.types && card.types.length > 0 && (
            <p className="card-type-label">
              <strong>Tipo:</strong> {card.types.join(', ')}
            </p>
          )}

          {card.hp && (
            <p className="card-hp-label">
              <strong>HP:</strong> {card.hp}
            </p>
          )}

          {card.artist && (
            <p className="card-artist-label">
              <strong>Artista:</strong> {card.artist}
            </p>
          )}

          <div className="card-detail-price">
            <span className="price-label">Precio de mercado</span>
            <span className="price-value">{price ?? 'Consultar'}</span>
          </div>

          <button
            type="button"
            className="primary-btn large-btn"
            onClick={handleAddToCart}
          >
            Añadir al carrito
          </button>

          {card.attacks && card.attacks.length > 0 && (
            <div className="card-attacks">
              <h3>Ataques</h3>
              <ul>
                {card.attacks.map((attack, index) => (
                  <li key={index}>
                    <strong>{attack.name}</strong>
                    {attack.damage && <span> - {attack.damage}</span>}
                    {attack.cost && (
                      <span className="attack-cost">
                        {' '}
                        Costo: {attack.cost.join(', ')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

