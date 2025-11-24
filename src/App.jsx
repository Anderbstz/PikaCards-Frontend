import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/cards/clean/'

const heroSlides = [
  {
    id: 'slide-1',
    title: 'Black Friday Retro',
    subtitle: 'Hasta 30% de descuento en cartas Kanto',
    combo: 'Combo Pikachu + Charizard',
    priceLabel: 'S/ 29.90',
    image: 'https://images.pokemontcg.io/swsh4/25_hires.png',
  },
  {
    id: 'slide-2',
    title: 'Elite Trainer Drop',
    subtitle: 'Cartas Holo garantizadas',
    combo: 'Selección Johto Legendaria',
    priceLabel: 'S/ 39.50',
    image: 'https://images.pokemontcg.io/swsh7/103_hires.png',
  },
  {
    id: 'slide-3',
    title: 'Neo Nostalgia',
    subtitle: 'Bundles especiales de coleccionistas',
    combo: 'Mew vs Celebi',
    priceLabel: 'S/ 33.90',
    image: 'https://images.pokemontcg.io/swsh45/18_hires.png',
  },
]

const collectionFilters = [
  'Kanto',
  'Johto',
  'Holo',
  'Legendarias',
  'Full Art',
  'Competitivo',
  'Promo',
  'Bundles',
]

const rarityFilters = ['all', 'Common', 'Uncommon', 'Rare', 'Ultra Rare', 'Promo']

const formatCurrency = (amount) => {
  const value = Number(amount)
  if (Number.isNaN(value) || value <= 0) return null
  return `S/ ${value.toFixed(2)}`
}

const fallbackImage = 'https://images.pokemontcg.io/base1/4.png'

function Card({ card }) {
  const price = formatCurrency(card.price)
  return (
    <article className="card">
      <div className="card-media">
        <img
          src={card.image ?? fallbackImage}
          alt={`Carta de ${card.name}`}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = fallbackImage
          }}
        />
        <span className="card-rarity">{card.rarity ?? 'Sin rareza'}</span>
      </div>
      <div className="card-body">
        <p className="card-set">{card.set ?? 'Set por confirmar'}</p>
        <h3>{card.name}</h3>
        <div className="price-row">
          <p className="price-tag">{price ?? 'Consultar'}</p>
          <span className="price-subtext">Precio mercado</span>
        </div>
        <button type="button" className="primary-btn">
          Añadir al carrito
        </button>
      </div>
    </article>
  )
}

function App() {
  const [cards, setCards] = useState([])
  const [search, setSearch] = useState('')
  const [rarity, setRarity] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const fetchCards = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(API_URL)
      if (!response.ok) {
        throw new Error('No pudimos cargar las cartas, intenta de nuevo.')
      }
      const payload = await response.json()
      const cleaned = Array.isArray(payload)
        ? payload
        : payload?.results ?? payload?.data ?? []
      setCards(cleaned)
    } catch (fetchError) {
      setError(fetchError.message ?? 'Error inesperado.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCards()
  }, [])

  const filteredCards = useMemo(() => {
    if (!cards.length) return []
    return cards.filter((card) => {
      const matchesName = card.name
        ?.toLowerCase()
        .includes(search.toLowerCase())
      const matchesRarity =
        rarity === 'all' || (card.rarity ?? '').toLowerCase() === rarity.toLowerCase()

      return matchesName && matchesRarity
    })
  }, [cards, search, rarity])

  return (
    <div className="app-shell">
      <header className="announcement-bar">
        <p>¡Entrenador! Entregamos pedidos en 30 minutos en Lima Metropolitana.</p>
        <span>#MenoresNiUnaCarta</span>
      </header>

      <nav className="main-nav">
        <div className="brand">
          <span role="img" aria-label="Pikachu">
            ⚡
          </span>
          <div>
            <strong>PikaCards</strong>
            <small>TCG Retro Store</small>
          </div>
        </div>

        <div className="nav-location">
          <p>¿Dónde quieres pedir?</p>
          <button type="button">
            Miraflores <span aria-hidden="true">▾</span>
          </button>
        </div>

        <div className="nav-search">
          <input
            type="search"
            placeholder="Buscar carta, set o artista"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="button" className="ghost-btn">
            🔍
          </button>
        </div>

        <div className="nav-icons">
          <button type="button" className="ghost-btn" aria-label="Historial">
            🕓
          </button>
          <button type="button" className="ghost-btn" aria-label="Ingresar">
            🔐
          </button>
          <button type="button" className="ghost-btn" aria-label="Carrito">
            🛒
          </button>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-carousel">
          {heroSlides.map((slide, index) => (
            <article
              key={slide.id}
              className={`hero-card ${index === activeSlide ? 'is-active' : ''}`}
            >
              <div className="hero-copy">
                <p className="hero-label">{slide.combo}</p>
                <h1>{slide.title}</h1>
                <p className="hero-subtitle">{slide.subtitle}</p>
                <div className="hero-cta">
                  <span className="hero-price">{slide.priceLabel}</span>
                  <button type="button" className="primary-btn">
                    Comprar ahora
                  </button>
                </div>
              </div>
              <img src={slide.image} alt={slide.title} />
            </article>
          ))}
          <div className="hero-indicators">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={index === activeSlide ? 'is-active' : ''}
                onClick={() => setActiveSlide(index)}
                aria-label={`Ir al slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
        <aside className="hero-side">
          <div className="stat-card">
            <p>Entrega promedio</p>
            <strong>30 min</strong>
            <small>Solo Lima</small>
          </div>
          <div className="stat-card">
            <p>Cartas activas</p>
            <strong>{cards.length || '—'}</strong>
            <small>Actualizado en vivo</small>
          </div>
          <div className="stat-card">
            <p>Protección</p>
            <strong>Toploader</strong>
            <small>Incluida en combos</small>
          </div>
        </aside>
      </section>

      <section className="category-strip">
        {collectionFilters.map((label) => (
          <button key={label} type="button">
            {label}
          </button>
        ))}
      </section>

      <section className="filters-panel">
        <div className="filter-group">
          <p>Rareza</p>
          <div className="filter-buttons">
            {rarityFilters.map((option) => (
              <button
                key={option}
                type="button"
                className={rarity === option ? 'is-active' : ''}
                onClick={() => setRarity(option)}
              >
                {option === 'all' ? 'Todas' : option}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-actions">
          <button type="button" className="ghost-btn" onClick={fetchCards}>
            Recargar catálogo
          </button>
        </div>
      </section>

      <main className="cards-section">
        <div className="section-header">
          <div>
            <h2>Cartas destacadas</h2>
            <p>Basado en la API oficial de Pokémon TCG</p>
          </div>
          <span>{filteredCards.length} resultados</span>
        </div>

        {loading && <p className="status-text">Cargando cartas...</p>}
        {error && !loading && <p className="status-text error">{error}</p>}
        {!loading && !error && filteredCards.length === 0 && (
          <p className="status-text">No encontramos cartas con ese filtro.</p>
        )}

        <div className="cards-grid">
          {!loading &&
            !error &&
            filteredCards.slice(0, 12).map((card) => <Card key={card.id} card={card} />)}
        </div>
      </main>

      <footer className="app-footer">
        <p>Pokémon TCG data © Pokémon. PikaCards es un fan store independiente.</p>
        <p>
          Backend protegido con Django — Endpoint{' '}
          <code>/api/cards/clean/</code>
        </p>
      </footer>
    </div>
  )
}

export default App
