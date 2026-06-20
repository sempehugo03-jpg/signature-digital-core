import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  demoProperty,
  immobilierAgency,
  immobilierSector,
  sellerTracking,
} from './sectors/immobilier/data'

type Route =
  | '/'
  | '/admin'
  | '/demo'
  | '/demo/immobilier'
  | '/demo/immobilier/public'
  | '/demo/immobilier/patron'
  | '/demo/immobilier/agent'
  | '/demo/immobilier/vendeur'
  | '/demo/immobilier/bien'

const routes: Route[] = [
  '/',
  '/admin',
  '/demo',
  '/demo/immobilier',
  '/demo/immobilier/public',
  '/demo/immobilier/patron',
  '/demo/immobilier/agent',
  '/demo/immobilier/vendeur',
  '/demo/immobilier/bien',
]

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

const hubLinks = [
  { label: 'Site public', route: '/demo/immobilier/public' },
  { label: 'Espace patron', route: '/demo/immobilier/patron' },
  { label: 'Espace agent', route: '/demo/immobilier/agent' },
  { label: 'Espace vendeur', route: '/demo/immobilier/vendeur' },
  { label: 'Gérer le bien', route: '/demo/immobilier/bien' },
] satisfies Array<{ label: string; route: Route }>

function getRoute(): Route {
  const path = window.location.pathname
  return routes.includes(path as Route) ? (path as Route) : '/'
}

function App() {
  const [route, setRoute] = useState<Route>(getRoute)

  const currentLabel = useMemo(() => {
    if (route === '/admin') return 'Studio'
    if (route.startsWith('/demo/immobilier')) return immobilierSector.sectorName
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
          <button className={route.startsWith('/demo') ? 'active' : ''} type="button" onClick={() => navigate('/demo')}>
            Démo
          </button>
        </div>
      </nav>

      <p className="route-pill">{currentLabel}</p>

      {route === '/' && <HomeView onNavigate={navigate} />}
      {route === '/admin' && <AdminView onNavigate={navigate} />}
      {route === '/demo' && <DemoIndexView onNavigate={navigate} />}
      {route === '/demo/immobilier' && <ImmobilierHubView onNavigate={navigate} />}
      {route === '/demo/immobilier/public' && <ImmobilierPublicView onNavigate={navigate} />}
      {route === '/demo/immobilier/patron' && <ImmobilierPatronView onNavigate={navigate} />}
      {route === '/demo/immobilier/agent' && <ImmobilierAgentView onNavigate={navigate} />}
      {route === '/demo/immobilier/vendeur' && <ImmobilierVendeurView onNavigate={navigate} />}
      {route === '/demo/immobilier/bien' && <ImmobilierBienView onNavigate={navigate} />}
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
          <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier')}>
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
          <p className="eyebrow">Module secteur</p>
          <h2>{immobilierSector.moduleName}</h2>
          <p>
            {immobilierAgency.city} · {immobilierAgency.status} · {immobilierSector.promise}
          </p>
        </div>
        <button className="secondary-button compact" type="button" onClick={() => onNavigate('/demo/immobilier')}>
          Ouvrir le module
        </button>
      </section>
    </section>
  )
}

function DemoIndexView({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Démo Signature Immobilier</h1>
        <p className="subtitle">Une démonstration métier basée sur le suivi immobilier.</p>
      </div>

      <div className="demo-buttons">
        {hubLinks.slice(0, 4).map((link) => (
          <button key={link.route} type="button" onClick={() => onNavigate(link.route)}>
            {link.label}
          </button>
        ))}
      </div>

      <article className="demo-panel">
        <p className="eyebrow">{immobilierSector.sectorName}</p>
        <h2>{immobilierSector.promise}</h2>
        <p>
          {immobilierSector.moduleName} est le premier module métier de Signature Digital Core.
        </p>
        <div className="inline-actions">
          <button className="primary-button compact" type="button" onClick={() => onNavigate('/demo/immobilier')}>
            Ouvrir le hub immobilier
          </button>
        </div>
      </article>
    </section>
  )
}

function ImmobilierHubView({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>{immobilierSector.moduleName}</h1>
        <p className="subtitle">{immobilierSector.promise}</p>
      </div>

      <div className="module-card">
        <AgencyPreview />
        <div className="module-actions">
          {hubLinks.map((link) => (
            <button key={link.route} type="button" onClick={() => onNavigate(link.route)}>
              {link.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function ImmobilierPublicView({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <section className="page-view">
      <div className="page-heading">
        <p className="eyebrow">{immobilierAgency.name}</p>
        <h1>Site public immobilier</h1>
        <p className="subtitle">Vendez votre bien sans rester dans le flou</p>
        <p className="intro">Une expérience claire pour suivre chaque étape de votre vente.</p>
      </div>

      <PropertyCard onNavigate={onNavigate} showManageButton={false} />

      <div className="actions">
        <button className="primary-button" type="button" onClick={() => onNavigate('/demo/immobilier/public')}>
          Voir l’annonce
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier/vendeur')}>
          Estimer mon bien
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier')}>
          Retour au module
        </button>
      </div>
    </section>
  )
}

function ImmobilierPatronView({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Espace patron</h1>
        <p className="subtitle">Résumé agence</p>
        <p className="intro">
          {immobilierAgency.name} · {immobilierAgency.city} · {immobilierAgency.status}
        </p>
      </div>

      <div className="metric-grid">
        <MetricCard label="Biens" value="1" />
        <MetricCard label="Agents" value="1" />
        <MetricCard label="Vendeurs suivis" value="1" />
      </div>

      <article className="demo-panel">
        <p className="eyebrow">Statut</p>
        <h2>{immobilierAgency.status}</h2>
        <p>{immobilierSector.promise}</p>
      </article>

      <PropertyCard onNavigate={onNavigate} showManageButton={false} />

      <div className="actions">
        <button className="primary-button" type="button" onClick={() => onNavigate('/demo/immobilier/agent')}>
          Voir espace agent
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier/public')}>
          Voir site public
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier')}>
          Retour au module
        </button>
      </div>
    </section>
  )
}

function ImmobilierAgentView({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Espace agent</h1>
        <p className="subtitle">Les actions essentielles pour suivre le bien et le vendeur.</p>
      </div>

      <div className="filter-row" aria-label="Filtre biens">
        <span className="active">Tous les biens</span>
        <span>Mes biens</span>
      </div>

      <PropertyCard onNavigate={onNavigate} />

      <div className="actions">
        <button className="primary-button" type="button" onClick={() => onNavigate('/demo/immobilier/bien')}>
          Gérer le bien
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier/vendeur')}>
          Ouvrir espace vendeur
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier')}>
          Retour au module
        </button>
      </div>
    </section>
  )
}

function ImmobilierVendeurView({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <section className="page-view seller-view">
      <div className="page-heading">
        <h1>Espace vendeur</h1>
        <p className="subtitle">Un suivi simple, premium et transparent.</p>
      </div>

      <article className="seller-panel">
        <PropertyPhoto />
        <div>
          <p className="eyebrow">{demoProperty.title}</p>
          <h2>Progression de vente</h2>
          <StepProgress />
        </div>
      </article>

      <div className="card-grid">
        <article className="info-card">
          <h2>Prochaine visite</h2>
          <p>{sellerTracking.nextVisit}</p>
        </article>
        <article className="info-card">
          <h2>Compte rendu</h2>
          <p>{sellerTracking.shortReport}</p>
        </article>
      </div>

      <article className="demo-panel">
        <p className="eyebrow">Documents visibles</p>
        <div className="document-list">
          {sellerTracking.visibleDocuments.map((document) => (
            <span key={document}>{document}</span>
          ))}
        </div>
        <div className="inline-actions">
          <button className="secondary-button compact" type="button" onClick={() => onNavigate('/demo/immobilier')}>
            Retour au module
          </button>
        </div>
      </article>
    </section>
  )
}

function ImmobilierBienView({ onNavigate }: { onNavigate: (route: Route) => void }) {
  const [title, setTitle] = useState(demoProperty.title)
  const [city, setCity] = useState(demoProperty.city)
  const [price, setPrice] = useState(demoProperty.price)
  const [surface, setSurface] = useState(demoProperty.surface)
  const [rooms, setRooms] = useState(String(demoProperty.rooms))
  const [status, setStatus] = useState(demoProperty.status)
  const [savedMessage, setSavedMessage] = useState('')

  function saveProperty() {
    setSavedMessage('Modifications enregistrées localement')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Gérer le bien</h1>
        <p className="subtitle">Une édition locale simple, sans upload réel pour l’instant.</p>
      </div>

      <article className="edit-panel">
        <label>
          Titre
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          Ville
          <input value={city} onChange={(event) => setCity(event.target.value)} />
        </label>
        <label>
          Prix
          <input value={price} onChange={(event) => setPrice(event.target.value)} />
        </label>
        <label>
          Surface
          <input value={surface} onChange={(event) => setSurface(event.target.value)} />
        </label>
        <label>
          Pièces
          <input value={rooms} onChange={(event) => setRooms(event.target.value)} />
        </label>
        <label>
          Statut
          <input value={status} onChange={(event) => setStatus(event.target.value)} />
        </label>
        <div className="edit-preview">
          <p className="eyebrow">Aperçu local</p>
          <h2>{title}</h2>
          <p>{city} · {price} · {surface} · {rooms} pièces · {status}</p>
        </div>
        {savedMessage && <p className="save-message">{savedMessage}</p>}
      </article>

      <div className="actions">
        <button className="primary-button" type="button" onClick={saveProperty}>
          Enregistrer
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier/public')}>
          Visualiser l’annonce
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier/vendeur')}>
          Ouvrir espace vendeur
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier/agent')}>
          Retour à l’agent
        </button>
      </div>
    </section>
  )
}

function PropertyCard({
  onNavigate,
  showManageButton = true,
}: {
  onNavigate: (route: Route) => void
  showManageButton?: boolean
}) {
  return (
    <article className="property-card">
      <PropertyPhoto />
      <div className="property-content">
        <p className="eyebrow">{demoProperty.status}</p>
        <h2>{demoProperty.title}</h2>
        <p>{demoProperty.description}</p>
        <div className="property-stats">
          <span>{demoProperty.price}</span>
          <span>{demoProperty.surface}</span>
          <span>{demoProperty.rooms} pièces</span>
          <span>statut {demoProperty.status.toLowerCase()}</span>
        </div>
        {showManageButton && (
          <button className="secondary-button compact" type="button" onClick={() => onNavigate('/demo/immobilier/bien')}>
            Gérer le bien
          </button>
        )}
      </div>
    </article>
  )
}

function PropertyPhoto() {
  return (
    <div className="property-photo" role="img" aria-label={demoProperty.mainPhotoPlaceholder}>
      <span>{demoProperty.mainPhotoPlaceholder}</span>
    </div>
  )
}

function StepProgress() {
  return (
    <div className="step-list" aria-label="Progression de vente">
      {sellerTracking.steps.map((step) => (
        <span className={step === sellerTracking.currentStep ? 'current' : ''} key={step}>
          {step}
        </span>
      ))}
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric-card">
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  )
}

function AgencyPreview() {
  return (
    <aside className="agency-preview" aria-label="Agence démo locale">
      <p className="eyebrow">Agence démo locale</p>
      <h2>{immobilierAgency.name}</h2>
      <div className="agency-lines">
        <span>{immobilierSector.sectorName}</span>
        <span>{immobilierAgency.status}</span>
        <span>{immobilierAgency.city}</span>
      </div>
      <div className="color-list">
        <span>{immobilierAgency.colors.primary}</span>
        <span>{immobilierAgency.colors.background}</span>
        <span>{immobilierAgency.colors.accent}</span>
      </div>
    </aside>
  )
}

export default App
