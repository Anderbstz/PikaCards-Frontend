import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_URL } from '../config'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import {
  formatCurrency,
  getCardImage,
  getCardPrice,
  getCardSetName,
} from '../utils/cards'
import './Navbar.css'
import { FiSearch, FiShoppingCart, FiUser, FiChevronDown, FiGrid } from 'react-icons/fi'
import Logo from '../assets/Icon_SeaTgc.png'

// Mostramos todas las opciones disponibles en el menú de categorías
const MENU_MAX_ITEMS = null

export default function Navbar() {
  const navigate = useNavigate()
  const { cartCount } = useCart()
  const { isAuthenticated, logout, auth } = useAuth()

  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [showSearchPanel, setShowSearchPanel] = useState(false)

  const [menuOpen, setMenuOpen] = useState(false)
  const [types, setTypes] = useState([])
  const [rarities, setRarities] = useState([])
  const [showProfilePanel, setShowProfilePanel] = useState(false)
  const [avatar, setAvatar] = useState('')

  const searchRef = useRef(null)
  const menuRef = useRef(null)
  const profileRef = useRef(null)
  const debounceRef = useRef()

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [typesRes, raritiesRes] = await Promise.all([
          fetch(`${API_URL}/cards/types/`),
          fetch(`${API_URL}/cards/rarities/`),
        ])

        if (typesRes.ok) {
          const data = await typesRes.json()
          setTypes(Array.isArray(data) ? data : [])
        }

        if (raritiesRes.ok) {
          const data = await raritiesRes.json()
          setRarities(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('No se pudieron cargar los filtros', error)
      }
    }

    fetchFilters()
  }, [])

  // Cargar avatar desde el perfil guardado en localStorage
  useEffect(() => {
    const refreshAvatar = () => {
      try {
        const username = auth?.user?.username
        let nextAvatar = ''
        if (username) {
          const key = `pikacards_profile_${username}`
          const saved = localStorage.getItem(key)
          if (saved) {
            const parsed = JSON.parse(saved)
            nextAvatar = parsed?.avatar || ''
          }
        }
        // Fallback: buscar cualquier perfil con avatar
        if (!nextAvatar) {
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i)
            if (k && k.startsWith('pikacards_profile_')) {
              try {
                const val = JSON.parse(localStorage.getItem(k))
                if (val?.avatar) {
                  nextAvatar = val.avatar
                  break
                }
              } catch {}
            }
          }
        }
        setAvatar(nextAvatar)
      } catch {
        setAvatar('')
      }
    }

    refreshAvatar()
    const onFocus = () => refreshAvatar()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [auth?.user?.username])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchPanel(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfilePanel(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleGoProfile = () => {
    navigate('/profile')
    setShowProfilePanel(false)
  }

  const handleGoHistory = () => {
    navigate('/history')
    setShowProfilePanel(false)
  }

  const runSearch = async (value) => {
    if (value.trim().length < 2) {
      setSearchResults([])
      setSearchError('')
      return
    }

    setSearchLoading(true)
    setSearchError('')
    try {
      const response = await fetch(
        `${API_URL}/cards/search/?q=${encodeURIComponent(value.trim())}`,
      )
      if (!response.ok) {
        throw new Error('No pudimos buscar cartas')
      }
      const data = await response.json()
      setSearchResults(Array.isArray(data) ? data.slice(0, 5) : [])
    } catch (error) {
      setSearchError(error.message)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSearchChange = (event) => {
    const value = event.target.value
    setSearchTerm(value)
    setShowSearchPanel(true)
    setSearchError('')

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      runSearch(value)
    }, 350)
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    runSearch(searchTerm)
  }

  const handleNavigateFilter = (filterKey, value) => {
    const params = new URLSearchParams({ [filterKey]: value })
    navigate(`/search?${params.toString()}`)
    setMenuOpen(false)
  }

  const handleGoToSearchPage = () => {
    if (!searchTerm.trim()) return
    const params = new URLSearchParams({ q: searchTerm.trim() })
    navigate(`/search?${params.toString()}`)
    setShowSearchPanel(false)
  }

  const handleResultClick = (cardId) => {
    navigate(`/card/${cardId}`)
    setShowSearchPanel(false)
    setSearchTerm('')
  }

  return (
    <nav className="navbar">
      <div className="navbar__brand">
        <Link to="/" className="brand-link">
          <img src={Logo} alt="SeaTGC Logo" className="brand-logo" />
          <div className="brand-text">
            <span>PikaCards</span>
            <small>TCG Retro Store</small>
          </div>
        </Link>
      </div>

      <div className="navbar__controls">
        {/** Ubicación removida por solicitud del usuario **/}

        <div className="nav-menu" ref={menuRef}>
          <button
            type="button"
            className="pill-btn strong icon-btn"
            aria-label="Categorías"
            title="Categorías"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <FiGrid size={18} />
          </button>
          {menuOpen && (
            <div className="menu-panel">
              <div>
                <p className="menu-title">Tipos</p>
                <ul>
                  {(MENU_MAX_ITEMS ? types.slice(0, MENU_MAX_ITEMS) : types).map((type) => (
                    <li key={type}>
                      <button
                        type="button"
                        onClick={() => handleNavigateFilter('type', type)}
                      >
                        {type}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="menu-title">Rarezas</p>
                <ul>
                  {(MENU_MAX_ITEMS ? rarities.slice(0, MENU_MAX_ITEMS) : rarities).map((rarity) => (
                    <li key={rarity}>
                      <button
                        type="button"
                        onClick={() => handleNavigateFilter('rarity', rarity)}
                      >
                        {rarity}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="nav-search" ref={searchRef}>
          <form onSubmit={handleSearchSubmit}>
            <input
              type="search"
              placeholder="Buscar carta, set o artista"
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => setShowSearchPanel(true)}
            />
            <button type="submit" className="ghost-btn icon-btn" aria-label="Buscar">
          <FiSearch size={26} />
            </button>
          </form>

          {showSearchPanel && (
            <div className="search-panel">
              {searchLoading && <p className="search-status">Buscando...</p>}
              {searchError && (
                <p className="search-status error">{searchError}</p>
              )}
              {!searchLoading && !searchError && searchResults.length === 0 && searchTerm.length > 1 && (
                <p className="search-status">Sin resultados</p>
              )}

              <ul className="search-results">
                {searchResults.map((card) => (
                  <li key={card.id} onClick={() => handleResultClick(card.id)}>
                    <img src={getCardImage(card)} alt={card.name} />
                    <div>
                      <strong>{card.name}</strong>
                      <span>{getCardSetName(card)}</span>
                    </div>
                    <span className="result-price">
                      {formatCurrency(getCardPrice(card))}
                    </span>
                  </li>
                ))}
              </ul>

              {searchResults.length > 0 && (
                <button
                  type="button"
                  className="primary-btn search-view-all"
                  onClick={handleGoToSearchPage}
                >
                  Ver todos los resultados
                </button>
              )}
            </div>
          )}
        </div>
        <div className="nav-actions">
          <Link to="/cart" className="cart-link">
            <button type="button" className="ghost-btn icon-btn cart-btn" aria-label="Carrito">
          <FiShoppingCart size={26} />
              {cartCount() > 0 && (
                <span className="cart-badge">{cartCount()}</span>
              )}
            </button>
          </Link>
          <div className="nav-profile" ref={profileRef}>
            {isAuthenticated() ? (
              <>
                <button
                  type="button"
                  className="ghost-btn profile-btn"
                  onClick={() => setShowProfilePanel((prev) => !prev)}
                  aria-label="Perfil"
                  title={auth?.user?.username ? `Perfil de ${auth.user.username}` : 'Perfil'}
                >
                  {avatar ? (
                    <span className="profile-avatar">
                      <img src={avatar} alt="Avatar" />
                    </span>
                  ) : (
            <FiUser size={26} aria-hidden="true" />
                  )}
            <FiChevronDown size={20} aria-hidden="true" />
                </button>
                {showProfilePanel && (
                  <div className="profile-panel">
                    <button type="button" onClick={handleGoProfile}>Mi Perfil</button>
                    <button type="button" onClick={handleGoHistory}>Historial</button>
                    <button type="button" onClick={handleLogout}>Cerrar sesión</button>
                  </div>
                )}
              </>
            ) : (
              <Link to="/login">
                <button type="button" className="ghost-btn" aria-label="Ingresar">
                  Login / Register
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

