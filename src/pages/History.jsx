import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { API_URL } from '../config'
import { formatCurrency, FALLBACK_CARD_IMAGE } from '../utils/cards'
import './History.css'

export default function History() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, getAuthHeaders } = useAuth()
  const { clearCart } = useCart()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccessBanner, setShowSuccessBanner] = useState(
    Boolean(searchParams.get('success')),
  )
  const [filters, setFilters] = useState({ q: '', minTotal: '', maxTotal: '', startDate: '', endDate: '' })
  const [imgSizeVar, setImgSizeVar] = useState('140px')

  useEffect(() => {
    const loadHistory = async () => {
      if (!isAuthenticated()) return
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`${API_URL}/history/`, {
          headers: {
            Accept: 'application/json',
            ...getAuthHeaders(),
          },
        })

        const contentType = response.headers.get('content-type') || ''
        let data
        if (contentType.includes('application/json')) {
          data = await response.json()
        } else {
          const text = await response.text()
          data = { error: text }
        }

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Tu sesión expiró. Inicia sesión nuevamente.')
          }
          throw new Error(data.error || 'Error al cargar el historial')
        }

        setOrders(Array.isArray(data) ? data : [])
      } catch (fetchError) {
        setError(fetchError.message ?? 'Error inesperado')
      } finally {
        setLoading(false)
      }
    }
    loadHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Si venimos de un pago exitoso (?success=1), limpiamos el carrito local y mostramos banner
  useEffect(() => {
    if (searchParams.get('success') && isAuthenticated()) {
      clearCart()
      // Ocultar banner después de unos segundos
      const t = setTimeout(() => setShowSuccessBanner(false), 6000)

      // Poll suave del historial durante unos segundos para reflejar el webhook
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_URL}/history/`, {
            headers: {
              Accept: 'application/json',
              ...getAuthHeaders(),
            },
          })
          if (res.ok) {
            const data = await res.json()
            if (Array.isArray(data)) {
              setOrders(data)
            }
          }
        } catch (_) {
          // Ignorar errores transitorios
        }
      }, 2000)
      const stop = setTimeout(() => clearInterval(interval), 20000)

      return () => {
        clearTimeout(t)
        clearTimeout(stop)
        clearInterval(interval)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Leer preferencia de tamaño de imagen del perfil
  useEffect(() => {
    try {
      const pref = localStorage.getItem('pikacards_pref_history_img_size')
      const map = { small: '96px', medium: '140px', large: '180px' }
      if (pref && map[pref]) setImgSizeVar(map[pref])
    } catch {}
  }, [])

  const visibleOrders = orders.filter((order) => {
    const q = filters.q.trim().toLowerCase()
    const total = Number(order.total)
    const created = order.created_at ? new Date(order.created_at) : null

    if (q) {
      const hasMatch = (order.items || []).some((it) =>
        (it.product_name || '').toLowerCase().includes(q),
      )
      if (!hasMatch) return false
    }

    if (filters.minTotal) {
      const min = Number(filters.minTotal)
      if (!Number.isNaN(min) && total < min) return false
    }

    if (filters.maxTotal) {
      const max = Number(filters.maxTotal)
      if (!Number.isNaN(max) && total > max) return false
    }

    if (filters.startDate && created) {
      const sd = new Date(filters.startDate)
      if (created < sd) return false
    }

    if (filters.endDate && created) {
      const ed = new Date(filters.endDate)
      ed.setHours(23, 59, 59, 999)
      if (created > ed) return false
    }

    return true
  })

  if (!isAuthenticated()) {
    return (
      <div className="history-container">
        <div className="history-card">
          <h1>Historial de compras</h1>
          <p className="status-text">Debes iniciar sesión para ver tu historial.</p>
          <button
            type="button"
            className="primary-btn"
            onClick={() => navigate('/login')}
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="history-container" style={{ '--history-img-size': imgSizeVar }}>
      <div className="history-header">
        <h1>Historial de compras</h1>
        <button type="button" className="back-btn" onClick={() => navigate(-1)}>
          ← Volver
        </button>
      </div>

      <div className="history-filters">
        <div className="form-group">
          <label>Nombre de carta</label>
          <input
            type="text"
            placeholder="Buscar dentro del historial..."
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label>Total mín.</label>
          <input
            type="number"
            min="0"
            value={filters.minTotal}
            onChange={(e) => setFilters((f) => ({ ...f, minTotal: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label>Total máx.</label>
          <input
            type="number"
            min="0"
            value={filters.maxTotal}
            onChange={(e) => setFilters((f) => ({ ...f, maxTotal: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label>Desde</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label>Hasta</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
          />
        </div>
      </div>

      {showSuccessBanner && (
        <div className="success-banner">
          ¡Pago completado! Tu pedido está siendo procesado.
        </div>
      )}

      {loading && <p className="status-text">Cargando historial...</p>}
      {error && <p className="status-text error">{error}</p>}

      {!loading && !error && (
        <div className="orders-list">
          {visibleOrders.length === 0 ? (
            <div className="history-card">
              <p className="status-text">No tienes compras registradas todavía.</p>
              <button type="button" className="primary-btn" onClick={() => navigate('/')}>Explorar cartas</button>
            </div>
          ) : (
            visibleOrders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <h2>Orden #{order.id}</h2>
                  <span className="order-date">
                    {order.created_at ? new Date(order.created_at).toLocaleString() : 'Fecha no disponible'}
                  </span>
                </div>
                <div className="order-items">
                  {(order.items || []).map((item) => (
                    <div key={`${order.id}-${item.product_id}-${item.product_name}`} className="order-item">
                      <div className="order-item-image">
                        <img
                          src={item.product_image || FALLBACK_CARD_IMAGE}
                          alt={item.product_name}
                        />
                      </div>
                      <div className="item-info">
                        <strong>{item.product_name}</strong>
                        <span className="item-qty">Cantidad: {item.quantity}</span>
                      </div>
                      <div className="item-price">{formatCurrency(item.price)}</div>
                    </div>
                  ))}
                </div>
                <div className="order-total">
                  <span>Total</span>
                  <strong>{formatCurrency(order.total)}</strong>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}