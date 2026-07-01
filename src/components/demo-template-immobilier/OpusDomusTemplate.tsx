import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  demoAccounts,
  formatTemplatePrice,
  getTemplateDocumentsByProperty,
  getTemplateOffersByProperty,
  getTemplatePropertyById,
  getTemplateReportsByProperty,
  getTemplateRequestsByProperty,
  getTemplateVisitsByProperty,
  templateImmobilierConfig,
  type RealEstateAgent,
  type RealEstateProperty,
} from '../../data/realEstateTemplate'
import './opus-domus-template.css'

type TemplateView = 'public' | 'connexion' | 'vendeur' | 'agent' | 'patron' | 'biens' | 'bien' | 'estimation'
type Navigate = (route: string) => void
type NavMode = 'public' | 'seller' | 'agent' | 'owner'
type ActionKind = 'new-property' | 'photo' | 'document' | 'visit' | 'report' | 'agent' | 'requests' | 'disable-agent'
type TemplateSessionRole = 'vendeur' | 'agent' | 'patron'
type TemplateSession = { email: string; role: TemplateSessionRole; name: string }
type ActionValues = Record<string, string>

const baseRoute = '/demo/template-immobilier'
const templateSessionStorageKey = 'signatureDigitalTemplateSession'

const estimationSteps = [
  'Type de bien',
  'Localisation',
  'Caracteristiques',
  'Etat du bien',
  'Projet',
  'Coordonnees',
  'Confirmation',
]

function readTemplateSession(): TemplateSession | null {
  try {
    const raw = window.localStorage.getItem(templateSessionStorageKey)
    return raw ? JSON.parse(raw) as TemplateSession : null
  } catch {
    return null
  }
}

function writeTemplateSession(session: TemplateSession) {
  window.localStorage.setItem(templateSessionStorageKey, JSON.stringify(session))
}

function appendLocalTemplateRequest(values: ActionValues) {
  const storageKey = 'signatureDigitalTemplateRequests'
  const current = JSON.parse(window.localStorage.getItem(storageKey) || '[]') as ActionValues[]
  window.localStorage.setItem(storageKey, JSON.stringify([{ id: `request-${Date.now()}`, ...values }, ...current]))
}

export function OpusDomusTemplate({
  view = 'public',
  propertyId,
  onNavigate,
}: {
  view?: TemplateView
  propertyId?: string
  onNavigate?: Navigate
}) {
  if (view === 'estimation') return <EstimationTunnel onNavigate={onNavigate} />
  if (view === 'connexion') return <TemplateLogin onNavigate={onNavigate} />
  if (view === 'vendeur') return <SellerSpace onNavigate={onNavigate} />
  if (view === 'agent') return <AgentSpace onNavigate={onNavigate} />
  if (view === 'patron') return <OwnerSpace onNavigate={onNavigate} />
  if (view === 'bien') return <PropertyDetail propertyId={propertyId} onNavigate={onNavigate} />

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
                <button type="button" onClick={() => openRoute(`${baseRoute}/bien/${property.id}`, onNavigate)} aria-label={`Voir ${property.title}`}>
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
    if (step === 5) {
      appendLocalTemplateRequest({
        type: 'Demande estimation',
        propertyId: 'appartement-haussmannien',
        name: form.firstName,
        phone: form.phone,
        email: form.email,
        message: `${form.type} - ${form.city} - ${form.project}`,
        status: 'Nouvelle',
      })
    }
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

    writeTemplateSession({
      email: account.email,
      role: account.role,
      name: account.name,
    })
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

function PropertyDetail({ propertyId, onNavigate }: { propertyId?: string; onNavigate?: Navigate }) {
  const session = readTemplateSession()
  const property = getTemplatePropertyById(propertyId) ?? templateImmobilierConfig.properties[0]
  const documents = getTemplateDocumentsByProperty(property.id)
  const visits = getTemplateVisitsByProperty(property.id)
  const reports = getTemplateReportsByProperty(property.id)
  const offers = getTemplateOffersByProperty(property.id)
  const requests = getTemplateRequestsByProperty(property.id)
  const agent = templateImmobilierConfig.agents.find((item) => item.id === property.assignedAgentId)
  const [activeAction, setActiveAction] = useState<ActionKind | null>(null)
  const [activity, setActivity] = useState<string[]>([])
  const canManage = session?.role === 'agent' || session?.role === 'patron'
  const isOwner = session?.role === 'patron'
  const mode: NavMode = session?.role === 'vendeur' ? 'seller' : session?.role === 'patron' ? 'owner' : session?.role === 'agent' ? 'agent' : 'public'

  function completeDetailAction(action: ActionKind, values: ActionValues) {
    if (action === 'requests') {
      appendLocalTemplateRequest({
        type: 'Demande visite',
        propertyId: property.id,
        name: values.nom,
        phone: values.telephone,
        email: values.email,
        message: values.message,
        status: 'Nouvelle',
      })
    }
    setActivity((current) => [`${actionLabel(action)} enregistre localement.`, ...current].slice(0, 3))
  }

  return (
    <main className="od-page od-space-page">
      <header className="od-space-header">
        <button className="od-brand" type="button" onClick={() => openRoute(baseRoute, onNavigate)}>
          {templateImmobilierConfig.agencyName}
        </button>
        <span>Fiche bien</span>
        <button type="button" onClick={() => openRoute(`${baseRoute}/connexion`, onNavigate)}>
          {session ? session.name : 'Connexion'}
        </button>
      </header>

      <section className="od-property-detail-hero">
        <img src={property.imageUrl} alt={property.title} />
        <div>
          <span className="od-kicker">{property.address}</span>
          <h1>{property.title}</h1>
          <p>{property.description}</p>
          <strong>{formatTemplatePrice(property.priceValue)}</strong>
          <div className="od-detail-actions">
            {!session && <button className="od-solid-action" type="button" onClick={() => setActiveAction('requests')}>Demander une visite</button>}
            {canManage && (
              <>
                <button className="od-solid-action" type="button" onClick={() => setActiveAction('photo')}>Ajouter photo</button>
                <button className="od-solid-action od-solid-action-light" type="button" onClick={() => setActiveAction('document')}>Ajouter document</button>
              </>
            )}
            {isOwner && <button className="od-solid-action od-danger-action" type="button" onClick={() => setActiveAction('disable-agent')}>Desactiver bien</button>}
          </div>
        </div>
      </section>

      <section className="od-gallery-strip" aria-label="Galerie du bien">
        {property.images.map((image) => <img src={image} alt={`${property.title} detail`} key={image} />)}
      </section>

      <section className="od-space-stats od-space-stats-light">
        <Stat value={property.surface} label="Surface" />
        <Stat value={property.rooms} label="Pieces" />
        <Stat value={`${property.progress} %`} label="Progression" />
        <Stat value={agent?.name ?? 'Agence'} label="Agent" />
      </section>

      <section className="od-management-layout od-detail-layout">
        <Panel title="Points forts">
          {property.highlights.map((highlight) => <LineItem key={highlight} title={highlight} text="Selection Opus Domus" />)}
        </Panel>
        <Panel title="Documents" id="documents">
          {documents.map((document) => <LineItem key={document.id} title={document.name} text={`${document.type} - ${document.status}`} />)}
        </Panel>
        <Panel title="Visites" id="visites">
          {visits.map((visit) => <LineItem key={visit.id} title={`${visit.date} - ${visit.time}`} text={`${visit.buyerName} - ${visit.status}`} />)}
        </Panel>
        <Panel title="Offres" id="offres">
          {offers.length ? offers.map((offer) => <LineItem key={offer.id} title={`${offer.buyerName} - ${offer.amount}`} text={offer.status} />) : <LineItem title="Aucune offre" text="Les offres apparaitront ici." />}
        </Panel>
        <Panel title="Comptes rendus">
          {reports.length ? reports.map((report) => <LineItem key={report.id} title={`${report.createdAt} - interet ${report.interestLevel}`} text={report.content} />) : <LineItem title="Aucun compte rendu" text="Les retours de visite apparaitront ici." />}
        </Panel>
        <Panel title="Demandes">
          {requests.length ? requests.map((request) => <LineItem key={request.id} title={request.type} text={`${request.name} - ${request.status}`} />) : <LineItem title="Aucune demande" text="Les demandes acheteurs apparaitront ici." />}
        </Panel>
      </section>

      {canManage && (
        <QuickActions
          actions={[
            ['Modifier infos', 'new-property'],
            ['Ajouter photo', 'photo'],
            ['Ajouter document', 'document'],
            ['Programmer visite', 'visit'],
            ['Ajouter compte rendu', 'report'],
            ...(isOwner ? [['Assigner agent', 'agent'] as [string, ActionKind]] : []),
          ]}
          onAction={setActiveAction}
        />
      )}

      {activity.length > 0 && (
        <section className="od-action-feed">
          {activity.map((item) => <p key={item}>{item}</p>)}
        </section>
      )}

      <ActionModal
        action={activeAction}
        onClose={() => setActiveAction(null)}
        onConfirm={completeDetailAction}
        propertyOptions={[property]}
        requestsMode={!session ? 'form' : 'list'}
        requests={requests.map((request) => `${request.type} - ${request.name} - ${request.message}`)}
      />
      <TemplateMobileNav mode={mode} onNavigate={onNavigate} />
    </main>
  )
}

function SellerSpace({ onNavigate }: { onNavigate?: Navigate }) {
  const session = readTemplateSession()
  const seller = templateImmobilierConfig.sellers.find((item) => item.email === session?.email) ?? templateImmobilierConfig.sellers[0]
  const property = getTemplatePropertyById(seller.propertyId) ?? templateImmobilierConfig.properties[0]
  const visits = getTemplateVisitsByProperty(property.id)
  const reports = getTemplateReportsByProperty(property.id)
  const offers = getTemplateOffersByProperty(property.id)
  const documents = getTemplateDocumentsByProperty(property.id)
  const nextVisit = visits[0]
  const lastReport = reports[0]

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
              <strong>{property.progress} %</strong>
            </div>
            <div className="od-progress"><span style={{ width: `${property.progress}%` }} /></div>
            <div className="od-progress-steps">
              <span>Mise en vente</span>
              <span>Signature</span>
            </div>
          </div>
          <button className="od-solid-action od-card-action" type="button" onClick={() => openRoute(`${baseRoute}/bien/${property.id}`, onNavigate)}>
            Voir la fiche complete
          </button>
        </article>
      </section>

      <section className="od-space-stats od-space-stats-light">
        <Stat value={`${visits.length || 1}`} label="Visites" />
        <Stat value={`${offers.length}`} label="Offres" />
        <Stat value={`${documents.length}`} label="Documents" />
      </section>

      <section className="od-space-grid od-seller-grid">
        <SpaceCard
          id="visites"
          title="Prochaine visite"
          text={nextVisit ? `${nextVisit.date} - ${nextVisit.time}. ${nextVisit.buyerName} - ${nextVisit.note} Statut ${nextVisit.status}.` : 'Aucune visite programmee.'}
        />
        <SpaceCard
          title="Dernier compte rendu"
          text={lastReport?.content ?? 'Aucun compte rendu pour le moment.'}
        />
        <SpaceCard id="offres" title="Offres recues" text={offers.map((offer) => `${offer.buyerName} - ${offer.amount}`).join(' / ') || 'Aucune offre recue.'} />
        <SpaceCard id="documents" title="Documents" text={documents.map((document) => document.name).join(' - ') || 'Documents en preparation.'} />
        <SpaceCard title="Prochaine action" text="Votre conseiller affine les offres et vous partage la meilleure strategie de negociation." />
      </section>
    </PrivatePage>
  )
}

function AgentSpace({ onNavigate }: { onNavigate?: Navigate }) {
  const [activeAction, setActiveAction] = useState<ActionKind | null>(null)
  const session = readTemplateSession()
  const agent = templateImmobilierConfig.agents.find((item) => item.email === session?.email) ?? templateImmobilierConfig.agents[0]
  const [localProperties, setLocalProperties] = useState(() => (
    templateImmobilierConfig.properties.filter((property) => agent.assignedPropertyIds.includes(property.id))
  ))
  const [activity, setActivity] = useState<string[]>([])

  function completeAction(action: ActionKind, values: ActionValues) {
    if (action === 'new-property') {
      const title = values.titre || 'Nouveau bien'
      setLocalProperties((current) => [
        ...current,
        {
          ...templateImmobilierConfig.properties[0],
          id: `local-${Date.now()}`,
          title,
          address: values.adresse || 'Adresse a completer',
          price: values.prix || 'Prix a completer',
          priceValue: Number(values.prix?.replace(/[^\d]/g, '')) || 0,
          surface: values.surface || 'Surface a completer',
          rooms: values.pieces || 'Pieces a completer',
          description: values.description_courte || 'Description courte a completer.',
          imageUrl: values.image_url_ou_upload_simule || templateImmobilierConfig.properties[0].imageUrl,
          images: [values.image_url_ou_upload_simule || templateImmobilierConfig.properties[0].imageUrl],
          photos: [values.image_url_ou_upload_simule || templateImmobilierConfig.properties[0].imageUrl],
          assignedAgentId: agent.id,
          documents: [],
          visits: [],
          reports: [],
          offers: [],
          progress: 10,
        },
      ])
    }
    setActivity((current) => [`${actionLabel(action)} enregistre localement.`, ...current].slice(0, 3))
  }

  return (
    <PrivatePage title="Espace agent" mode="agent" onNavigate={onNavigate}>
      <section className="od-private-hero od-private-hero-agent">
        <span className="od-kicker">{agent.name}</span>
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
          {localProperties.map((property) => (
            <MiniProperty property={property} key={property.id} onOpen={() => openRoute(`${baseRoute}/bien/${property.id}`, onNavigate)} />
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
      {activity.length > 0 && (
        <section className="od-action-feed">
          {activity.map((item) => <p key={item}>{item}</p>)}
        </section>
      )}
      <ActionModal
        action={activeAction}
        onClose={() => setActiveAction(null)}
        onConfirm={completeAction}
        propertyOptions={localProperties}
      />
    </PrivatePage>
  )
}

function OwnerSpace({ onNavigate }: { onNavigate?: Navigate }) {
  const [activeAction, setActiveAction] = useState<ActionKind | null>(null)
  const [agents, setAgents] = useState(templateImmobilierConfig.agents)
  const [localProperties, setLocalProperties] = useState(templateImmobilierConfig.properties)
  const [activity, setActivity] = useState<string[]>([])
  const [agentToDisable, setAgentToDisable] = useState<string | null>(null)

  function disableAgent(agentId: string) {
    setAgents((current) => current.filter((agent) => agent.id !== agentId))
    setAgentToDisable(null)
  }

  function completeAction(action: ActionKind, values: ActionValues) {
    if (action === 'agent') {
      const firstName = values.prenom || 'Nouvel'
      const lastName = values.nom || 'Agent'
      const newAgent: RealEstateAgent = {
        id: `agent-local-${Date.now()}`,
        name: `${firstName} ${lastName}`,
        email: values.email || 'agent-local@example.fr',
        phone: values.telephone || 'Telephone a completer',
        role: values.role || 'Conseiller',
        activeListings: 0,
        active: true,
        assignedPropertyIds: [],
      }
      setAgents((current) => [...current, newAgent])
    }

    if (action === 'new-property') {
      const title = values.titre || 'Nouveau bien agence'
      setLocalProperties((current) => [
        ...current,
        {
          ...templateImmobilierConfig.properties[0],
          id: `local-${Date.now()}`,
          title,
          address: values.adresse || 'Adresse a completer',
          price: values.prix || 'Prix a completer',
          priceValue: Number(values.prix?.replace(/[^\d]/g, '')) || 0,
          surface: values.surface || 'Surface a completer',
          rooms: values.pieces || 'Pieces a completer',
          description: values.description_courte || 'Description courte a completer.',
          imageUrl: values.image_url_ou_upload_simule || templateImmobilierConfig.properties[0].imageUrl,
          images: [values.image_url_ou_upload_simule || templateImmobilierConfig.properties[0].imageUrl],
          photos: [values.image_url_ou_upload_simule || templateImmobilierConfig.properties[0].imageUrl],
          documents: [],
          visits: [],
          reports: [],
          offers: [],
          progress: 10,
        },
      ])
    }

    setActivity((current) => [`${actionLabel(action)} enregistre localement.`, ...current].slice(0, 3))
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
          {localProperties.map((property) => (
            <MiniProperty property={property} key={property.id} onOpen={() => openRoute(`${baseRoute}/bien/${property.id}`, onNavigate)} />
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
        onConfirm={completeAction}
        propertyOptions={localProperties}
        requests={templateImmobilierConfig.requests.map((request) => `${request.type} - ${request.contact} - ${request.detail}`)}
      />
      {activity.length > 0 && (
        <section className="od-action-feed">
          {activity.map((item) => <p key={item}>{item}</p>)}
        </section>
      )}
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

function MiniProperty({ property, onOpen }: { property: RealEstateProperty; onOpen?: () => void }) {
  return (
    <article className={onOpen ? 'od-mini-property od-mini-property-clickable' : 'od-mini-property'}>
      <img src={property.imageUrl} alt={property.title} />
      <div>
        <strong>{property.title}</strong>
        <span>{property.address}</span>
        <small>{formatTemplatePrice(property.priceValue)} - {property.surface}</small>
      </div>
      {onOpen && <button type="button" onClick={onOpen}>Ouvrir</button>}
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
  onConfirm,
  propertyOptions = templateImmobilierConfig.properties,
  requestsMode = 'list',
  requests = [],
}: {
  action: ActionKind | null
  onClose: () => void
  onConfirm?: (action: ActionKind, values: ActionValues) => void
  propertyOptions?: RealEstateProperty[]
  requestsMode?: 'list' | 'form'
  requests?: string[]
}) {
  const [confirmed, setConfirmed] = useState(false)
  if (!action) return null
  const currentAction = action

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
    const formData = new FormData(event.currentTarget as HTMLFormElement)
    const values = Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, String(value)]))
    onConfirm?.(currentAction, values)
    setConfirmed(true)
  }

  return (
    <div className="od-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="od-action-modal" role="dialog" aria-modal="true" aria-label={titles[action]} onClick={(event) => event.stopPropagation()}>
        <button className="od-modal-close" type="button" onClick={onClose}>Fermer</button>
        <span className="od-kicker">Action V1</span>
        <h2>{titles[action]}</h2>
        {action === 'requests' && requestsMode === 'list' ? (
          <div className="od-request-list">
            {requests.map((request) => <LineItem key={request} title={request.split(' - ')[0]} text={request.split(' - ').slice(1).join(' - ')} />)}
          </div>
        ) : confirmed ? (
          <p className="od-action-confirmation">Action enregistree localement pour la demo.</p>
        ) : (
          <form className="od-form" onSubmit={submit}>
            <ActionFields action={action} propertyOptions={propertyOptions} />
            <button type="submit">Valider</button>
          </form>
        )}
      </section>
    </div>
  )
}

function ActionFields({ action, propertyOptions }: { action: ActionKind; propertyOptions: RealEstateProperty[] }) {
  if (action === 'agent') {
    return (
      <>
        <ActionInput label="Prenom" name="prenom" />
        <ActionInput label="Nom" name="nom" />
        <ActionInput label="Email" name="email" type="email" />
        <ActionInput label="Telephone" name="telephone" />
        <ActionInput label="Role" name="role" />
      </>
    )
  }

  if (action === 'requests') {
    return (
      <>
        <SelectField label="Bien" name="bien" options={propertyOptions.map((property) => property.title)} />
        <ActionInput label="Nom" name="nom" />
        <ActionInput label="Telephone" name="telephone" />
        <ActionInput label="Email" name="email" type="email" />
        <ActionInput label="Message" name="message" />
      </>
    )
  }

  if (action === 'photo') {
    return (
      <>
        <SelectField label="Bien" name="bien" options={propertyOptions.map((property) => property.title)} />
        <ActionInput label="URL photo ou upload simule" name="image_url_ou_upload_simule" />
      </>
    )
  }

  if (action === 'document') {
    return (
      <>
        <SelectField label="Bien" name="bien" options={propertyOptions.map((property) => property.title)} />
        <ActionInput label="Type document" name="type_document" />
        <ActionInput label="Nom document" name="nom_document" />
      </>
    )
  }

  if (action === 'visit') {
    return (
      <>
        <SelectField label="Bien" name="bien" options={propertyOptions.map((property) => property.title)} />
        <ActionInput label="Date" name="date" type="date" />
        <ActionInput label="Heure" name="heure" type="time" />
        <ActionInput label="Visiteur" name="visiteur" />
        <ActionInput label="Note" name="note" />
      </>
    )
  }

  if (action === 'report') {
    return (
      <>
        <SelectField label="Bien" name="bien" options={propertyOptions.map((property) => property.title)} />
        <ActionInput label="Visite liee" name="visite_liee" />
        <ActionInput label="Compte rendu" name="compte_rendu" />
        <SelectField label="Niveau interet" name="niveau_interet" options={['Faible', 'Moyen', 'Fort']} />
      </>
    )
  }

  return (
    <>
      <ActionInput label="Titre" name="titre" />
      <ActionInput label="Adresse" name="adresse" />
      <ActionInput label="Prix" name="prix" />
      <ActionInput label="Surface" name="surface" />
      <ActionInput label="Pieces" name="pieces" />
      <ActionInput label="Description courte" name="description_courte" />
      <ActionInput label="Image URL ou upload simule" name="image_url_ou_upload_simule" />
    </>
  )
}

function ActionInput({ label, name, type = 'text' }: { label: string; name: string; type?: string }) {
  return (
    <label className="od-field">
      <span>{label}</span>
      <input name={name} type={type} />
    </label>
  )
}

function SelectField({ label, name, options }: { label: string; name: string; options: string[] }) {
  return (
    <label className="od-field">
      <span>{label}</span>
      <select name={name} defaultValue={options[0]}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  )
}

function actionLabel(action: ActionKind) {
  const labels: Record<ActionKind, string> = {
    'new-property': 'Nouveau bien',
    photo: 'Photo',
    document: 'Document',
    visit: 'Visite',
    report: 'Compte rendu',
    agent: 'Agent',
    requests: 'Demandes',
    'disable-agent': 'Desactivation agent',
  }

  return labels[action]
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
