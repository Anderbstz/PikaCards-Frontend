import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/Card'
import { CARDS_URL, API_URL } from '../config'
import './Home.css'

// Ofertas locales para el carrusel (dos cartas por oferta y slug propio)
const heroSlides = [
  {
    id: 'slide-1',
    title: 'Rayo Doble',
    subtitle: 'Velocidad y presión Lightning',
    combo: 'Zapdos + Wash Rotom',
    priceLabel: 'S/ 31.90',
    offerSlug: 'rayo-doble',
    cards: ['xy6-23', 'pl2-RT5'],
    images: [
      'https://images.pokemontcg.io/xy6/23.png',
      'https://images.pokemontcg.io/pl2/RT5.png',
    ],
    includes: ['2 cartas originales', 'Toploader', 'Sleeves premium'],
  },
  {
    id: 'slide-2',
    title: 'Golpe de Agua',
    subtitle: 'Control y defensa con Water',
    combo: 'Floatzel GL + Wash Rotom',
    priceLabel: 'S/ 34.50',
    offerSlug: 'golpe-de-agua',
    cards: ['pl2-104', 'pl2-RT5'],
    images: [
      'https://images.pokemontcg.io/pl2/104.png',
      'https://images.pokemontcg.io/pl2/RT5.png',
    ],
    includes: ['2 cartas originales', 'Toploader', 'Sleeves premium'],
  },
  {
    id: 'slide-3',
    title: 'Psíquicos Legendarios',
    subtitle: 'Estrategia y control Psychic',
    combo: 'Deoxys + Clefable',
    priceLabel: 'S/ 33.90',
    offerSlug: 'psiquicos-legendarios',
    cards: ['col1-2', 'col1-1'],
    images: [
      'https://images.pokemontcg.io/col1/2.png',
      'https://images.pokemontcg.io/col1/1.png',
    ],
    includes: ['2 cartas originales', 'Toploader', 'Sleeves premium'],
  },
  {
    id: 'slide-4',
    title: 'Selva Dúo',
    subtitle: 'Presión constante desde la hierba',
    combo: 'Cacnea + Caterpie',
    priceLabel: 'S/ 24.50',
    offerSlug: 'selva-duo',
    cards: ['ex16-46', 'swsh2-1'],
    images: [
      'https://images.pokemontcg.io/ex16/46.png',
      'https://images.pokemontcg.io/swsh2/1.png',
    ],
    includes: ['2 cartas originales', 'Toploader', 'Sleeves premium'],
  },
  {
    id: 'slide-5',
    title: 'Golpe de Arena',
    subtitle: 'Dominio del terreno',
    combo: 'Gliscor + Groudon',
    priceLabel: 'S/ 37.50',
    offerSlug: 'golpe-de-arena',
    cards: ['hgss3-4', 'col1-6'],
    images: [
      'https://images.pokemontcg.io/hgss3/4.png',
      'https://images.pokemontcg.io/col1/6.png',
    ],
    includes: ['2 cartas originales', 'Toploader', 'Sleeves premium'],
  },
]

// Los filtros de la franja ahora se basan en tipos reales del backend

export default function Home() {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeSlide, setActiveSlide] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 20
  const [typeFilters, setTypeFilters] = useState([])

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const fetchCards = useCallback(async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(
        `${CARDS_URL}/?page=${page}&pageSize=${pageSize}`,
      )
      if (!response.ok) {
        throw new Error('No pudimos cargar las cartas, intenta de nuevo.')
      }
      const data = await response.json()
      if (Array.isArray(data)) {
        setCards(data)
        setTotalPages(1)
      } else {
        setCards(data.results ?? [])
        const totalCount = data.total ?? data.count ?? data.results?.length ?? 0
        setTotalPages(Math.max(1, Math.ceil(totalCount / pageSize)))
      }
    } catch (fetchError) {
      setError(fetchError.message ?? 'Error inesperado.')
    } finally {
      setLoading(false)
    }
  }, [pageSize])

  useEffect(() => {
    fetchCards(currentPage)
  }, [currentPage, fetchCards])

  // Cargar tipos desde el backend para la franja de categorías
  useEffect(() => {
    let ignore = false
    const loadTypes = async () => {
      try {
        const res = await fetch(`${API_URL}/cards/types/`)
        if (res.ok) {
          const data = await res.json()
          if (!ignore) setTypeFilters(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        // Si falla, dejamos los tipos vacíos y mostraremos una lista por defecto
        console.error('Error cargando tipos:', err)
      }
    }
    loadTypes()
    return () => {
      ignore = true
    }
  }, [])

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
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
                <p className="hero-blurb">
                  Incluye: {(slide.includes || []).join(', ')}.{" "}
                  <strong>Stock limitado — ¡aprovecha el combo!</strong>
                </p>
                {/* Imágenes en móvil: entre descripción y botones.
                    Mostramos las dos cartas del combo, y el CSS se encarga
                    de ponerlas lado a lado o apiladas según el ancho. */}
                <div className="hero-images hero-images--mobile">
                  {(slide.images || []).map((src, idx) => (
                    <img key={idx} src={src} alt={`${slide.title} ${idx + 1}`} />
                  ))}
                </div>
                <div className="hero-cta">
                  <span className="hero-price">{slide.priceLabel}</span>
                  <Link to={slide.offerSlug ? `/offer/${encodeURIComponent(slide.offerSlug)}` : '/'}>
                    <button type="button" className="primary-btn">
                      Comprar ahora
                    </button>
                  </Link>
                </div>
              </div>
              {/* Imágenes en desktop: al lado derecho */}
              <div className="hero-images">
                {(slide.images || []).map((src, idx) => (
                  <img key={idx} src={src} alt={`${slide.title} ${idx + 1}`} />
                ))}
              </div>
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
        {(typeFilters.length
          ? typeFilters
          : [
              'Grass',
              'Fire',
              'Water',
              'Lightning',
              'Psychic',
              'Fighting',
              'Darkness',
              'Metal',
              'Fairy',
              'Dragon',
              'Colorless',
            ]
        ).map((label) => (
          <Link key={label} to={`/search?type=${encodeURIComponent(label)}`}>
            <button type="button">{label}</button>
          </Link>
        ))}
      </section>

      <section className="cards-section">
        <div className="section-header">
          <div>
            <h2>Cartas destacadas</h2>
            <p>Basado en datos locales de PikaCards</p>
          </div>
          <span>{cards.length} resultados</span>
        </div>

        {loading && <p className="status-text">Cargando cartas...</p>}
        {error && !loading && <p className="status-text error">{error}</p>}
        {!loading && !error && cards.length === 0 && (
          <p className="status-text">No encontramos cartas.</p>
        )}

        <div className="cards-grid">
          {!loading &&
            !error &&
            cards.map((card) => <Card key={card.id} card={card} />)}
        </div>

        {!loading && !error && totalPages > 1 && (
          <div className="pagination">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              ← Anterior
            </button>
            <span className="pagination-info">
              Página {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="pagination-btn"
            >
              Siguiente →
            </button>
          </div>
        )}
      </section>
    </>
  )
}

