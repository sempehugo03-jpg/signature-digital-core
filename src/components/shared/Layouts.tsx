import type { ReactNode } from 'react'
import { Button } from './DesignSystem'

type Navigate = (route: string) => void

export function PublicLayout({ children, onNavigate }: { children: ReactNode; onNavigate: Navigate }) {
  return (
    <div className="signature-shell">
      <header className="public-nav">
        <button className="brand-mark" type="button" onClick={() => onNavigate('/')}>
          <span />
          Signature Digital
        </button>
        <nav>
          <button type="button" onClick={() => onNavigate('/#fonctionnement')}>Fonctionnement</button>
          <button type="button" onClick={() => onNavigate('/#secteurs')}>Secteurs</button>
          <Button className="nav-cta" onClick={() => onNavigate('/analyser-mon-site')}>Analyser mon site</Button>
        </nav>
      </header>
      {children}
      <footer className="public-footer">
        <p>© 2026 Signature Digital. Tous droits réservés.</p>
        <button type="button" onClick={() => onNavigate('/admin')}>Connexion</button>
      </footer>
    </div>
  )
}

export function AdminLayout({
  children,
  onNavigate,
  onLogout,
}: {
  children: ReactNode
  onNavigate: Navigate
  onLogout: () => void
}) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <button className="brand-mark" type="button" onClick={() => onNavigate('/admin')}>
          <span />
          Signature Digital
        </button>
        <nav>
          <button type="button" onClick={() => onNavigate('/admin')}>Cockpit</button>
          <button type="button" onClick={() => onNavigate('/admin/projets')}>Projets</button>
          <button type="button" onClick={onLogout}>Déconnexion</button>
        </nav>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  )
}
