const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? DEFAULT_API_BASE_URL

export const API_URL = `${API_BASE_URL}/api`
export const AUTH_URL = `${API_BASE_URL}/auth`
export const CARDS_URL = `${API_URL}/cards`
export const CHECKOUT_URL = `${API_URL}/cart/checkout/`


