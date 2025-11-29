import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { CARDS_URL } from '../config'
import { formatCurrency, getCardImage, getCardPrice } from '../utils/cards'
import './Offer.css'

// Catálogo local de ofertas (coinciden con los slides)
const OFFERS = [
  {
    slug: 'rayo-doble',
    title: 'Rayo Doble',
    subtitle: 'Velocidad y presión Lightning',
    combo: 'Zapdos + Wash Rotom',
    priceLabel: 'S/ 31.90',
    cards: ['xy6-23', 'pl2-RT5'],
    includes: [
      '2 cartas originales',
      'Toploader protector incluido',
      'Sleeves premium',
      'Entrega local 30 min (Lima)',
    ],
  },
  {
    slug: 'golpe-de-agua',
    title: 'Golpe de Agua',
    subtitle: 'Control y defensa con Water',
    combo: 'Floatzel GL + Wash Rotom',
    priceLabel: 'S/ 34.50',
    cards: ['pl2-104', 'pl2-RT5'],
    includes: [
      '2 cartas originales',
      'Toploader protector incluido',
      'Sleeves premium',
      'Entrega local 30 min (Lima)',
    ],
  },
  {
    slug: 'psiquicos-legendarios',
    title: 'Psíquicos Legendarios',
    subtitle: 'Estrategia y control Psychic',
    combo: 'Deoxys + Clefable',
    priceLabel: 'S/ 33.90',
    cards: ['col1-2', 'col1-1'],
    includes: [
      '2 cartas originales',
      'Toploader protector incluido',
      'Sleeves premium',
      'Entrega local 30 min (Lima)',
    ],
  },
  {
    slug: 'selva-duo',
    title: 'Selva Dúo',
    subtitle: 'Presión constante desde la hierba',
    combo: 'Cacnea + Caterpie',
    priceLabel: 'S/ 24.50',
    cards: ['ex16-46', 'swsh2-1'],
    includes: [
      '2 cartas originales',
      'Toploader protector incluido',
      'Sleeves premium',
      'Entrega local 30 min (Lima)',
    ],
  },
  {
    slug: 'golpe-de-arena',
    title: 'Golpe de Arena',
    subtitle: 'Dominio del terreno',
    combo: 'Gliscor + Groudon',
    priceLabel: 'S/ 37.50',
    cards: ['hgss3-4', 'col1-6'],
    includes: [
      '2 cartas originales',
      'Toploader protector incluido',
      'Sleeves premium',
      'Entrega local 30 min (Lima)',
    ],
  },
]

export default function Offer() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const offer = useMemo(() => OFFERS.find((o) => o.slug === slug), [slug])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      if (!offer) {
        setError('Oferta no encontrada')
        setLoading(false)
        return
      }
      setLoading(true)
      setError('')
      try {
        const responses = await Promise.all(
          offer.cards.map((id) => fetch(`${CARDS_URL}/${id}/`)),
        )
        const failed = responses.find((r) => !r.ok)
        if (failed) throw new Error('No se pudo cargar la oferta')
        const data = await Promise.all(responses.map((r) => r.json()))
        setItems(data)
      } catch (e) {
        setError(e.message ?? 'Error al cargar la oferta')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [offer])

  const totalPrice = items.reduce((acc, c) => acc + getCardPrice(c), 0)

  const handleBuy = () => {
    items.forEach((card) => addToCart(card))
    navigate('/cart')
  }

  if (!offer) {
    return (
      <div className="offer-container">
        <p className="status-text error">Oferta no encontrada</p>
        <button type="button" className="primary-btn" onClick={() => navigate('/')}>Volver al inicio</button>
      </div>
    )
  }

  return (
    <div className="offer-container">
      <button type="button" className="back-btn" onClick={() => navigate(-1)}>
        ← Volver
      </button>

      <div className="offer-header">
        <p className="hero-label">{offer.combo}</p>
        <h1>{offer.title}</h1>
        <p className="hero-subtitle">{offer.subtitle}</p>
        <p className="offer-blurb">
          {`Incluye: ${(offer.includes || [
            '2 cartas originales',
            'Toploader',
            'Sleeves premium',
          ]).slice(0,3).join(', ')}. `}
          <strong>Stock limitado — ¡aprovecha el combo ahora!</strong>
        </p>
      </div>

      {loading && <p className="status-text">Cargando oferta...</p>}
      {error && !loading && <p className="status-text error">{error}</p>}

      {!loading && !error && (
        <div className="offer-grid">
          <div className="offer-images">
            {items.map((card) => (
              <img key={card.id} src={getCardImage(card)} alt={card.name} />
            ))}
          </div>

          <aside className="offer-info">
            <div className="offer-list">
              {items.map((card) => (
                <div key={card.id} className="offer-item">
                  <strong>{card.name}</strong>
                  <span>{formatCurrency(getCardPrice(card))}</span>
                </div>
              ))}
            </div>
            <div className="offer-total">
              <span>Total</span>
              <strong>{formatCurrency(totalPrice)}</strong>
            </div>
            <button type="button" className="primary-btn" onClick={handleBuy}>
              Comprar ahora
            </button>
          </aside>
        </div>
      )}
    </div>
  )
}