/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'
import { getCardImage, getCardPrice } from '../utils/cards'
import { useAuth } from './AuthContext'
import { API_URL } from '../config'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

const CART_STORAGE_KEY = 'pikacards_cart'

const loadCartFromLocalStorage = () => {
  try {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveCartToLocalStorage = (cart) => {
  try {
    if (typeof window === 'undefined') return
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  } catch (error) {
    console.error('Error saving cart:', error)
  }
}

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(loadCartFromLocalStorage)
  const { isAuthenticated, getAuthHeaders } = useAuth()

  useEffect(() => {
    saveCartToLocalStorage(cart)
  }, [cart])

  const addToCart = async (card) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === card.id)

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === card.id
            ? { ...item, qty: item.qty + 1 }
            : item
        )
      }

      const newItem = {
        id: card.id,
        name: card.name,
        image: getCardImage(card),
        qty: 1,
        price: getCardPrice(card),
      }

      return [...prevCart, newItem]
    })

    // Sincronizar con backend si autenticado
    try {
      if (isAuthenticated()) {
        await fetch(`${API_URL}/cart/add/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ card_id: card.id }),
        })
      }
    } catch (error) {
      // No romper UX por errores del backend; se mantiene el estado local
      console.error('Error sincronizando addToCart:', error)
    }
  }

  const removeFromCart = async (cardId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== cardId))

    // Sincronizar eliminación con backend si autenticado
    try {
      if (isAuthenticated()) {
        // Buscar item_id del backend para este cardId
        const res = await fetch(`${API_URL}/cart/`, {
          headers: {
            ...getAuthHeaders(),
          },
        })
        const items = await res.json()
        // Coincidir por nombre del card en frontend; el backend expone card_name
        const localItem = cart.find((i) => i.id === cardId)
        const backendItem = items.find(
          (it) => it.card_name === localItem?.name
        )
        if (backendItem?.id) {
          await fetch(`${API_URL}/cart/remove/${backendItem.id}/`, {
            method: 'DELETE',
            headers: {
              ...getAuthHeaders(),
            },
          })
        }
      }
    } catch (error) {
      console.error('Error sincronizando removeFromCart:', error)
    }
  }

  const updateQuantity = async (cardId, qty) => {
    const current = cart.find((i) => i.id === cardId)
    const currentQty = current?.qty ?? 0

    if (qty <= 0) {
      await removeFromCart(cardId)
      return
    }

    // Actualizar local inmediatamente para buena UX
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === cardId ? { ...item, qty } : item
      )
    )

    // Sincronizar con backend si autenticado
    try {
      if (isAuthenticated()) {
        if (qty > currentQty) {
          // Incrementar: llamar add_to_cart la diferencia
          const diff = qty - currentQty
          for (let i = 0; i < diff; i++) {
            await fetch(`${API_URL}/cart/add/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
              },
              body: JSON.stringify({ card_id: cardId }),
            })
          }
        } else if (qty < currentQty) {
          // Decrementar: eliminar y re-agregar qty veces para fijar cantidad
          const res = await fetch(`${API_URL}/cart/`, {
            headers: {
              ...getAuthHeaders(),
            },
          })
          const items = await res.json()
          const localItem = cart.find((i) => i.id === cardId)
          const backendItem = items.find(
            (it) => it.card_name === localItem?.name
          )
          if (backendItem?.id) {
            await fetch(`${API_URL}/cart/remove/${backendItem.id}/`, {
              method: 'DELETE',
              headers: {
                ...getAuthHeaders(),
              },
            })
            // Re-agregar qty veces
            for (let i = 0; i < qty; i++) {
              await fetch(`${API_URL}/cart/add/`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...getAuthHeaders(),
                },
                body: JSON.stringify({ card_id: cardId }),
              })
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sincronizando updateQuantity:', error)
    }
  }

  const clearCart = () => {
    setCart([])
  }

  const cartTotal = () => {
    return cart.reduce((total, item) => {
      return total + Number(item.price) * item.qty
    }, 0)
  }

  const cartCount = () => {
    return cart.reduce((count, item) => count + item.qty, 0)
  }

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartCount,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

