import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  demoAccounts,
  formatTemplatePrice,
  templateImmobilierConfig,
  type RealEstateProperty,
} from '../../data/realEstateTemplate'
import './opus-domus-template.css'

type TemplateView = 'public' | 'connexion' | 'vendeur' | 'agent' | 'patron' | 'biens' | 'bien' | 'estimation'
type Navigate = (route: string) => void
type NavMode = 'public' | 'seller' | 'agent' | 'owner'
type ActionKind = 'new-property' | 'photo' | 'document' | 'visit' | 'report' | 'agent' | 'requests' | 'disable-agent'

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

function TemplateMobileNav({ mode = 'public', onNavigate }: { mode?: NavMode; onNavigate?: Navigate }) {
  const currentPath = window.location.pathname
  const currentHash = window.location.hash
  const [collapsed, setCollapsed] = useState(false)
  const itemsByMode: Record<NavMode, string[][]> = {
    public: [
      ['home', 'Accueil', baseRoute],
      ['building', 'Biens', `${baseRoute}#biens`],
      ['calculator', 'Estimer', `${baseRoute}/estimation`],
      ['message', 'Contact', `${baseRoute}#contact`],
      ['user', 'Espaces', `${baseRoute}/connexion`],
    ],
    seller: [
      ['home', 'Accueil', `${baseRoute}/vendeur`],
      ['calendar', 'Visites', `${baseRoute}/vendeur#visites`],
      ['offer', 'Offres', `${baseRoute}/vendeur#offres`],
      ['document', 'Docs', `${baseRoute}/vendeur#documents`],
      ['user', 'Profil', `${baseRoute}/connexion`],
    ],
    agent: [
      ['home', 'Accueil', `${baseRoute}/agent`],
      ['building', 'Biens', `${baseRoute}/agent#biens`],
      ['calendar', 'Visites', `${baseRoute}/agent#visites`],
      ['message', 'Demandes', `${baseRoute}/agent#demandes`],
      ['user', 'Profil', `${baseRoute}/connexion`],
    ],
    owner: [
      ['home', 'Accueil', `${baseRoute}/patron`],
      ['building', 'Biens', `${baseRoute}/patron#biens`],
      ['agents', 'Agents', `${baseRoute}/patron#agents`],
      ['message', 'Demandes', `${baseRoute}/patron#demandes`],
      ['user', 'Profil', `${baseRoute}/connexion`],
    ],
  }

  useEffect(() => {
    let lastY = window.scrollY

    function onScroll() {
      const nextY = window.scrollY
      const goingDown = nextY > lastY + 8
      const goingUp = nextY < lastY - 8
      if (nextY < 80 || goingUp) setCollapsed(false)
      if (goingDown && nextY > 160) setCollapsed(true)
      lastY = nextY
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const items = itemsByMode[mode]

  return (
    <nav className={collapsed ? 'od-mobile-nav is-collapsed' : 'od-mobile-nav'} aria-label="Navigation template immobilier">
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
    agents: <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 21a6 6 0 0 1 12 0m1-6a5 5 0 0 1 5 5" />,
    calculator: <path d="M6 3h12v18H6zM9 7h6M9 11h1M12 11h1M15 11h1M9 15h1M12 15h1M15 15h1" />,
    calendar: <path d="M7 3v3m10-3v3M4 8h16M5 5h14v16H5zM8 12h3M13 12h3M8 16h3" />,
    document: <path d="M7 3h7l4 4v14H7zM14 3v5h5M10 12h6M10 16h6" />,
    offer: <path d="M4 7h16v11H4zM7 7V5h10v2M8 13h8M8 16h5" />,
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
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    const account = Object.values(demoAccounts).find((item) => item.email === email.trim().toLowerCase())
    if (!account || password !== account.password) {
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
          <h1>Connectez votre espace immobilier.</h1>
          <p>Entrez votre email et votre mot de passe. Le bon espace s'ouvre automatiquement.</p>
        </div>
        <form className="od-form" onSubmit={submit}>
          <TextField label="Email" type="email" value={email} onChange={setEmail} />
          <TextField label="Mot de passe" type="password" value={password} onChange={setPassword} />
          {error && <p className="od-error">{error}</p>}
          <button type="submit">Se connecter</button>
        </form>
        <button className="od-login-back" type="button" onClick={() => openRoute(baseRoute, onNavigate)}>Retour template publique</button>
        <p className="od-demo-ids">vendeur@demo.fr / demo - agent@demo.fr / demo - patron@demo.fr / demo</p>
      </section>
      <TemplateMobileNav onNavigate={onNavigate} />
    </main>
  )
}

function SellerSpace({ onNavigate }: { onNavigate?: Navigate }) {
  const property = templateImmobilierConfig.properties[0]

  return (
    <PrivatePage title="Espace vendeur" mode="seller" onNavigate={onNavigate}>
      <section className="od-private-hero od-private-hero-seller">
        <div>
          <span className="od-kicker">Espace vendeur</span>
          <h1>Bonjour,</h1>
          <p>Vous ne relancez plus l'agence. Vous voyez ou en est votre vente.</p>
        </div>
        <button className="od-icon-button" type="button" aria-label="Notifications">
          <NavIcon name="message" />
        </button>
      </section>

      <section className="od-vendor-showcase">
        <img src={property.imageUrl} alt={property.title} />
        <article className="od-vendor-card">
          <span>{property.address}</span>
          <h2>{property.title}</h2>
          <p>Prix affiche : {formatTemplatePrice(property.priceValue)}</p>
          <div className="od-vendor-progress">
            <div>
              <small>Progression</small>
              <strong>60 %</strong>
            </div>
            <div className="od-progress"><span /></div>
            <div className="od-progress-steps">
              <span>Mise en vente</span>
              <span>Signature</span>
            </div>
          </div>
        </article>
      </section>

      <section className="od-space-stats od-space-stats-light">
        <Stat value="12" label="Visites" />
        <Stat value="2" label="Offres" />
        <Stat value="4" label="Documents" />
      </section>

      <section className="od-space-grid od-seller-grid">
        <SpaceCard
          id="visites"
          title="Prochaine visite"
          text="Demain - 14:00. M. & Mme Garnier - couple, 38 ans, 1ere acquisition. Statut confirme."
        />
        <SpaceCard
          title="Dernier compte rendu"
          text="Visite du 24 juin - Mme Dupuis. Tres bon retour sur la luminosite et le quartier. Reserves sur la cuisine. Acquereur serieux, dossier financier valide."
        />
        <SpaceCard id="offres" title="Offres recues" text={templateImmobilierConfig.offers.map((offer) => `${offer.buyer} - ${offer.amount}`).join(' / ')} />
        <SpaceCard id="documents" title="Documents" text={templateImmobilierConfig.documents.map((document) => document.title).join(' - ')} />
        <SpaceCard title="Prochaine action" text="Votre conseiller affine les offres et vous partage la meilleure strategie de negociation." />
      </section>
    </PrivatePage>
  )
}

function AgentSpace({ onNavigate }: { onNavigate?: Navigate }) {
  const [activeAction, setActiveAction] = useState<ActionKind | null>(null)

  return (
    <PrivatePage title="Espace agent" mode="agent" onNavigate={onNavigate}>
      <section className="od-private-hero od-private-hero-agent">
        <span className="od-kicker">Camille Aurel</span>
        <h1>Espace agent</h1>
        <div className="od-private-actions">
          <button className="od-icon-button" type="button" aria-label="Recherche">
            <NavIcon name="building" />
          </button>
          <button className="od-icon-button" type="button" aria-label="Notifications">
            <NavIcon name="message" />
          </button>
          <button className="od-solid-action" type="button" onClick={() => setActiveAction('new-property')}>+ Nouveau bien</button>
        </div>
      </section>

      <section className="od-space-stats od-space-stats-light">
        <Stat value="12" label="Mandats actifs" />
        <Stat value="3" label="Visites aujourd'hui" />
        <Stat value="5" label="Offres en cours" />
        <Stat value="1.4M" label="CA en cours" />
      </section>

      <section className="od-management-layout">
        <Panel title="Aujourd'hui" id="visites">
          {templateImmobilierConfig.visits.map((visit) => (
            <LineItem key={visit.id} title={`${visit.time} ${visit.property}`} text={visit.buyer} />
          ))}
        </Panel>
        <Panel title="Mes mandats" id="biens">
          {templateImmobilierConfig.properties.map((property) => (
            <MiniProperty property={property} key={property.id} />
          ))}
        </Panel>
        <Panel title="Demandes acheteurs" id="demandes">
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
        actions={[
          ['Nouveau bien', 'new-property'],
          ['Ajouter photo', 'photo'],
          ['Ajouter document', 'document'],
          ['Programmer visite', 'visit'],
          ['Ajouter compte rendu', 'report'],
        ]}
        onAction={setActiveAction}
      />
      <ActionModal action={activeAction} onClose={() => setActiveAction(null)} />
    </PrivatePage>
  )
}

function OwnerSpace({ onNavigate }: { onNavigate?: Navigate }) {
  const [activeAction, setActiveAction] = useState<ActionKind | null>(null)
  const [agents, setAgents] = useState(templateImmobilierConfig.agents)
  const [agentToDisable, setAgentToDisable] = useState<string | null>(null)

  function disableAgent(agentId: string) {
    setAgents((current) => current.filter((agent) => agent.id !== agentId))
    setAgentToDisable(null)
  }

  return (
    <PrivatePage title="Espace patron" mode="owner" onNavigate={onNavigate}>
      <section className="od-private-hero od-private-hero-agent">
        <span className="od-kicker">Direction agence</span>
        <h1>Espace patron</h1>
        <div className="od-private-actions">
          <button className="od-solid-action od-solid-action-light" type="button" onClick={() => setActiveAction('agent')}>+ Ajouter agent</button>
          <button className="od-solid-action" type="button" onClick={() => setActiveAction('new-property')}>+ Nouveau bien</button>
        </div>
      </section>

      <section className="od-space-stats od-space-stats-light">
        <Stat value={`${agents.length}`} label="Agents" />
        <Stat value="12" label="Mandats actifs" />
        <Stat value="9" label="Visites cette semaine" />
        <Stat value="5" label="Offres en cours" />
      </section>

      <section className="od-management-layout">
        <Panel title="Agents" id="agents">
          {agents.map((agent) => (
            <article className="od-agent-row" key={agent.id}>
              <LineItem title={agent.name} text={`${agent.role} - ${agent.activeListings} biens suivis`} />
              {agentToDisable === agent.id ? (
                <div className="od-confirm-row">
                  <button type="button" onClick={() => disableAgent(agent.id)}>Confirmer</button>
                  <button type="button" onClick={() => setAgentToDisable(null)}>Annuler</button>
                </div>
              ) : (
                <button type="button" onClick={() => setAgentToDisable(agent.id)}>Desactiver</button>
              )}
            </article>
          ))}
        </Panel>
        <Panel title="Biens de l'agence" id="biens">
          {templateImmobilierConfig.properties.map((property) => (
            <MiniProperty property={property} key={property.id} />
          ))}
        </Panel>
        <Panel title="Demandes recues" id="demandes">
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
        actions={[
          ['Ajouter agent', 'agent'],
          ['Supprimer agent', 'disable-agent'],
          ['Nouveau bien', 'new-property'],
          ['Voir demandes', 'requests'],
        ]}
        onAction={(action) => {
          if (action === 'disable-agent') {
            setAgentToDisable(agents[0]?.id ?? null)
            return
          }
          setActiveAction(action)
        }}
      />
      <section className="od-quick-actions od-private-links">
        <span className="od-kicker">Liens rapides</span>
        <div>
          <button type="button" onClick={() => openRoute(baseRoute, onNavigate)}>Voir template publique</button>
          <button type="button" onClick={() => openRoute(`${baseRoute}/agent`, onNavigate)}>Ouvrir espace agent</button>
          <button type="button" onClick={() => openRoute(`${baseRoute}/vendeur`, onNavigate)}>Ouvrir espace vendeur demo</button>
        </div>
      </section>
      <ActionModal
        action={activeAction}
        onClose={() => setActiveAction(null)}
        requests={templateImmobilierConfig.requests.map((request) => `${request.type} - ${request.contact} - ${request.detail}`)}
      />
    </PrivatePage>
  )
}

function PrivatePage({
  title,
  mode,
  children,
  onNavigate,
}: {
  title: string
  mode: NavMode
  children: ReactNode
  onNavigate?: Navigate
}) {
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
      <TemplateMobileNav mode={mode} onNavigate={onNavigate} />
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

function Panel({ title, id, children }: { title: string; id?: string; children: ReactNode }) {
  return (
    <section className="od-panel" id={id}>
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

function SpaceCard({ title, text, id }: { title: string; text: string; id?: string }) {
  return (
    <article className="od-space-card" id={id}>
      <h2>{title}</h2>
      <p>{text}</p>
    </article>
  )
}

function QuickActions({
  actions,
  onAction,
}: {
  actions: Array<[string, ActionKind]>
  onAction: (action: ActionKind) => void
}) {
  return (
    <section className="od-quick-actions">
      <span className="od-kicker">Actions rapides</span>
      <div>
        {actions.map(([label, action]) => (
          <button type="button" key={action} onClick={() => onAction(action)}>
            {label}
          </button>
        ))}
      </div>
    </section>
  )
}

function ActionModal({
  action,
  onClose,
  requests = [],
}: {
  action: ActionKind | null
  onClose: () => void
  requests?: string[]
}) {
  const [confirmed, setConfirmed] = useState(false)
  if (!action) return null

  const titles: Record<ActionKind, string> = {
    'new-property': 'Nouveau bien',
    photo: 'Ajouter photo',
    document: 'Ajouter document',
    visit: 'Programmer visite',
    report: 'Ajouter compte rendu',
    agent: 'Ajouter agent',
    requests: 'Demandes recues',
    'disable-agent': 'Desactiver agent',
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    setConfirmed(true)
  }

  return (
    <div className="od-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="od-action-modal" role="dialog" aria-modal="true" aria-label={titles[action]} onClick={(event) => event.stopPropagation()}>
        <button className="od-modal-close" type="button" onClick={onClose}>Fermer</button>
        <span className="od-kicker">Action V1</span>
        <h2>{titles[action]}</h2>
        {action === 'requests' ? (
          <div className="od-request-list">
            {requests.map((request) => <LineItem key={request} title={request.split(' - ')[0]} text={request.split(' - ').slice(1).join(' - ')} />)}
          </div>
        ) : confirmed ? (
          <p className="od-action-confirmation">Action enregistree localement pour la demo.</p>
        ) : (
          <form className="od-form" onSubmit={submit}>
            <ActionFields action={action} />
            <button type="submit">Valider</button>
          </form>
        )}
      </section>
    </div>
  )
}

function ActionFields({ action }: { action: ActionKind }) {
  if (action === 'agent') {
    return (
      <>
        <ActionInput label="Prenom" />
        <ActionInput label="Nom" />
        <ActionInput label="Email" type="email" />
        <ActionInput label="Telephone" />
        <ActionInput label="Role" />
      </>
    )
  }

  if (action === 'photo') {
    return (
      <>
        <SelectField label="Bien" options={templateImmobilierConfig.properties.map((property) => property.title)} />
        <ActionInput label="URL photo ou upload simule" />
      </>
    )
  }

  if (action === 'document') {
    return (
      <>
        <SelectField label="Bien" options={templateImmobilierConfig.properties.map((property) => property.title)} />
        <ActionInput label="Type document" />
        <ActionInput label="Nom document" />
      </>
    )
  }

  if (action === 'visit') {
    return (
      <>
        <SelectField label="Bien" options={templateImmobilierConfig.properties.map((property) => property.title)} />
        <ActionInput label="Date" type="date" />
        <ActionInput label="Heure" type="time" />
        <ActionInput label="Visiteur" />
        <ActionInput label="Note" />
      </>
    )
  }

  if (action === 'report') {
    return (
      <>
        <SelectField label="Bien" options={templateImmobilierConfig.properties.map((property) => property.title)} />
        <ActionInput label="Visite liee" />
        <ActionInput label="Compte rendu" />
        <SelectField label="Niveau interet" options={['Faible', 'Moyen', 'Fort']} />
      </>
    )
  }

  return (
    <>
      <ActionInput label="Titre" />
      <ActionInput label="Adresse" />
      <ActionInput label="Prix" />
      <ActionInput label="Surface" />
      <ActionInput label="Pieces" />
      <ActionInput label="Description courte" />
      <ActionInput label="Image URL ou upload simule" />
    </>
  )
}

function ActionInput({ label, type = 'text' }: { label: string; type?: string }) {
  return (
    <label className="od-field">
      <span>{label}</span>
      <input type={type} />
    </label>
  )
}

function SelectField({ label, options }: { label: string; options: string[] }) {
  return (
    <label className="od-field">
      <span>{label}</span>
      <select defaultValue={options[0]}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
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
