import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import ChatBubble from './ChatBubble'
import './Layout.css'

export default function Layout() {
  return (
    <div className="app-shell">
      <header className="announcement-bar">
        <p>¡ENTRENADOR! ENTREGAMOS ENVÍOS A TODO EL PERÚ, ¿QUÉ ESPERAS?</p>
        <span>#TGCCARDS</span>
      </header>
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="app-footer">
        <p>Pokémon TCG data © Pokémon. PikaCards es un fan store independiente.</p>
        <p>
          Backend protegido con Django — Endpoint{' '}
          <code>/api/cards/</code>
        </p>
      </footer>
      <ChatBubble />
    </div>
  )
}