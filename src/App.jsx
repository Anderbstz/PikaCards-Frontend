import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './contexts/CartContext'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import CardDetail from './pages/CardDetail'
import Search from './pages/Search'
import Offer from './pages/Offer'
import Cart from './pages/Cart'
import Login from './pages/Login'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="card/:id" element={<CardDetail />} />
              <Route path="offer/:slug" element={<Offer />} />
              <Route path="search" element={<Search />} />
              <Route path="cart" element={<Cart />} />
              <Route path="login" element={<Login />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
