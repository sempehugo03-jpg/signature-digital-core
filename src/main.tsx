import { Component, StrictMode } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Signature Digital Core render failed.', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-shell">
          <section className="page-view">
            <div className="page-heading">
              <h1>Interface indisponible</h1>
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
