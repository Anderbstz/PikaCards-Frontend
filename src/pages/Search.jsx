import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Card from '../components/Card'
import { API_URL } from '../config'
import './Search.css'

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [advancedMode, setAdvancedMode] = useState(false)
  const [name, setName] = useState('')
  const [artist, setArtist] = useState('')
  const [type, setType] = useState('')
  const [rarity, setRarity] = useState('')
  const [selectedSet, setSelectedSet] = useState('')

  const [types, setTypes] = useState([])
  const [rarities, setRarities] = useState([])
  const [sets, setSets] = useState([])

  useEffect(() => {
    fetchFilterOptions()
  }, [])

  useEffect(() => {
    const qsQuery = searchParams.get('q') ?? ''
    const qsType = searchParams.get('type') ?? ''
    const qsRarity = searchParams.get('rarity') ?? ''
    const qsSet = searchParams.get('set') ?? ''
    const qsArtist = searchParams.get('artist') ?? ''
    const qsName = searchParams.get('name') ?? ''

    setQuery(qsQuery)
    setName(qsName)
    setArtist(qsArtist)
    setType(qsType)
    setRarity(qsRarity)
    setSelectedSet(qsSet)

    const hasAdvancedParams =
      qsType || qsRarity || qsSet || qsArtist || qsName

    if (hasAdvancedParams) {
      setAdvancedMode(true)
      handleAdvancedSearch(
        {
          name: qsName || qsQuery,
          artist: qsArtist,
          type: qsType,
          rarity: qsRarity,
          set: qsSet,
        },
        false,
      )
    } else if (qsQuery) {
      handleSimpleSearch(qsQuery, false)
    } else {
      setCards([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const fetchFilterOptions = async () => {
    try {
      const [typesRes, raritiesRes, setsRes] = await Promise.all([
        fetch(`${API_URL}/cards/types/`),
        fetch(`${API_URL}/cards/rarities/`),
        fetch(`${API_URL}/cards/sets/`),
      ])

      if (typesRes.ok) {
        const typesData = await typesRes.json()
        setTypes(Array.isArray(typesData) ? typesData : [])
      }
      if (raritiesRes.ok) {
        const raritiesData = await raritiesRes.json()
        setRarities(Array.isArray(raritiesData) ? raritiesData : [])
      }
      if (setsRes.ok) {
        const setsData = await setsRes.json()
        setSets(Array.isArray(setsData) ? setsData : [])
      }
    } catch (fetchError) {
      console.error('Error fetching filter options:', fetchError)
    }
  }

  const handleSimpleSearch = async (searchQuery, shouldUpdateParams = true) => {
    if (!searchQuery.trim()) {
      setCards([])
      return
    }

    if (shouldUpdateParams) {
      setSearchParams({ q: searchQuery })
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await fetch(
        `${API_URL}/cards/search/?q=${encodeURIComponent(searchQuery)}`,
      )
      if (!response.ok) {
        throw new Error('Error en la búsqueda')
      }
      const data = await response.json()
      setCards(Array.isArray(data) ? data : data.results || [])
      if (shouldUpdateParams) {
        setSearchParams({ q: searchQuery })
      }
    } catch (fetchError) {
      setError(fetchError.message ?? 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const handleAdvancedSearch = async (
    overrides = {},
    shouldUpdateParams = true,
  ) => {
    const params = new URLSearchParams()
    const payload = {
      name: overrides.name ?? name,
      artist: overrides.artist ?? artist,
      type: overrides.type ?? type,
      rarity: overrides.rarity ?? rarity,
      set: overrides.set ?? selectedSet,
    }

    Object.entries(payload).forEach(([key, value]) => {
      if (value) params.append(key, value)
    })

    if (shouldUpdateParams) {
      setSearchParams(params)
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await fetch(
        `${API_URL}/cards/search/advanced/?${params.toString()}`,
      )
      if (!response.ok) {
        throw new Error('Error en la búsqueda avanzada')
      }
      const data = await response.json()
      setCards(Array.isArray(data) ? data : data.results || [])
    } catch (fetchError) {
      setError(fetchError.message ?? 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (advancedMode) {
      handleAdvancedSearch()
    } else {
      handleSimpleSearch(query)
    }
  }

  return (
    <div className="search-container">
      <div className="search-header">
        <h1>Búsqueda de Cartas</h1>
        <button
          type="button"
          className="toggle-mode-btn"
          onClick={() => setAdvancedMode(!advancedMode)}
        >
          {advancedMode ? 'Búsqueda Simple' : 'Búsqueda Avanzada'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="search-form">
        {!advancedMode ? (
          <div className="simple-search">
            <input
              type="search"
              placeholder="Buscar carta, set o artista..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="primary-btn">
              Buscar
            </button>
          </div>
        ) : (
          <div className="advanced-search">
            <div className="form-row">
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre de la carta"
                />
              </div>
              <div className="form-group">
                <label>Artista</label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Nombre del artista"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Tipo</label>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="">Todos</option>
                  {types.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Rareza</label>
                <select
                  value={rarity}
                  onChange={(e) => setRarity(e.target.value)}
                >
                  <option value="">Todas</option>
                  {rarities.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Set</label>
                <select
                  value={selectedSet}
                  onChange={(e) => setSelectedSet(e.target.value)}
                >
                  <option value="">Todos</option>
                  {sets.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="primary-btn">
              Buscar
            </button>
          </div>
        )}
      </form>

      {loading && <p className="status-text">Buscando cartas...</p>}
      {error && !loading && <p className="status-text error">{error}</p>}
      {!loading && !error && cards.length === 0 && (query || advancedMode) && (
        <p className="status-text">No se encontraron cartas.</p>
      )}

      {cards.length > 0 && (
        <div className="search-results">
          <div className="results-header">
            <h2>{cards.length} resultados encontrados</h2>
          </div>
          <div className="cards-grid">
            {cards.map((card) => (
              <Card key={card.id} card={card} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

