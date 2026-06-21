import { Component, StrictMode } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message: string }> {
  state = { hasError: false, message: '' }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Signature Digital Core render failed.', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (window.location.pathname === '/admin/agencies/new' || window.location.pathname === '/admin/agences/new') {
        return (
          <main className="app-shell">
            <section className="page-view">
              <div className="page-heading">
                <h1>Créer une agence</h1>
                <p className="subtitle">Créer une démo agence synchronisée avec Supabase.</p>
              </div>
              <form className="edit-panel form-grid creation-form" onSubmit={(event) => event.preventDefault()}>
                <div className="form-section-title">
                  <p className="eyebrow">Phase 2A</p>
                  <h2>Agence</h2>
                  <p>Le formulaire reste disponible sans écriture Supabase.</p>
                </div>
                <label>Nom de l’entreprise<input /></label>
                <label>Secteur<input defaultValue="Immobilier" /></label>
                <label>Ville<input defaultValue="Tarbes" /></label>
                <label>Site actuel<input defaultValue="https://example.com" /></label>
                <label>Couleur principale<input defaultValue="#071b33" /></label>
                <label>Couleur secondaire<input defaultValue="#f7f1e7" /></label>
                <label>Couleur accent<input defaultValue="#d7b46a" /></label>
                <label>Logo texte<input defaultValue="SDC" /></label>
                <div className="actions form-actions">
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => this.setState({ message: 'Formulaire prêt. Connexion à la création bientôt disponible.' })}
                  >
                    Créer la démo
                  </button>
                  {this.state.message && <p className="save-message">{this.state.message}</p>}
                </div>
              </form>
            </section>
          </main>
        )
      }

      return (
        <main className="app-shell">
          <section className="page-view">
            <div className="page-heading">
              <h1>Studio Admin</h1>
              <p className="subtitle">Une erreur d’affichage est survenue. Rechargez la page ou retournez au Studio.</p>
            </div>
            <div className="actions">
              <button className="primary-button" type="button" onClick={() => window.location.assign('/admin')}>
                Retour admin
              </button>
            </div>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
