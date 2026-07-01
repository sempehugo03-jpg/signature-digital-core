import { useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  demoAccounts,
  fallbackPropertyImage,
  getRealEstateAgencyConfig,
  realEstateTemplateKey,
} from '../../data/realEstateTemplate'
import type { RealEstateAgencyConfig, RealEstateDemoRole, RealEstateProperty } from '../../data/realEstateTemplate'
import { createSignatureAppointment, createSignatureLead, readSignatureDigitalState } from '../../data/signatureDigitalStore'
import { createAppointment, createCallbackRequest, createLead } from '../../lib/signature-digital-client'

type RealEstateTemplateView = 'public' | 'connexion' | 'vendeur' | 'agent' | 'patron' | 'biens' | 'bien'
type Navigate = (route: string) => void
type NoticeType = 'estimation' | 'visit' | 'callback'

const realEstateSessionKey = 'signature_digital_real_estate_session'

export function RealEstateMasterTemplate({
  agencySlug,
  view = 'public',
  propertyId,
  onNavigate,
}: {
  agencySlug: string
  view?: RealEstateTemplateView
  propertyId?: string
  onNavigate?: Navigate
}) {
  const config = getRealEstateAgencyConfig(agencySlug)

  if (!config) {
    return (
      <main className="opus-page opus-not-found">
        <h1>Template immobilier introuvable</h1>
        <p>Cette route n’est pas encore configurée dans Signature Digital.</p>
      </main>
    )
  }

  if (view === 'connexion') return <OpusLogin config={config} onNavigate={onNavigate} />
  if (view === 'vendeur') return <SellerSpace config={config} onNavigate={onNavigate} />
  if (view === 'agent') return <AgentSpace config={config} onNavigate={onNavigate} />
  if (view === 'patron') return <OwnerSpace config={config} onNavigate={onNavigate} />
  if (view === 'bien') return <PropertyDetailPage config={config} propertyId={propertyId} onNavigate={onNavigate} />

  return <OpusPublicPage config={config} focusProperties={view === 'biens'} onNavigate={onNavigate} />
}

function OpusPublicPage({
  config,
  focusProperties,
  onNavigate,
}: {
  config: RealEstateAgencyConfig
  focusProperties?: boolean
  onNavigate?: Navigate
}) {
  const [selectedProperty, setSelectedProperty] = useState(config.properties[0])
  const [notice, setNotice] = useState<{ type: NoticeType; message: string }>()
  const [estimation, setEstimation] = useState({
    propertyType: 'Appartement',
    city: 'Paris',
    surface: '',
    firstName: '',
    phone: '',
    email: '',
  })
  const [callback, setCallback] = useState({
    firstName: '',
    phone: '',
    email: '',
    message: '',
  })
  const [visit, setVisit] = useState({
    firstName: '',
    phone: '',
    email: '',
    message: '',
  })

  async function submitEstimation(event: FormEvent) {
    event.preventDefault()
    const payload = {
      ...estimation,
      moduleKey: 'estimation',
      source: 'opus_template_estimation',
      status: 'new',
      agencySlug: config.agencySlug,
      template: realEstateTemplateKey,
    }
    createSignatureLead(config.agencyId, 'estimation', payload)
    void createLead(config.agencyId, payload)
    setNotice({ type: 'estimation', message: 'Votre demande a bien été transmise. Un conseiller vous rappellera rapidement.' })
  }

  async function submitVisit(event: FormEvent) {
    event.preventDefault()
    const payload = {
      ...visit,
      moduleKey: 'visit_request',
      source: 'opus_template_visit',
      status: 'new',
      propertyId: selectedProperty.id,
      propertyTitle: selectedProperty.title,
      agencySlug: config.agencySlug,
      template: realEstateTemplateKey,
    }
    createSignatureLead(config.agencyId, 'visit_request', payload)
    createSignatureAppointment(config.agencyId, {
      ...payload,
      title: `Demande de visite - ${selectedProperty.title}`,
      date: '',
      time: '',
    })
    void createLead(config.agencyId, payload)
    void createAppointment(config.agencyId, {
      ...payload,
      title: `Demande de visite - ${selectedProperty.title}`,
      date: '',
      time: '',
    })
    setNotice({ type: 'visit', message: 'Votre demande de visite a bien été transmise. Un conseiller vous rappellera pour valider votre situation et le créneau.' })
  }

  async function submitCallback(event: FormEvent) {
    event.preventDefault()
    const payload = {
      ...callback,
      moduleKey: 'callback_request',
      source: 'opus_template_callback',
      status: 'new',
      agencySlug: config.agencySlug,
      template: realEstateTemplateKey,
    }
    createSignatureLead(config.agencyId, 'callback_request', payload)
    void createCallbackRequest(config.agencyId, payload)
    setNotice({ type: 'callback', message: 'Votre demande a bien été transmise.' })
  }

  return (
    <main className="opus-page">
      <OpusHeader config={config} onNavigate={onNavigate} />

      <section className="opus-hero" id="accueil">
        <div className="opus-hero-image">
          <PropertyImage property={config.properties[1]} />
        </div>
        <div className="opus-hero-content">
          <p className="opus-kicker">Agence — Paris</p>
          <h1>{config.heroTitle}</h1>
          <p>{config.heroSubtitle}</p>
          <div className="opus-actions">
            <button className="opus-button" type="button" onClick={() => scrollToId('estimation')}>Estimer mon bien</button>
            <button className="opus-button opus-button-light" type="button" onClick={() => scrollToId('biens')}>Voir nos exclusivités</button>
          </div>
        </div>
      </section>

      <section className={focusProperties ? 'opus-section opus-section-focus' : 'opus-section'} id="biens">
        <div className="opus-section-heading">
          <p className="opus-kicker">Collection</p>
          <h2>Nos exclusivités</h2>
          <button className="opus-text-link" type="button" onClick={() => openRoute(`/demo/${config.agencySlug}/biens`, onNavigate)}>Tout voir</button>
        </div>
        <div className="opus-property-grid">
          {config.properties.map((property) => (
            <article className="opus-property-card" key={property.id}>
              <button type="button" onClick={() => setSelectedProperty(property)} aria-label={`Sélectionner ${property.title}`}>
                <PropertyImage property={property} />
              </button>
              <div>
                <p>{property.address}</p>
                <h3>{property.title}</h3>
                <span>{property.surface} · {property.rooms}</span>
                <strong>{property.price}</strong>
              </div>
              <button className="opus-card-link" type="button" onClick={() => openRoute(`/demo/${config.agencySlug}/bien/${property.id}`, onNavigate)}>
                Voir le bien
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="opus-section opus-method" id="agence">
        <div>
          <p className="opus-kicker">Méthode</p>
          <h2>Une approche artisanale de la vente immobilière.</h2>
        </div>
        <div className="opus-method-grid">
          <MethodStep number="01" title="Valoriser le bien" text="Chaque annonce est pensée comme une présentation, pas comme une simple fiche." />
          <MethodStep number="02" title="Qualifier les demandes" text="Les contacts sont mieux structurés pour éviter les visites inutiles." />
          <MethodStep number="03" title="Suivre chaque étape" text="Le vendeur garde une vision claire des visites, retours, offres et documents." />
        </div>
      </section>

      <section className="opus-section opus-seller-section" id="vendeur">
        <div className="opus-seller-copy">
          <p className="opus-kicker">Espace vendeur</p>
          <h2>Vous savez tout, en temps réel.</h2>
          <p>Visites, retours, offres, documents : votre espace vendeur vous donne une vision claire de la vente.</p>
          <p className="opus-quote-line">Vous ne relancez plus l’agence. Vous voyez où en est votre vente.</p>
          <button className="opus-button" type="button" onClick={() => openRoute(`/demo/${config.agencySlug}/vendeur`, onNavigate)}>Voir une démonstration</button>
        </div>
        <SellerMockup property={config.properties[0]} />
      </section>

      <section className="opus-section opus-estimation-section" id="estimation">
        <div>
          <p className="opus-kicker">Estimation</p>
          <h2>Parlons de votre projet.</h2>
          <p>Quelques informations suffisent pour préparer une première lecture de votre bien.</p>
        </div>
        <form className="opus-form" onSubmit={submitEstimation}>
          <OpusInput label="Type de bien" value={estimation.propertyType} onChange={(value) => setEstimation({ ...estimation, propertyType: value })} />
          <OpusInput label="Ville" value={estimation.city} onChange={(value) => setEstimation({ ...estimation, city: value })} />
          <OpusInput label="Surface" value={estimation.surface} onChange={(value) => setEstimation({ ...estimation, surface: value })} />
          <OpusInput label="Prénom" value={estimation.firstName} onChange={(value) => setEstimation({ ...estimation, firstName: value })} />
          <OpusInput label="Téléphone" value={estimation.phone} onChange={(value) => setEstimation({ ...estimation, phone: value })} />
          <OpusInput label="Email" type="email" value={estimation.email} onChange={(value) => setEstimation({ ...estimation, email: value })} />
          <button className="opus-button" type="submit">Estimer mon bien</button>
          {notice?.type === 'estimation' && <p className="opus-success">{notice.message}</p>}
        </form>
      </section>

      <section className="opus-section opus-detail-preview">
        <PropertyImage property={selectedProperty} />
        <div>
          <p className="opus-kicker">Fiche bien</p>
          <h2>{selectedProperty.title}</h2>
          <p>{selectedProperty.description}</p>
          <div className="opus-detail-meta">
            <strong>{selectedProperty.price}</strong>
            <span>{selectedProperty.address}</span>
            <span>{selectedProperty.surface}</span>
            <span>{selectedProperty.rooms}</span>
          </div>
          <form className="opus-form opus-visit-form" onSubmit={submitVisit}>
            <OpusInput label="Prénom" value={visit.firstName} onChange={(value) => setVisit({ ...visit, firstName: value })} />
            <OpusInput label="Téléphone" value={visit.phone} onChange={(value) => setVisit({ ...visit, phone: value })} />
            <OpusInput label="Email" type="email" value={visit.email} onChange={(value) => setVisit({ ...visit, email: value })} />
            <OpusTextarea label="Message" value={visit.message} onChange={(value) => setVisit({ ...visit, message: value })} />
            <button className="opus-button" type="submit">Demander une visite</button>
            {notice?.type === 'visit' && <p className="opus-success">{notice.message}</p>}
          </form>
        </div>
      </section>

      <section className="opus-section opus-contact-section" id="contact">
        <div>
          <p className="opus-kicker">Contact</p>
          <h2>Parlons de votre projet.</h2>
          <p>Un conseiller vous rappelle pour comprendre votre besoin et vous orienter.</p>
        </div>
        <form className="opus-form" onSubmit={submitCallback}>
          <OpusInput label="Prénom" value={callback.firstName} onChange={(value) => setCallback({ ...callback, firstName: value })} />
          <OpusInput label="Téléphone" value={callback.phone} onChange={(value) => setCallback({ ...callback, phone: value })} />
          <OpusInput label="Email" type="email" value={callback.email} onChange={(value) => setCallback({ ...callback, email: value })} />
          <OpusTextarea label="Message" value={callback.message} onChange={(value) => setCallback({ ...callback, message: value })} />
          <button className="opus-button" type="submit">Être rappelé</button>
          {notice?.type === 'callback' && <p className="opus-success">{notice.message}</p>}
        </form>
      </section>

      <footer className="opus-footer">
        <strong>Signature</strong>
        <span>{config.address}</span>
        <span>© 2026 — Tous droits réservés.</span>
      </footer>
    </main>
  )
}

function PropertyDetailPage({ config, propertyId, onNavigate }: { config: RealEstateAgencyConfig; propertyId?: string; onNavigate?: Navigate }) {
  const property = config.properties.find((item) => item.id === propertyId) ?? config.properties[0]
  const [notice, setNotice] = useState('')
  const [visit, setVisit] = useState({ firstName: '', phone: '', email: '', message: '' })

  function submitVisit(event: FormEvent) {
    event.preventDefault()
    const payload = {
      ...visit,
      moduleKey: 'visit_request',
      source: 'opus_template_property_detail',
      status: 'new',
      propertyId: property.id,
      propertyTitle: property.title,
      agencySlug: config.agencySlug,
      template: realEstateTemplateKey,
    }
    createSignatureLead(config.agencyId, 'visit_request', payload)
    void createLead(config.agencyId, payload)
    setNotice('Votre demande de visite a bien été transmise. Un conseiller vous rappellera pour valider votre situation et le créneau.')
  }

  return (
    <main className="opus-page">
      <OpusHeader config={config} onNavigate={onNavigate} />
      <section className="opus-property-page">
        <div className="opus-property-gallery">
          <PropertyImage property={property} />
          <PropertyImage property={{ ...property, imageUrl: property.photos[1] || property.imageUrl }} />
        </div>
        <div className="opus-property-panel">
          <button className="opus-text-link" type="button" onClick={() => openRoute(`/demo/${config.agencySlug}`, onNavigate)}>Retour</button>
          <p className="opus-kicker">{property.address}</p>
          <h1>{property.title}</h1>
          <div className="opus-detail-meta">
            <strong>{property.price}</strong>
            <span>{property.surface}</span>
            <span>{property.rooms}</span>
            <span>{property.type}</span>
          </div>
          <p>{property.description}</p>
          <div className="opus-highlights">
            {property.highlights.map((highlight) => <span key={highlight}>{highlight}</span>)}
          </div>
          <form className="opus-form" onSubmit={submitVisit}>
            <h2>Demander une visite</h2>
            <OpusInput label="Prénom" value={visit.firstName} onChange={(value) => setVisit({ ...visit, firstName: value })} />
            <OpusInput label="Téléphone" value={visit.phone} onChange={(value) => setVisit({ ...visit, phone: value })} />
            <OpusInput label="Email" type="email" value={visit.email} onChange={(value) => setVisit({ ...visit, email: value })} />
            <OpusTextarea label="Message" value={visit.message} onChange={(value) => setVisit({ ...visit, message: value })} />
            <button className="opus-button" type="submit">Demander une visite</button>
            {notice && <p className="opus-success">{notice}</p>}
          </form>
        </div>
      </section>
    </main>
  )
}

function OpusLogin({ config, onNavigate }: { config: RealEstateAgencyConfig; onNavigate?: Navigate }) {
  const [role, setRole] = useState<RealEstateDemoRole>('seller')
  const [email, setEmail] = useState<string>(demoAccounts.seller.email)
  const [password, setPassword] = useState<string>('demo')
  const [error, setError] = useState('')

  function selectRole(nextRole: RealEstateDemoRole) {
    setRole(nextRole)
    setEmail(demoAccounts[nextRole].email)
    setPassword('demo')
    setError('')
  }

  function login(event: FormEvent) {
    event.preventDefault()
    const account = demoAccounts[role]
    if (email.trim().toLowerCase() !== account.email || password !== account.password) {
      setError('Identifiants incorrects.')
      return
    }

    window.sessionStorage.setItem(realEstateSessionKey, JSON.stringify({ role, agencySlug: config.agencySlug, email }))
    openRoute(`/demo/${config.agencySlug}/${account.route}`, onNavigate)
  }

  return (
    <main className="opus-page opus-login-page">
      <section className="opus-login-card">
        <button className="opus-brand" type="button" onClick={() => openRoute(`/demo/${config.agencySlug}`, onNavigate)}>Signature</button>
        <div>
          <p className="opus-kicker">Accès privé</p>
          <h1>Accéder à votre espace immobilier</h1>
        </div>
        <div className="opus-role-tabs">
          {Object.entries(demoAccounts).map(([key, account]) => (
            <button className={role === key ? 'active' : ''} key={key} type="button" onClick={() => selectRole(key as RealEstateDemoRole)}>
              {account.label}
            </button>
          ))}
        </div>
        <form className="opus-form" onSubmit={login}>
          <OpusInput label="Email" type="email" value={email} onChange={setEmail} />
          <OpusInput label="Mot de passe" type="password" value={password} onChange={setPassword} />
          {error && <p className="opus-error">{error}</p>}
          <button className="opus-button" type="submit">Se connecter</button>
        </form>
        <button className="opus-text-link" type="button" onClick={() => openRoute(`/demo/${config.agencySlug}`, onNavigate)}>Retour vers la template</button>
      </section>
    </main>
  )
}

function SellerSpace({ config, onNavigate }: { config: RealEstateAgencyConfig; onNavigate?: Navigate }) {
  const property = config.properties[0]

  return (
    <OpusPrivateShell config={config} title="Espace vendeur" onNavigate={onNavigate}>
      <section className="opus-space-hero">
        <PropertyImage property={property} />
        <div>
          <p className="opus-kicker">Mandat actif</p>
          <h1>{property.title}</h1>
          <p>{property.address}</p>
          <strong>{property.price}</strong>
        </div>
      </section>
      <section className="opus-space-panel">
        <div className="opus-progress-card">
          <span>Progression</span>
          <strong>60 %</strong>
          <div className="opus-progress"><i /></div>
        </div>
        <SpaceStat value="12" label="Visites" />
        <SpaceStat value="2" label="Offres" />
        <SpaceStat value="4" label="Documents" />
      </section>
      <section className="opus-space-grid">
        <SpaceCard title="Prochaine visite" text="Demain · 14:00" />
        <SpaceCard title="Dernier compte rendu" text="Très bon retour sur la luminosité et le quartier." />
        <SpaceCard title="Offres reçues" text="Deux offres en cours d’analyse, dont une au prix avec financement confirmé." />
        <SpaceCard title="Documents" text="Mandat de vente · DPE · Diagnostic plomb · Règlement copropriété" />
      </section>
      <blockquote>« Vous ne relancez plus l’agence. Vous voyez où en est votre vente. »</blockquote>
    </OpusPrivateShell>
  )
}

function AgentSpace({ config, onNavigate }: { config: RealEstateAgencyConfig; onNavigate?: Navigate }) {
  return (
    <OpusPrivateShell config={config} title="Espace agent" onNavigate={onNavigate}>
      <section className="opus-space-heading">
        <p className="opus-kicker">Camille Aurel</p>
        <h1>Les priorités du jour, sans lourdeur CRM.</h1>
      </section>
      <section className="opus-space-panel">
        <SpaceStat value="12" label="Mandats actifs" />
        <SpaceStat value="3" label="Visites aujourd’hui" />
        <SpaceStat value="5" label="Offres en cours" />
        <SpaceStat value="1.4M" label="CA en cours" />
      </section>
      <section className="opus-space-grid">
        <SpaceCard title="Visites du jour" text="10:30 Rue du Bac · 14:00 Avenue Montaigne · 17:30 Quai Voltaire" />
        <SpaceCard title="Mes mandats" text="Appartement Haussmannien · Duplex contemporain · Loft sur Seine" />
        <SpaceCard title="Demandes reçues" text="Les demandes de la template sont reliées à agencyId template-immobilier." />
        <button className="opus-button" type="button">Nouveau bien</button>
      </section>
    </OpusPrivateShell>
  )
}

function OwnerSpace({ config, onNavigate }: { config: RealEstateAgencyConfig; onNavigate?: Navigate }) {
  const engineState = useMemo(() => readSignatureDigitalState(), [])
  const leads = engineState.leads.filter((lead) => lead.agencyId === config.agencyId)

  return (
    <OpusPrivateShell config={config} title="Espace patron" onNavigate={onNavigate}>
      <section className="opus-space-heading">
        <p className="opus-kicker">Direction agence</p>
        <h1>Une vision globale, simple et élégante.</h1>
      </section>
      <section className="opus-space-panel">
        <SpaceStat value="3" label="Biens actifs" />
        <SpaceStat value="2" label="Agents" />
        <SpaceStat value={String(leads.length)} label="Demandes reçues" />
        <SpaceStat value="5" label="Offres en cours" />
        <SpaceStat value="1.4M" label="CA estimé" />
      </section>
      <section className="opus-space-grid">
        <SpaceCard title="Visites prévues" text="Rue du Bac, Avenue Montaigne et Quai Voltaire sont planifiées aujourd’hui." />
        <SpaceCard title="Agents" text="Camille Aurel · Louis Vernet" />
        <button className="opus-button" type="button">Ajouter agent</button>
        <button className="opus-button opus-button-light" type="button" onClick={() => openRoute(`/demo/${config.agencySlug}`, onNavigate)}>Voir template publique</button>
      </section>
    </OpusPrivateShell>
  )
}

function OpusHeader({ config, onNavigate }: { config: RealEstateAgencyConfig; onNavigate?: Navigate }) {
  return (
    <header className="opus-header">
      <button className="opus-brand" type="button" onClick={() => openRoute(`/demo/${config.agencySlug}`, onNavigate)}>Signature</button>
      <nav>
        <button type="button" onClick={() => scrollToId('biens')}>Biens</button>
        <button type="button" onClick={() => scrollToId('agence')}>Agence</button>
        <button type="button" onClick={() => scrollToId('contact')}>Contact</button>
      </nav>
      <button className="opus-header-login" type="button" onClick={() => openRoute(`/demo/${config.agencySlug}/connexion`, onNavigate)}>Espaces</button>
    </header>
  )
}

function OpusPrivateShell({ config, title, children, onNavigate }: { config: RealEstateAgencyConfig; title: string; children: ReactNode; onNavigate?: Navigate }) {
  return (
    <main className="opus-page opus-private-page">
      <header className="opus-header">
        <button className="opus-brand" type="button" onClick={() => openRoute(`/demo/${config.agencySlug}`, onNavigate)}>Signature</button>
        <span>{title}</span>
        <button className="opus-header-login" type="button" onClick={() => openRoute(`/demo/${config.agencySlug}/connexion`, onNavigate)}>Changer d’espace</button>
      </header>
      {children}
    </main>
  )
}

function SellerMockup({ property }: { property: RealEstateProperty }) {
  return (
    <article className="opus-seller-mockup">
      <PropertyImage property={property} />
      <div className="opus-seller-mockup-content">
        <div>
          <span>{property.address}</span>
          <h3>{property.title}</h3>
          <strong>{property.price}</strong>
        </div>
        <div className="opus-progress-card">
          <span>Progression</span>
          <strong>60 %</strong>
          <div className="opus-progress"><i /></div>
        </div>
        <div className="opus-mini-stats">
          <SpaceStat value="12" label="Visites" />
          <SpaceStat value="2" label="Offres" />
          <SpaceStat value="4" label="Documents" />
        </div>
        <p><b>Prochaine visite</b> Demain · 14:00</p>
        <p><b>Dernier compte rendu</b> Très bon retour sur la luminosité et le quartier.</p>
      </div>
    </article>
  )
}

function MethodStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <article className="opus-method-step">
      <span>{number}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  )
}

function SpaceStat({ value, label }: { value: string; label: string }) {
  return (
    <article className="opus-stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  )
}

function SpaceCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="opus-space-card">
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  )
}

function OpusInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="opus-field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function OpusTextarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="opus-field">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function PropertyImage({ property }: { property: RealEstateProperty }) {
  return (
    <img
      className="opus-property-image"
      src={property.imageUrl || fallbackPropertyImage}
      alt={property.title}
      onError={(event) => {
        event.currentTarget.src = fallbackPropertyImage
      }}
    />
  )
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function openRoute(route: string, onNavigate?: Navigate) {
  if (onNavigate) {
    onNavigate(route)
    return
  }

  window.location.assign(route)
}
