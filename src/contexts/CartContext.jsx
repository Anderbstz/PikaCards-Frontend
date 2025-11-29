/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'
import { getCardImage, getCardPrice } from '../utils/cards'

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

  useEffect(() => {
    saveCartToLocalStorage(cart)
  }, [cart])

  const addToCart = (card) => {
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
  }

  const removeFromCart = (cardId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== cardId))
  }

  const updateQuantity = (cardId, qty) => {
    if (qty <= 0) {
      removeFromCart(cardId)
      return
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === cardId ? { ...item, qty } : item
      )
    )
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

