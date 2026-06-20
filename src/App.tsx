import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Route = '/' | '/admin' | '/demo'
type DemoSection = 'public' | 'patron' | 'agent' | 'vendeur'

const demoAgency = {
  name: 'Signature Immobilier',
  sector: 'Immobilier',
  status: 'Démo active',
  city: 'Tarbes',
  colors: {
    primary: 'Bleu nuit',
    secondary: 'Crème',
    accent: 'Doré doux',
  },
}

const adminCards = [
  {
    title: 'Agences',
    text: 'Créer et gérer les agences démo.',
  },
  {
    title: 'Créer une agence',
    text: 'Ajouter une entreprise à partir de son site actuel.',
  },
  {
    title: 'Démos',
    text: 'Ouvrir les espaces public, patron, agent et client.',
  },
  {
    title: 'Templates secteurs',
    text: 'Immobilier, constructeurs, avocats, architectes.',
  },
]

const demoSections: Record<DemoSection, { label: string; title: string; text: string }> = {
  public: {
    label: 'Site public',
    title: 'Site public',
    text: 'Une vitrine claire pour présenter les biens, les services et le positionnement local.',
  },
  patron: {
    label: 'Espace patron',
    title: 'Espace patron',
    text: 'Une vue dirigeant pour suivre les dossiers, les équipes et les opportunités.',
  },
  agent: {
    label: 'Espace agent',
    title: 'Espace agent',
    text: 'Un espace simple pour organiser les mandats, les visites et les relances.',
  },
  vendeur: {
    label: 'Espace vendeur',
    title: 'Espace vendeur',
    text: 'Un suivi vendeur rassurant avec les étapes, les visites et les prochains points.',
  },
}

const routes: Route[] = ['/', '/admin', '/demo']

function getRoute(): Route {
  const path = window.location.pathname
  return routes.includes(path as Route) ? (path as Route) : '/'
}

function App() {
  const [route, setRoute] = useState<Route>(getRoute)
  const [activeSection, setActiveSection] = useState<DemoSection>('public')

  const currentLabel = useMemo(() => {
    if (route === '/admin') return 'Studio'
    if (route === '/demo') return 'Démo'
    return 'Accueil'
  }, [route])

  useEffect(() => {
    const handlePopState = () => setRoute(getRoute())
    window.addEventListener('popstate', handlePopState)

    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function navigate(nextRoute: Route) {
    window.history.pushState({}, '', nextRoute)
    setRoute(nextRoute)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="app-shell">
      <nav className="topbar" aria-label="Navigation principale">
        <button className="brand" type="button" onClick={() => navigate('/')}>
          SDC
        </button>
        <div className="nav-links">
          <button className={route === '/' ? 'active' : ''} type="button" onClick={() => navigate('/')}>
            Accueil
          </button>
          <button className={route === '/admin' ? 'active' : ''} type="button" onClick={() => navigate('/admin')}>
            Admin
          </button>
          <button className={route === '/demo' ? 'active' : ''} type="button" onClick={() => navigate('/demo')}>
            Démo
          </button>
        </div>
      </nav>

      <p className="route-pill">{currentLabel}</p>

      {route === '/' && <HomeView onNavigate={navigate} />}
      {route === '/admin' && <AdminView onNavigate={navigate} />}
      {route === '/demo' && (
        <DemoView activeSection={activeSection} onSelectSection={setActiveSection} />
      )}
    </main>
  )
}

function HomeView({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <section className="hero-view">
      <div className="hero-content">
        <h1>Signature Digital Core</h1>
        <p className="subtitle">Studio de création de démos métier personnalisées</p>
        <p className="intro">
          Créez, personnalisez et présentez des expériences digitales adaptées à chaque secteur.
        </p>
        <div className="actions">
          <button className="primary-button" type="button" onClick={() => onNavigate('/admin')}>
            Entrer dans le Studio
          </button>
          <button className="secondary-button" type="button" onClick={() => onNavigate('/demo')}>
            Voir la démo immobilier
          </button>
        </div>
      </div>
      <AgencyPreview />
    </section>
  )
}

function AdminView({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Studio Admin</h1>
        <p className="subtitle">Pilotez vos agences, vos démos et vos templates métier.</p>
      </div>

      <div className="card-grid">
        {adminCards.map((card) => (
          <article className="info-card" key={card.title}>
            <h2>{card.title}</h2>
            <p>{card.text}</p>
          </article>
        ))}
      </div>

      <section className="agency-panel">
        <div>
          <p className="eyebrow">Agence démo locale</p>
          <h2>{demoAgency.name}</h2>
          <p>{demoAgency.sector} · {demoAgency.city} · {demoAgency.status}</p>
        </div>
        <button className="secondary-button compact" type="button" onClick={() => onNavigate('/demo')}>
          Ouvrir la démo
        </button>
      </section>
    </section>
  )
}

function DemoView({
  activeSection,
  onSelectSection,
}: {
  activeSection: DemoSection
  onSelectSection: (section: DemoSection) => void
}) {
  const section = demoSections[activeSection]

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Démo Signature Immobilier</h1>
        <p className="subtitle">Une démonstration métier basée sur le suivi immobilier.</p>
      </div>

      <div className="demo-buttons">
        {(Object.keys(demoSections) as DemoSection[]).map((key) => (
          <button
            className={activeSection === key ? 'active' : ''}
            key={key}
            type="button"
            onClick={() => onSelectSection(key)}
          >
            {demoSections[key].label}
          </button>
        ))}
      </div>

      <article className="demo-panel">
        <p className="eyebrow">{demoAgency.name}</p>
        <h2>{section.title}</h2>
        <p>{section.text}</p>
      </article>
    </section>
  )
}

function AgencyPreview() {
  return (
    <aside className="agency-preview" aria-label="Agence demo locale">
      <p className="eyebrow">Agence démo locale</p>
      <h2>{demoAgency.name}</h2>
      <div className="agency-lines">
        <span>{demoAgency.sector}</span>
        <span>{demoAgency.status}</span>
        <span>{demoAgency.city}</span>
      </div>
      <div className="color-list">
        <span>{demoAgency.colors.primary}</span>
        <span>{demoAgency.colors.secondary}</span>
        <span>{demoAgency.colors.accent}</span>
      </div>
    </aside>
  )
}

export default App
