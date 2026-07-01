import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  demoAccounts,
  formatTemplatePrice,
  templateImmobilierConfig,
  type RealEstateDemoRole,
  type RealEstateProperty,
} from '../../data/realEstateTemplate'
import './opus-domus-template.css'

type TemplateView = 'public' | 'connexion' | 'vendeur' | 'agent' | 'patron' | 'biens' | 'bien' | 'estimation'
type Navigate = (route: string) => void

const baseRoute = '/demo/template-immobilier'

const estimationSteps = [
  'Type de bien',
  'Localisation',
  'Caracteristiques',
  'Etat du bien',
  'Projet',
  'Coordonnees',
  'Confirmation',
]

export function OpusDomusTemplate({
  view = 'public',
  onNavigate,
}: {
  view?: TemplateView
  onNavigate?: Navigate
}) {
  if (view === 'estimation') return <EstimationTunnel onNavigate={onNavigate} />
  if (view === 'connexion') return <TemplateLogin onNavigate={onNavigate} />
  if (view === 'vendeur') return <SellerSpace onNavigate={onNavigate} />
  if (view === 'agent') return <AgentSpace onNavigate={onNavigate} />
  if (view === 'patron') return <OwnerSpace onNavigate={onNavigate} />

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
          <span>Agence - {templateImmobilierConfig.city}</span>
          <h1>
            Votre bien merite
            <br />
            <em>une signature.</em>
          </h1>
          <p>{templateImmobilierConfig.heroSubtitle}</p>
          <div className="od-hero-actions">
            <button className="od-button od-button-dark" type="button" onClick={() => openRoute(`${baseRoute}/estimation`, onNavigate)}>
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
              <h2>Nos exclusivites</h2>
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
                    <span>{property.surface} - {property.rooms}</span>
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
          <span className="od-kicker">Methode</span>
          <h2>
            Une approche artisanale
            <br />
            de la vente immobiliere.
          </h2>
          <div className="od-method-list">
            {[
              ['01', 'Valoriser le bien', 'Chaque annonce est pensee comme une presentation, pas comme une simple fiche.'],
              ['02', 'Qualifier les demandes', 'Les contacts sont mieux structures pour eviter les visites inutiles.'],
              ['03', 'Accompagner', 'Le vendeur garde une vision claire des visites, retours, offres et documents.'],
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
            <h2>Vous savez tout, en temps reel.</h2>
            <p>
              Visites, retours, offres, documents : votre espace vendeur vous donne une vision claire de la vente.
            </p>
            <p className="od-quote-line">Vous ne relancez plus l'agence. Vous voyez ou en est votre vente.</p>
            <button className="od-outline-button" type="button" onClick={() => openRoute(`${baseRoute}/vendeur`, onNavigate)}>
              Voir une demonstration <span aria-hidden="true">↗</span>
            </button>
          </div>
          <SellerPanel />
        </div>
      </section>

      <section className="od-testimonial">
        <div className="od-narrow">
          <span className="od-quote-mark">"</span>
          <p>
            Une clarte totale sur le processus. Notre appartement a ete vendu en onze jours au prix de l'estimation.
          </p>
          <div className="od-client">
            <span />
            <div>
              <strong>Marc-Antoine G.</strong>
              <small>Vendeur - Paris 16</small>
            </div>
          </div>
        </div>
      </section>

      <section className="od-final-cta" id="contact">
        <div>
          <h2>Parlons de votre projet.</h2>
          <p>Une estimation indicative en 3 minutes. Sans engagement.</p>
          <button type="button" onClick={() => openRoute(`${baseRoute}/estimation`, onNavigate)}>
            Estimer mon bien
          </button>
        </div>
      </section>

      <footer className="od-footer">
        <strong>{templateImmobilierConfig.agencyName}</strong>
        <span>{templateImmobilierConfig.address}</span>
        <span>2026 - Tous droits reserves.</span>
      </footer>

      <TemplateMobileNav onNavigate={onNavigate} />
    </main>
  )
}

function TemplateMobileNav({ onNavigate }: { onNavigate?: Navigate }) {
  const currentPath = window.location.pathname
  const currentHash = window.location.hash
  const items = [
    ['home', 'Accueil', baseRoute],
    ['building', 'Biens', `${baseRoute}#biens`],
    ['calculator', 'Estimer', `${baseRoute}/estimation`],
    ['message', 'Contact', `${baseRoute}#contact`],
    ['user', 'Espaces', `${baseRoute}/connexion`],
  ]

  return (
    <nav className="od-mobile-nav" aria-label="Navigation template immobilier">
      <div>
        {items.map(([icon, label, route]) => {
          const [path, hash] = route.split('#')
          const active = hash
            ? currentPath === path && currentHash === `#${hash}`
            : (currentPath === path && !currentHash) ||
              (label === 'Espaces' && currentPath.startsWith(`${baseRoute}/`) && currentPath !== `${baseRoute}/estimation`)

          return (
            <button className={active ? 'active' : ''} key={`${label}-${route}`} type="button" onClick={() => openRoute(route, onNavigate)}>
              <NavIcon name={icon} />
              <small>{label}</small>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    home: <path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" />,
    building: <path d="M5 21V5h14v16M9 9h2M13 9h2M9 13h2M13 13h2M9 17h6" />,
    calculator: <path d="M6 3h12v18H6zM9 7h6M9 11h1M12 11h1M15 11h1M9 15h1M12 15h1M15 15h1" />,
    message: <path d="M4 5h16v11H8l-4 4z" />,
    user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 9a7 7 0 0 0-14 0" />,
  }

  return (
    <svg aria-hidden="true" className="od-nav-icon" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
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
          <span>Demain - 14:00</span>
        </div>
      </div>
      <div className="od-progress"><span /></div>
      <div className="od-panel-stats">
        <Stat value="12" label="Visites" />
        <Stat value="2" label="Offres" />
        <Stat value="4" label="Documents" />
      </div>
      <div className="od-panel-actions">
        <p><b>Dernier compte rendu</b> Tres bon retour sur la luminosite et le quartier.</p>
        <p><b>Prochaine action</b> Relance acquereur qualifie demain matin.</p>
      </div>
    </article>
  )
}

function EstimationTunnel({ onNavigate }: { onNavigate?: Navigate }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    type: '',
    city: '',
    address: '',
    surface: '',
    rooms: '',
    bedrooms: '',
    outside: '',
    condition: '',
    project: '',
    firstName: '',
    phone: '',
    email: '',
  })
  const isConfirmation = step === estimationSteps.length - 1
  const progress = ((step + 1) / estimationSteps.length) * 100

  function next() {
    setStep((current) => Math.min(current + 1, estimationSteps.length - 1))
  }

  function back() {
    setStep((current) => Math.max(current - 1, 0))
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    next()
  }

  return (
    <main className="od-page od-estimation-page">
      <section className="od-tunnel">
        <button className="od-brand" type="button" onClick={() => openRoute(baseRoute, onNavigate)}>
          {templateImmobilierConfig.agencyName}
        </button>
        <div className="od-tunnel-progress" aria-label={`Etape ${step + 1} sur ${estimationSteps.length}`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <p className="od-kicker">Estimation - {estimationSteps[step]}</p>

        {!isConfirmation && (
          <form className="od-tunnel-card" onSubmit={submit}>
            {step === 0 && (
              <TunnelChoice
                title="Quel type de bien souhaitez-vous estimer ?"
                options={['Appartement', 'Maison', 'Immeuble', 'Terrain']}
                value={form.type}
                onChange={(type) => setForm({ ...form, type })}
              />
            )}
            {step === 1 && (
              <TunnelFields title="Ou se situe le bien ?">
                <TextField label="Ville" value={form.city} onChange={(city) => setForm({ ...form, city })} />
                <TextField label="Adresse ou quartier" value={form.address} onChange={(address) => setForm({ ...form, address })} />
              </TunnelFields>
            )}
            {step === 2 && (
              <TunnelFields title="Quelles sont ses caracteristiques ?">
                <TextField label="Surface" value={form.surface} onChange={(surface) => setForm({ ...form, surface })} />
                <TextField label="Pieces" value={form.rooms} onChange={(rooms) => setForm({ ...form, rooms })} />
                <TextField label="Chambres" value={form.bedrooms} onChange={(bedrooms) => setForm({ ...form, bedrooms })} />
                <TunnelChoice
                  compact
                  title="Exterieur"
                  options={['Oui', 'Non']}
                  value={form.outside}
                  onChange={(outside) => setForm({ ...form, outside })}
                />
              </TunnelFields>
            )}
            {step === 3 && (
              <TunnelChoice
                title="Dans quel etat est le bien ?"
                options={['A renover', 'Bon etat', 'Renove', 'Haut de gamme']}
                value={form.condition}
                onChange={(condition) => setForm({ ...form, condition })}
              />
            )}
            {step === 4 && (
              <TunnelChoice
                title="Quel est votre projet ?"
                options={['Vendre maintenant', 'Sous 3 mois', 'Sous 6 mois', 'Simple estimation']}
                value={form.project}
                onChange={(project) => setForm({ ...form, project })}
              />
            )}
            {step === 5 && (
              <TunnelFields title="Qui doit-on rappeler ?">
                <TextField label="Prenom" value={form.firstName} onChange={(firstName) => setForm({ ...form, firstName })} />
                <TextField label="Telephone" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
                <TextField label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
              </TunnelFields>
            )}
            <div className="od-tunnel-actions">
              <button className="od-tunnel-back" type="button" onClick={back} disabled={step === 0}>Retour</button>
              <button className="od-tunnel-next" type="submit">{step === 5 ? 'Transmettre' : 'Continuer'}</button>
            </div>
          </form>
        )}

        {isConfirmation && (
          <div className="od-tunnel-card od-confirmation">
            <span className="od-confirmation-mark">✓</span>
            <h1>Votre demande a bien ete transmise.</h1>
            <p>Un conseiller vous rappellera pour affiner l'estimation.</p>
            <button className="od-tunnel-next" type="button" onClick={() => openRoute(baseRoute, onNavigate)}>
              Retour a la template
            </button>
          </div>
        )}
      </section>
      <TemplateMobileNav onNavigate={onNavigate} />
    </main>
  )
}

function TunnelChoice({
  title,
  options,
  value,
  onChange,
  compact = false,
}: {
  title: string
  options: string[]
  value: string
  onChange: (value: string) => void
  compact?: boolean
}) {
  return (
    <div>
      <h1 className={compact ? 'od-tunnel-small-title' : ''}>{title}</h1>
      <div className={compact ? 'od-choice-grid od-choice-grid-compact' : 'od-choice-grid'}>
        {options.map((option) => (
          <button className={value === option ? 'selected' : ''} key={option} type="button" onClick={() => onChange(option)}>
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

function TunnelFields({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h1>{title}</h1>
      <div className="od-field-grid">{children}</div>
    </div>
  )
}

function TextField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="od-field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
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
          <span className="od-kicker">Acces prive</span>
          <h1>Choisissez votre espace.</h1>
          <p>La connexion template immobilier est separee de l'admin Signature Digital.</p>
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
          <TextField label="Email" type="email" value={email} onChange={setEmail} />
          <TextField label="Mot de passe" type="password" value={password} onChange={setPassword} />
          {error && <p className="od-error">{error}</p>}
          <button type="submit">Se connecter</button>
        </form>
        <p className="od-demo-ids">vendeur@demo.fr / demo - agent@demo.fr / demo - patron@demo.fr / demo</p>
      </section>
      <TemplateMobileNav onNavigate={onNavigate} />
    </main>
  )
}

function SellerSpace({ onNavigate }: { onNavigate?: Navigate }) {
  const property = templateImmobilierConfig.properties[0]
  const nextVisit = templateImmobilierConfig.visits[0]

  return (
    <PrivatePage title="Espace vendeur" onNavigate={onNavigate}>
      <section className="od-seller-dashboard">
        <img src={property.imageUrl} alt={property.title} />
        <div>
          <span className="od-kicker">Mandat actif</span>
          <h1>{property.title}</h1>
          <p>{property.address}</p>
          <strong>{formatTemplatePrice(property.priceValue)}</strong>
        </div>
      </section>
      <section className="od-space-stats od-space-stats-dark">
        <Stat value="60 %" label="Progression" />
        <Stat value="12" label="Visites" />
        <Stat value="2" label="Offres" />
        <Stat value="4" label="Documents" />
      </section>
      <section className="od-space-grid">
        <SpaceCard title="Prochaine visite" text={`${nextVisit.property} - ${nextVisit.time} avec ${nextVisit.buyer}`} />
        <SpaceCard title="Dernier compte rendu" text="Tres bon retour sur la luminosite, le calme et la qualite de l'adresse." />
        <SpaceCard title="Offres recues" text={templateImmobilierConfig.offers.map((offer) => `${offer.buyer} - ${offer.amount}`).join(' / ')} />
        <SpaceCard title="Documents" text={templateImmobilierConfig.documents.map((document) => document.title).join(' - ')} />
        <SpaceCard title="Prochaine action" text="L'agence relance les deux acquereurs qualifies et vous confirme la meilleure offre." />
      </section>
      <blockquote>Vous ne relancez plus l'agence. Vous voyez ou en est votre vente.</blockquote>
    </PrivatePage>
  )
}

function AgentSpace({ onNavigate }: { onNavigate?: Navigate }) {
  return (
    <PrivatePage title="Espace agent" onNavigate={onNavigate}>
      <section className="od-space-heading">
        <span className="od-kicker">Camille Aurel</span>
        <h1>Priorites du jour, annonces et suivi vendeur.</h1>
      </section>
      <section className="od-space-stats od-space-stats-dark">
        <Stat value="3" label="Biens" />
        <Stat value="3" label="Visites" />
        <Stat value="2" label="Offres" />
        <Stat value="4" label="Documents" />
      </section>
      <section className="od-management-layout">
        <Panel title="Mes biens">
          {templateImmobilierConfig.properties.map((property) => (
            <MiniProperty property={property} key={property.id} />
          ))}
        </Panel>
        <Panel title="Visites a venir">
          {templateImmobilierConfig.visits.map((visit) => (
            <LineItem key={visit.id} title={`${visit.property} - ${visit.time}`} text={`${visit.buyer} avec ${visit.agent}`} />
          ))}
        </Panel>
        <Panel title="Demandes acheteurs">
          {templateImmobilierConfig.requests.map((request) => (
            <LineItem key={request.id} title={request.type} text={`${request.contact} - ${request.detail}`} />
          ))}
        </Panel>
        <Panel title="Documents">
          {templateImmobilierConfig.documents.map((document) => (
            <LineItem key={document.id} title={document.title} text={`${document.property} - ${document.status}`} />
          ))}
        </Panel>
      </section>
      <QuickActions
        actions={['Nouveau bien', 'Ajouter photo', 'Ajouter document', 'Programmer visite', 'Ajouter compte rendu', 'Ouvrir espace vendeur']}
        onNavigate={onNavigate}
      />
    </PrivatePage>
  )
}

function OwnerSpace({ onNavigate }: { onNavigate?: Navigate }) {
  return (
    <PrivatePage title="Espace patron" onNavigate={onNavigate}>
      <section className="od-space-heading">
        <span className="od-kicker">Direction agence</span>
        <h1>Une vision globale, simple et elegante.</h1>
      </section>
      <section className="od-space-stats od-space-stats-dark">
        <Stat value="3" label="Biens actifs" />
        <Stat value="2" label="Agents" />
        <Stat value="3" label="Demandes" />
        <Stat value="2" label="Offres" />
      </section>
      <section className="od-management-layout">
        <Panel title="Biens actifs">
          {templateImmobilierConfig.properties.map((property) => (
            <MiniProperty property={property} key={property.id} />
          ))}
        </Panel>
        <Panel title="Agents">
          {templateImmobilierConfig.agents.map((agent) => (
            <LineItem key={agent.id} title={agent.name} text={`${agent.role} - ${agent.activeListings} biens`} />
          ))}
        </Panel>
        <Panel title="Demandes recues">
          {templateImmobilierConfig.requests.map((request) => (
            <LineItem key={request.id} title={request.type} text={`${request.contact} - ${request.detail}`} />
          ))}
        </Panel>
        <Panel title="Offres en cours">
          {templateImmobilierConfig.offers.map((offer) => (
            <LineItem key={offer.id} title={`${offer.buyer} - ${offer.amount}`} text={`${offer.property} - ${offer.status}`} />
          ))}
        </Panel>
      </section>
      <QuickActions
        actions={['Ajouter un bien', 'Ajouter un agent', 'Voir demandes', 'Ajouter photos', 'Voir documents', 'Ouvrir template publique', 'Ouvrir espace agent', 'Ouvrir espace vendeur demo']}
        onNavigate={onNavigate}
      />
    </PrivatePage>
  )
}

function PrivatePage({ title, children, onNavigate }: { title: string; children: ReactNode; onNavigate?: Navigate }) {
  return (
    <main className="od-page od-space-page">
      <header className="od-space-header">
        <button className="od-brand" type="button" onClick={() => openRoute(baseRoute, onNavigate)}>
          {templateImmobilierConfig.agencyName}
        </button>
        <span>{title}</span>
        <button type="button" onClick={() => openRoute(`${baseRoute}/connexion`, onNavigate)}>Changer d'espace</button>
      </header>
      {children}
      <TemplateMobileNav onNavigate={onNavigate} />
    </main>
  )
}

function MiniProperty({ property }: { property: RealEstateProperty }) {
  return (
    <article className="od-mini-property">
      <img src={property.imageUrl} alt={property.title} />
      <div>
        <strong>{property.title}</strong>
        <span>{property.address}</span>
        <small>{formatTemplatePrice(property.priceValue)} - {property.surface}</small>
      </div>
    </article>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="od-panel">
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  )
}

function LineItem({ title, text }: { title: string; text: string }) {
  return (
    <article className="od-line-item">
      <strong>{title}</strong>
      <span>{text}</span>
    </article>
  )
}

function SpaceCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="od-space-card">
      <h2>{title}</h2>
      <p>{text}</p>
    </article>
  )
}

function QuickActions({ actions, onNavigate }: { actions: string[]; onNavigate?: Navigate }) {
  function handleAction(action: string) {
    if (action.includes('publique')) openRoute(baseRoute, onNavigate)
    if (action.includes('agent')) openRoute(`${baseRoute}/agent`, onNavigate)
    if (action.includes('vendeur')) openRoute(`${baseRoute}/vendeur`, onNavigate)
  }

  return (
    <section className="od-quick-actions">
      <span className="od-kicker">Actions rapides</span>
      <div>
        {actions.map((action) => (
          <button type="button" key={action} onClick={() => handleAction(action)}>
            {action}
          </button>
        ))}
      </div>
    </section>
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
