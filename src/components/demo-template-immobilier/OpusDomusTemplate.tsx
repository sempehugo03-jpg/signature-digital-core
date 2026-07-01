import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  demoAccounts,
  formatTemplatePrice,
  templateImmobilierConfig,
  type RealEstateDemoRole,
  type RealEstateProperty,
} from '../../data/realEstateTemplate'
import './opus-domus-template.css'

type TemplateView = 'public' | 'connexion' | 'vendeur' | 'agent' | 'patron' | 'biens' | 'bien'
type Navigate = (route: string) => void

const baseRoute = '/demo/template-immobilier'

export function OpusDomusTemplate({
  view = 'public',
  onNavigate,
}: {
  view?: TemplateView
  onNavigate?: Navigate
}) {
  if (view === 'connexion') return <TemplateLogin onNavigate={onNavigate} />
  if (view === 'vendeur') return <TemplateSpace role="seller" onNavigate={onNavigate} />
  if (view === 'agent') return <TemplateSpace role="agent" onNavigate={onNavigate} />
  if (view === 'patron') return <TemplateSpace role="owner" onNavigate={onNavigate} />

  return <TemplateLanding onNavigate={onNavigate} />
}

function TemplateLanding({ onNavigate }: { onNavigate?: Navigate }) {
  const featured = templateImmobilierConfig.properties.slice(0, 3)

  return (
    <main className="od-page">
      <section className="od-hero">
        <img
          className="od-hero-image"
          src={templateImmobilierConfig.heroImage}
          alt="Penthouse au coucher du soleil"
          width={1280}
          height={1600}
        />
        <div className="od-hero-overlay" />
        <nav className="od-topbar">
          <button className="od-brand od-brand-light" type="button" onClick={() => openRoute(baseRoute, onNavigate)}>
            {templateImmobilierConfig.agencyName}
          </button>
          <div className="od-toplinks">
            <button type="button" onClick={() => scrollToId('biens')}>Biens</button>
            <button type="button" onClick={() => scrollToId('methode')}>Agence</button>
            <button type="button" onClick={() => openRoute(`${baseRoute}/connexion`, onNavigate)}>Contact</button>
          </div>
        </nav>
        <div className="od-hero-content">
          <span>Agence — {templateImmobilierConfig.city}</span>
          <h1>
            Votre bien mérite
            <br />
            <em>une signature.</em>
          </h1>
          <div className="od-hero-actions">
            <button className="od-button od-button-dark" type="button" onClick={() => scrollToId('estimation')}>
              Estimer mon bien
            </button>
            <button className="od-button od-button-glass" type="button" onClick={() => scrollToId('biens')}>
              Voir les biens
            </button>
          </div>
        </div>
      </section>

      <section className="od-section" id="biens">
        <div className="od-section-inner">
          <div className="od-section-heading">
            <div>
              <span className="od-kicker">Collection</span>
              <h2>Nos exclusivités</h2>
            </div>
            <button className="od-text-link od-desktop-only" type="button" onClick={() => scrollToId('biens')}>
              Tout voir <span aria-hidden="true">↗</span>
            </button>
          </div>
          <div className="od-property-grid">
            {featured.map((property) => (
              <article className="od-property-card" key={property.id}>
                <button type="button" onClick={() => scrollToId('biens')} aria-label={`Voir ${property.title}`}>
                  <img src={property.imageUrl} alt={property.title} loading="lazy" />
                </button>
                <div className="od-property-meta">
                  <div>
                    <p>{property.address}</p>
                    <h3>{property.title}</h3>
                    <span>{property.surface} · {property.rooms}</span>
                  </div>
                  <strong>{formatTemplatePrice(property.priceValue)}</strong>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="od-section od-method" id="methode">
        <div className="od-narrow">
          <span className="od-kicker">Méthode</span>
          <h2>
            Une approche artisanale
            <br />
            de la vente immobilière.
          </h2>
          <div className="od-method-list">
            {[
              ['01', 'Estimation', 'Analyse de 15 000 transactions récentes dans votre quartier pour définir le juste prix.'],
              ['02', 'Mise en scène', "Photographie d'architecture, narration soignée, diffusion ciblée auprès d'acquéreurs qualifiés."],
              ['03', 'Accompagnement', 'Un interlocuteur unique. Un espace vendeur clair. Aucun appel pour réclamer une information.'],
            ].map(([number, title, text]) => (
              <article className="od-method-step" key={number}>
                <span>{number}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="od-section">
        <div className="od-seller-section">
          <div>
            <span className="od-kicker">Espace vendeur</span>
            <h2>Vous savez tout, en temps réel.</h2>
            <p>
              Visites, comptes rendus, offres, documents. Tout est sur une seule page, accessible en un instant.
            </p>
            <button className="od-outline-button" type="button" onClick={() => openRoute(`${baseRoute}/vendeur`, onNavigate)}>
              Voir une démonstration <span aria-hidden="true">↗</span>
            </button>
          </div>
          <SellerPanel />
        </div>
      </section>

      <section className="od-testimonial">
        <div className="od-narrow">
          <span className="od-quote-mark">“</span>
          <p>
            Une clarté totale sur le processus. Notre appartement a été vendu en onze jours au prix de l'estimation.
          </p>
          <div className="od-client">
            <span />
            <div>
              <strong>Marc-Antoine G.</strong>
              <small>Vendeur — Paris 16</small>
            </div>
          </div>
        </div>
      </section>

      <section className="od-final-cta" id="estimation">
        <div>
          <h2>Parlons de votre projet.</h2>
          <p>Une estimation indicative en 3 minutes. Sans engagement.</p>
          <button type="button" onClick={() => openRoute(`${baseRoute}/connexion`, onNavigate)}>
            Estimer mon bien
          </button>
        </div>
      </section>

      <footer className="od-footer">
        <strong>{templateImmobilierConfig.agencyName}</strong>
        <span>{templateImmobilierConfig.address}</span>
        <span>2026 — Tous droits réservés.</span>
      </footer>

      <TemplateMobileNav onNavigate={onNavigate} />
    </main>
  )
}

function TemplateMobileNav({ onNavigate }: { onNavigate?: Navigate }) {
  const items = [
    ['⌂', 'Accueil', baseRoute],
    ['▦', 'Biens', `${baseRoute}#biens`],
    ['◇', 'Estimer', `${baseRoute}#estimation`],
    ['◌', 'Vendeur', `${baseRoute}/vendeur`],
    ['▣', 'Pro', `${baseRoute}/agent`],
  ]

  return (
    <nav className="od-mobile-nav" aria-label="Navigation template immobilier">
      <div>
        {items.map(([icon, label, route]) => (
          <button key={route} type="button" onClick={() => openRoute(route, onNavigate)}>
            <span aria-hidden="true">{icon}</span>
            <small>{label}</small>
          </button>
        ))}
      </div>
    </nav>
  )
}

function SellerPanel() {
  return (
    <article className="od-seller-panel">
      <div className="od-panel-top">
        <span>Quai d'Orsay</span>
        <span>Mandat actif</span>
      </div>
      <div className="od-progress-row">
        <div>
          <small>Progression</small>
          <strong>60 %</strong>
        </div>
        <div>
          <small>Prochaine visite</small>
          <span>Demain · 14:00</span>
        </div>
      </div>
      <div className="od-progress"><span /></div>
      <div className="od-panel-stats">
        <Stat value="12" label="Visites" />
        <Stat value="2" label="Offres" />
        <Stat value="4" label="Documents" />
      </div>
    </article>
  )
}

function TemplateLogin({ onNavigate }: { onNavigate?: Navigate }) {
  const [role, setRole] = useState<RealEstateDemoRole>('seller')
  const [email, setEmail] = useState<string>(demoAccounts.seller.email)
  const [password, setPassword] = useState('demo')
  const [error, setError] = useState('')

  function selectRole(nextRole: RealEstateDemoRole) {
    setRole(nextRole)
    setEmail(demoAccounts[nextRole].email)
    setPassword('demo')
    setError('')
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const account = demoAccounts[role]
    if (email.trim().toLowerCase() !== account.email || password !== account.password) {
      setError('Identifiants incorrects.')
      return
    }

    openRoute(`${baseRoute}/${account.route}`, onNavigate)
  }

  return (
    <main className="od-page od-login-page">
      <section className="od-login-card">
        <button className="od-brand" type="button" onClick={() => openRoute(baseRoute, onNavigate)}>
          {templateImmobilierConfig.agencyName}
        </button>
        <div>
          <span className="od-kicker">Accès privé</span>
          <h1>Accéder à votre espace immobilier</h1>
        </div>
        <div className="od-role-tabs">
          {Object.entries(demoAccounts).map(([key, account]) => (
            <button
              className={role === key ? 'active' : ''}
              key={key}
              type="button"
              onClick={() => selectRole(key as RealEstateDemoRole)}
            >
              {account.label}
            </button>
          ))}
        </div>
        <form className="od-form" onSubmit={submit}>
          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            <span>Mot de passe</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {error && <p className="od-error">{error}</p>}
          <button type="submit">Se connecter</button>
        </form>
        <p className="od-demo-ids">vendeur@demo.fr / demo · agent@demo.fr / demo · patron@demo.fr / demo</p>
      </section>
      <TemplateMobileNav onNavigate={onNavigate} />
    </main>
  )
}

function TemplateSpace({ role, onNavigate }: { role: RealEstateDemoRole; onNavigate?: Navigate }) {
  const property = templateImmobilierConfig.properties[0]
  const copy = {
    seller: {
      eyebrow: 'Espace vendeur',
      title: 'Suivez votre mandat en temps réel.',
      body: 'Visites, offres, documents et prochaines actions restent lisibles sur une page claire.',
    },
    agent: {
      eyebrow: 'Espace professionnel',
      title: 'Les priorités du jour, sans lourdeur CRM.',
      body: 'Une vue opérationnelle pour les biens, les vendeurs et les prochaines relances.',
    },
    owner: {
      eyebrow: 'Direction',
      title: "Gardez une vision nette de l'agence.",
      body: "Mandats, offres, volume d'activité et qualité de suivi sont présentés sans surcharge.",
    },
  }[role]

  return (
    <main className="od-page od-space-page">
      <header className="od-space-header">
        <button className="od-brand" type="button" onClick={() => openRoute(baseRoute, onNavigate)}>
          {templateImmobilierConfig.agencyName}
        </button>
        <button type="button" onClick={() => openRoute(`${baseRoute}/connexion`, onNavigate)}>
          Changer d'espace
        </button>
      </header>
      <section className="od-space-layout">
        <div>
          <span className="od-kicker">{copy.eyebrow}</span>
          <h1>{copy.title}</h1>
          <p>{copy.body}</p>
          <button className="od-outline-button" type="button" onClick={() => openRoute(baseRoute, onNavigate)}>
            Voir template publique
          </button>
        </div>
        <SpacePropertyCard property={property} />
      </section>
      <section className="od-space-stats">
        <Stat value="12" label="Visites" />
        <Stat value="2" label="Offres" />
        <Stat value="4" label="Documents" />
        <Stat value="60 %" label="Progression" />
      </section>
      <TemplateMobileNav onNavigate={onNavigate} />
    </main>
  )
}

function SpacePropertyCard({ property }: { property: RealEstateProperty }) {
  return (
    <article className="od-space-property">
      <img src={property.imageUrl} alt={property.title} />
      <div>
        <span>{property.address}</span>
        <h2>{property.title}</h2>
        <strong>{formatTemplatePrice(property.priceValue)}</strong>
      </div>
      <div className="od-progress"><span /></div>
    </article>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="od-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function openRoute(route: string, onNavigate?: Navigate) {
  if (route.includes('#')) {
    const [path, hash] = route.split('#')
    if (onNavigate) onNavigate(route)
    else window.history.pushState({}, '', route)
    requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }))
    if (!onNavigate && path) window.dispatchEvent(new PopStateEvent('popstate'))
    return
  }

  if (onNavigate) {
    onNavigate(route)
    return
  }

  window.location.assign(route)
}
