import { Link } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import {
  formatCurrency,
  getCardImage,
  getCardPrice,
  getCardSetName,
} from '../utils/cards'
import './Card.css'

export default function Card({ card }) {
  const { addToCart } = useCart()
  const price = formatCurrency(getCardPrice(card))

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(card)
  }

  return (
    <article className="card">
      <Link to={`/card/${card.id}`} className="card-link">
        <div className="card-media">
          <img
            src={getCardImage(card)}
            alt={`Carta de ${card.name}`}
            loading="lazy"
          />
          {card.rarity && (
            <span className="card-rarity">{card.rarity}</span>
          )}
        </div>
        <div className="card-body">
          <p className="card-set">{getCardSetName(card)}</p>
          <h3>{card.name}</h3>
          <div className="price-row">
            <p className="price-tag">{price}</p>
            <span className="price-subtext">Precio mercado</span>
          </div>
        </div>
      </Link>
      <button
        type="button"
        className="primary-btn card-add-btn"
        onClick={handleAddToCart}
      >
        Añadir al carrito
      </button>
    </article>
  )
}

