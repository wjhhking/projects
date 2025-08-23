'use client'

import Link from 'next/link'

export default function TopNavBar() {
  return (
    <nav className="top-nav">
      <div className="logo">
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          🎮 GameBit
        </Link>
      </div>
      <div className="nav-buttons">
        <Link href="/public-games" className="nav-btn">
          Public Games
        </Link>
        <Link href="/my-games" className="nav-btn">
          My Games
        </Link>
      </div>
    </nav>
  )
}
