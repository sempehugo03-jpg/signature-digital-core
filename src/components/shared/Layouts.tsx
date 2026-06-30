import type { ReactNode } from 'react'
import { InstallAppBanner } from '../public/InstallAppBanner'
import { Button } from './DesignSystem'

type Navigate = (route: string) => void

export function PublicLayout({ children, onNavigate }: { children: ReactNode; onNavigate: Navigate }) {
  return (
    <div className="signature-shell">
      <InstallAppBanner />
      <header className="public-nav">
        <button className="brand-mark" type="button" onClick={() => onNavigate('/')}>
          <img src="/assets/signature-digital-logo.png" alt="" />
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
        <div className="footer-brand">
          <img src="/assets/signature-digital-logo.png" alt="" />
          <p>© 2026 Signature Digital. Tous droits réservés.</p>
        </div>
        <button type="button" onClick={() => onNavigate('/connexion')}>Connexion</button>
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
          <img src="/assets/signature-digital-logo.png" alt="" />
          Signature Digital
        </button>
        <nav>
          <button type="button" onClick={() => onNavigate('/admin/cockpit')}>Cockpit</button>
          <button type="button" onClick={() => onNavigate('/admin/projects')}>Projets</button>
          <button type="button" onClick={() => onNavigate('/admin/modules')}>Moteur</button>
          <button type="button" onClick={() => onNavigate('/admin/templates')}>Templates</button>
          <button type="button" onClick={onLogout}>Déconnexion</button>
        </nav>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  )
}
