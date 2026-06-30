import { useMemo, useState } from 'react'
import type { CSSProperties, FormEvent, ReactNode } from 'react'
import {
  demoAccounts,
  getRealEstateAgencyConfig,
  realEstateTemplateKey,
} from '../../data/realEstateTemplate'
import type { RealEstateAgencyConfig, RealEstateDemoRole, RealEstateProperty } from '../../data/realEstateTemplate'
import { createSignatureAppointment, createSignatureLead, readSignatureDigitalState } from '../../data/signatureDigitalStore'
import { createAppointment, createCallbackRequest, createLead } from '../../lib/signature-digital-client'
import { Button, TextArea, TextInput } from '../shared/DesignSystem'

type RealEstateTemplateView = 'public' | 'connexion' | 'vendeur' | 'agent' | 'patron'
type NoticeType = 'estimation' | 'visit' | 'callback'
type Navigate = (route: string) => void

const realEstateSessionKey = 'signature_digital_real_estate_session'

type RealEstateSession = {
  role: RealEstateDemoRole
  agencySlug: string
  email: string
}

export function RealEstateMasterTemplate({
  agencySlug,
  view = 'public',
  onNavigate,
}: {
  agencySlug: string
  view?: RealEstateTemplateView
  onNavigate?: Navigate
}) {
  const config = getRealEstateAgencyConfig(agencySlug)

  if (!config) {
    return (
      <main className="re-template-page re-template-empty">
        <h1>Démo immobilière introuvable</h1>
        <p>Cette agence n’est pas encore configurée dans le template Signature Digital Immobilier.</p>
      </main>
    )
  }

  if (view === 'connexion') return <RealEstateLogin config={config} onNavigate={onNavigate} />
  if (view === 'vendeur') return <SellerSpace config={config} />
  if (view === 'agent') return <AgentSpace config={config} role="agent" onNavigate={onNavigate} />
  if (view === 'patron') return <AgentSpace config={config} role="patron" onNavigate={onNavigate} />

  return <RealEstatePublicDemo config={config} onNavigate={onNavigate} />
}

function RealEstatePublicDemo({ config, onNavigate }: { config: RealEstateAgencyConfig; onNavigate?: Navigate }) {
  const [properties] = useState<RealEstateProperty[]>(config.properties)
  const [selectedProperty, setSelectedProperty] = useState<RealEstateProperty>(properties[0])
  const [notice, setNotice] = useState<{ type: NoticeType; message: string }>()
  const variant = getVariantCopy(config)
  const [estimation, setEstimation] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    propertyType: 'Appartement',
    city: config.city,
    surface: '',
    rooms: '',
    projectTimeline: 'Dans les 3 prochains mois',
  })
  const [visit, setVisit] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    buyerSituation: 'Recherche active',
    financingStatus: 'Situation à préciser',
    buyingTimeline: 'Dès que possible',
    message: '',
  })
  const [callback, setCallback] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    reason: 'Être rappelé par un conseiller',
    message: '',
  })

  async function submitEstimation(event: FormEvent) {
    event.preventDefault()
    const payload = {
      ...estimation,
      moduleKey: 'estimation',
      source: `${config.agencySlug}_template_estimation`,
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
      source: `${config.agencySlug}_template_visit_request`,
      status: 'new',
      propertyId: selectedProperty.id,
      propertyTitle: selectedProperty.title,
      propertyPrice: getPropertyPrice(selectedProperty),
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
      source: `${config.agencySlug}_template_callback`,
      status: 'new',
      agencySlug: config.agencySlug,
      template: realEstateTemplateKey,
    }
    createSignatureLead(config.agencyId, 'callback_request', payload)
    void createCallbackRequest(config.agencyId, payload)
    setNotice({ type: 'callback', message: 'Votre demande a bien été transmise.' })
  }

  return (
    <main className="re-template-page" style={createTheme(config)}>
      <header className="re-nav">
        <a className="re-brand" href="#accueil" aria-label={`${config.agencyName} accueil`}>
          {config.logoUrl ? <img src={config.logoUrl} alt={config.agencyName} /> : <span>{getInitials(config.agencyName)}</span>}
          <strong>{config.agencyName}</strong>
        </a>
        <nav>
          <a href="#biens">Biens</a>
          <a href="#estimation">Estimation</a>
          <a href="#vendeur">Espace vendeur</a>
          <a href="#contact">Contact</a>
        </nav>
        <button type="button" onClick={() => scrollToId('estimation')}>Estimer mon bien</button>
      </header>

      <section className="re-hero" id="accueil">
        <div className="re-hero-copy">
          <p className="re-eyebrow">{config.visualStyle}</p>
          <h1>{config.heroTitle}</h1>
          <p>{config.heroSubtitle}</p>
          <div className="re-actions">
            <Button onClick={() => scrollToId('estimation')}>Estimer mon bien</Button>
            <Button variant="secondary" onClick={() => scrollToId('biens')}>Voir les biens</Button>
          </div>
          <div className="re-proof-row">
            <InfoPill label="Ville" value={config.city} />
            <InfoPill label="Objectif" value={variant.shortProof} />
            <InfoPill label="Contact" value={config.phone} />
          </div>
        </div>
        <article className="re-hero-showcase">
          <PropertyVisual property={selectedProperty} large />
          <div className="re-showcase-content">
            <small>{selectedProperty.transaction === 'location' ? 'Location' : 'Vente'}</small>
            <h2>{selectedProperty.title}</h2>
            <div className="re-meta">
              <b>{getPropertyPrice(selectedProperty)}</b>
              <span>{selectedProperty.surface}</span>
              <span>{selectedProperty.rooms}</span>
            </div>
          </div>
        </article>
      </section>

      <section className="re-section re-editorial-band">
        <div>
          <p className="re-eyebrow">Signature Digital Immobilier</p>
          <h2>{variant.promise}</h2>
        </div>
        <p>{config.painPoint} {config.mainObjective}</p>
      </section>

      <section className="re-section" id="biens">
        <SectionIntro eyebrow="Biens à vendre / louer" title="Une collection claire, lisible, prête à inspirer confiance." text="Les annonces restent liées à l’agence configurée. Les biens temporaires sont faciles à remplacer depuis l’admin." />
        <div className="re-property-grid">
          {properties.map((property) => (
            <button className={selectedProperty.id === property.id ? 're-property-card active' : 're-property-card'} key={property.id} type="button" onClick={() => setSelectedProperty(property)}>
              <PropertyVisual property={property} />
              <div>
                <small>{property.isTemporary ? 'Démonstration' : property.transaction === 'location' ? 'Location' : 'Annonce agence'}</small>
                <h3>{property.title}</h3>
                <p>{property.city}</p>
              </div>
              <div className="re-meta">
                <b>{getPropertyPrice(property)}</b>
                <span>{property.surface}</span>
                <span>{property.rooms}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="re-section re-property-detail" id="fiche-bien">
        <PropertyVisual property={selectedProperty} large />
        <div className="re-detail-copy">
          <p className="re-eyebrow">Fiche bien détaillée</p>
          <h2>{selectedProperty.title}</h2>
          <p>{selectedProperty.description}</p>
          <div className="re-meta">
            <b>{getPropertyPrice(selectedProperty)}</b>
            <span>{selectedProperty.city}</span>
            <span>{selectedProperty.surface}</span>
            <span>{selectedProperty.rooms}</span>
            <span>{selectedProperty.type}</span>
          </div>
          <div className="re-chip-row">
            {selectedProperty.highlights.map((highlight) => <span key={highlight}>{highlight}</span>)}
          </div>
          <div className="re-actions">
            <Button onClick={() => { window.location.href = `tel:${config.phone.replace(/\s/g, '')}` }}>Appeler l’agence</Button>
            <Button variant="secondary" onClick={() => scrollToId('visite')}>Demander une visite</Button>
          </div>
        </div>
      </section>

      <section className="re-section re-seller-preview" id="vendeur">
        <div>
          <p className="re-eyebrow">Espace vendeur privé</p>
          <h2>Vous ne relancez plus l’agence. Vous voyez où en est votre vente.</h2>
          <p>Un espace de rassurance vendeur qui rend le suivi plus transparent sans transformer la démo en CRM.</p>
          <Button variant="secondary" onClick={() => openRoute(`/demo/${config.agencySlug}/connexion`, onNavigate)}>Accéder aux espaces</Button>
        </div>
        <div className="re-seller-dashboard">
          <div className="re-progress">
            <span style={{ width: '72%' }} />
          </div>
          <div className="re-dashboard-grid">
            <Metric label="Visites" value="8" />
            <Metric label="Offres" value="2" />
            <Metric label="Documents" value="5" />
          </div>
          <article>
            <strong>Prochaine visite</strong>
            <p>{selectedProperty.title} - créneau à confirmer avec le conseiller.</p>
          </article>
          <article>
            <strong>Dernier compte rendu</strong>
            <p>Retour positif, demande d’informations complémentaires et prochaine action déjà planifiée.</p>
          </article>
        </div>
      </section>

      <section className="re-section re-why-section" id="pourquoi">
        <SectionIntro eyebrow="Pourquoi nous confier votre bien" title={variant.whyTitle} text={variant.whyText} />
        <div className="re-value-grid">
          <ValueCard title="Expertise locale" text={`Une présentation centrée sur ${config.city}, les quartiers, les vrais biens et la réalité terrain.`} />
          <ValueCard title="Suivi clair" text="Le vendeur voit les étapes, les visites, les retours et les documents importants." />
          <ValueCard title="Demandes qualifiées" text="Les formulaires filtrent les projets sérieux avant le rappel conseiller." />
        </div>
      </section>

      <section className="re-section re-form-section" id="estimation">
        <div>
          <p className="re-eyebrow">Parcours estimation vendeur</p>
          <h2>Transformer une intention vendeur en demande qualifiée.</h2>
          <p>Un parcours simple, rassurant et compatible Signature Digital Core. La donnée reste liée à {config.agencyId}.</p>
        </div>
        <form className="re-form-card" onSubmit={submitEstimation}>
          <TextInput label="Prénom" value={estimation.firstName} onChange={(value) => setEstimation({ ...estimation, firstName: value })} />
          <TextInput label="Nom" value={estimation.lastName} onChange={(value) => setEstimation({ ...estimation, lastName: value })} />
          <TextInput label="Téléphone" value={estimation.phone} onChange={(value) => setEstimation({ ...estimation, phone: value })} />
          <TextInput label="Email" type="email" value={estimation.email} onChange={(value) => setEstimation({ ...estimation, email: value })} />
          <TextInput label="Type de bien" value={estimation.propertyType} onChange={(value) => setEstimation({ ...estimation, propertyType: value })} />
          <TextInput label="Ville" value={estimation.city} onChange={(value) => setEstimation({ ...estimation, city: value })} />
          <TextInput label="Surface" value={estimation.surface} onChange={(value) => setEstimation({ ...estimation, surface: value })} />
          <TextInput label="Pièces" value={estimation.rooms} onChange={(value) => setEstimation({ ...estimation, rooms: value })} />
          <Button type="submit">Envoyer ma demande d’estimation</Button>
          {notice?.type === 'estimation' && <p className="re-success">{notice.message}</p>}
        </form>
      </section>

      <section className="re-section re-form-section" id="visite">
        <div>
          <p className="re-eyebrow">Demande de visite qualifiée</p>
          <h2>Valider la situation avant de confirmer le créneau.</h2>
          <p>Aucune visite n’est confirmée automatiquement. Un conseiller rappelle pour valider la situation.</p>
        </div>
        <form className="re-form-card" onSubmit={submitVisit}>
          <TextInput label="Prénom" value={visit.firstName} onChange={(value) => setVisit({ ...visit, firstName: value })} />
          <TextInput label="Nom" value={visit.lastName} onChange={(value) => setVisit({ ...visit, lastName: value })} />
          <TextInput label="Téléphone" value={visit.phone} onChange={(value) => setVisit({ ...visit, phone: value })} />
          <TextInput label="Email" type="email" value={visit.email} onChange={(value) => setVisit({ ...visit, email: value })} />
          <TextInput label="Situation acheteur / locataire" value={visit.buyerSituation} onChange={(value) => setVisit({ ...visit, buyerSituation: value })} />
          <TextInput label="Financement ou situation" value={visit.financingStatus} onChange={(value) => setVisit({ ...visit, financingStatus: value })} />
          <TextInput label="Délai" value={visit.buyingTimeline} onChange={(value) => setVisit({ ...visit, buyingTimeline: value })} />
          <TextArea label="Message" value={visit.message} onChange={(value) => setVisit({ ...visit, message: value })} />
          <Button type="submit">Envoyer ma demande de visite</Button>
          {notice?.type === 'visit' && <p className="re-success">{notice.message}</p>}
        </form>
      </section>

      <section className="re-section re-form-section" id="contact">
        <div>
          <p className="re-eyebrow">Contact / rappel conseiller</p>
          <h2>Parler à {config.agencyName} sans friction.</h2>
          <p>{config.address} · {config.phone} · {config.email}</p>
        </div>
        <form className="re-form-card" onSubmit={submitCallback}>
          <TextInput label="Prénom" value={callback.firstName} onChange={(value) => setCallback({ ...callback, firstName: value })} />
          <TextInput label="Nom" value={callback.lastName} onChange={(value) => setCallback({ ...callback, lastName: value })} />
          <TextInput label="Téléphone" value={callback.phone} onChange={(value) => setCallback({ ...callback, phone: value })} />
          <TextInput label="Email" type="email" value={callback.email} onChange={(value) => setCallback({ ...callback, email: value })} />
          <TextInput label="Motif" value={callback.reason} onChange={(value) => setCallback({ ...callback, reason: value })} />
          <TextArea label="Message" value={callback.message} onChange={(value) => setCallback({ ...callback, message: value })} />
          <Button type="submit">Demander un rappel</Button>
          {notice?.type === 'callback' && <p className="re-success">{notice.message}</p>}
        </form>
      </section>
    </main>
  )
}

function RealEstateLogin({ config, onNavigate }: { config: RealEstateAgencyConfig; onNavigate?: Navigate }) {
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

    const session: RealEstateSession = { role, agencySlug: config.agencySlug, email }
    window.sessionStorage.setItem(realEstateSessionKey, JSON.stringify(session))
    openRoute(`/demo/${config.agencySlug}/${account.route}`, onNavigate)
  }

  return (
    <main className="re-template-page re-login-page" style={createTheme(config)}>
      <section className="re-login-card">
        <a className="re-brand" href={`/demo/${config.agencySlug}`}>
          <span>{getInitials(config.agencyName)}</span>
          <strong>{config.agencyName}</strong>
        </a>
        <div>
          <p className="re-eyebrow">Accès privé</p>
          <h1>Accéder à votre espace</h1>
          <p>Choisissez le type d’espace reçu dans votre invitation de démonstration.</p>
        </div>
        <div className="re-role-tabs" role="tablist" aria-label="Type d’espace">
          {Object.entries(demoAccounts).map(([key, account]) => (
            <button className={role === key ? 'active' : ''} key={key} type="button" onClick={() => selectRole(key as RealEstateDemoRole)}>
              {account.label}
            </button>
          ))}
        </div>
        <form className="re-form-card" onSubmit={login}>
          <TextInput label="Email" type="email" value={email} onChange={setEmail} />
          <TextInput label="Mot de passe" type="password" value={password} onChange={setPassword} />
          <Button type="submit">Se connecter</Button>
          {error && <p className="form-error">{error}</p>}
        </form>
        <div className="re-login-links">
          <a href="/creer-acces/demo">Vous avez reçu une invitation ? Créer mon accès</a>
          <a href={`/demo/${config.agencySlug}`}>Retour accueil</a>
        </div>
      </section>
    </main>
  )
}

function SellerSpace({ config }: { config: RealEstateAgencyConfig }) {
  const property = config.properties[0]

  return (
    <PrivateSpaceShell config={config} title="Espace vendeur" eyebrow="Suivi privé" roleLabel="Vendeur">
      <section className="re-space-hero">
        <PropertyVisual property={property} large />
        <div>
          <p className="re-eyebrow">Bien suivi</p>
          <h1>{property.title}</h1>
          <p>Vous ne relancez plus l’agence. Vous voyez où en est votre vente.</p>
          <div className="re-meta">
            <b>{getPropertyPrice(property)}</b>
            <span>{property.surface}</span>
            <span>{property.rooms}</span>
          </div>
        </div>
      </section>
      <section className="re-space-grid">
        <SpaceCard title="Progression de vente" text="Mandat signé, diffusion active, visites qualifiées et retours centralisés.">
          <div className="re-progress"><span style={{ width: '72%' }} /></div>
        </SpaceCard>
        <SpaceCard title="Prochaine visite" text="Jeudi 18h30 - profil acheteur qualifié par le conseiller." />
        <SpaceCard title="Dernier compte rendu" text="Visite intéressée. Points forts relevés : luminosité, emplacement, état général." />
        <SpaceCard title="Offres reçues" text="2 offres en analyse, dont une avec financement déjà validé." />
        <SpaceCard title="Documents" text="Mandat, diagnostics, compte rendu de visite et pièces importantes disponibles." />
      </section>
    </PrivateSpaceShell>
  )
}

function AgentSpace({
  config,
  role,
  onNavigate,
}: {
  config: RealEstateAgencyConfig
  role: 'agent' | 'patron'
  onNavigate?: Navigate
}) {
  const engineState = useMemo(() => readSignatureDigitalState(), [])
  const leads = engineState.leads.filter((lead) => lead.agencyId === config.agencyId)
  const appointments = engineState.appointments.filter((appointment) => appointment.agencyId === config.agencyId)
  const isOwner = role === 'patron'

  return (
    <PrivateSpaceShell config={config} title={isOwner ? 'Espace patron / gérant' : 'Espace agent'} eyebrow={isOwner ? 'Direction agence' : 'Production agence'} roleLabel={isOwner ? 'Patron' : 'Agent'}>
      <section className="re-space-hero re-space-hero-dark">
        <div>
          <p className="re-eyebrow">{config.agencyName}</p>
          <h1>{isOwner ? 'Vision globale de l’agence.' : 'Pilotage simple des biens et demandes.'}</h1>
          <p>{isOwner ? 'Le gérant voit toute l’agence, les biens, les demandes et les accès.' : 'L’agent voit ses actions, ses visites et les demandes liées aux biens suivis.'}</p>
        </div>
        <div className="re-dashboard-grid">
          <Metric label="Mandats actifs" value={String(config.properties.length)} />
          <Metric label="Visites" value={String(Math.max(appointments.length, 4))} />
          <Metric label="Demandes" value={String(leads.length)} />
          <Metric label="CA en cours" value={isOwner ? '148 k€' : '42 k€'} />
        </div>
      </section>

      <section className="re-space-grid">
        <SpaceCard title="Visites du jour" text={appointments[0]?.title || '3 visites à confirmer, dont une demande qualifiée via la démo.'} />
        <SpaceCard title="Demandes reçues" text={`${leads.length} demande(s) liée(s) à agencyId ${config.agencyId}.`} />
        <SpaceCard title="Nouveau bien" text="V1 : ajouter ou modifier les biens depuis la fiche projet admin.">
          <Button variant="secondary" onClick={() => openRoute('/admin/projects', onNavigate)}>Ouvrir admin</Button>
        </SpaceCard>
        {isOwner && <SpaceCard title="Équipe" text="2 agents actifs, invitations prêtes à être branchées au moteur existant." />}
        {isOwner && (
          <SpaceCard title="Accès rapides" text="Ouvrir la version publique ou basculer vers l’espace agent.">
            <div className="re-actions">
              <Button variant="secondary" onClick={() => openRoute(`/demo/${config.agencySlug}`, onNavigate)}>Version publique</Button>
              <Button variant="secondary" onClick={() => openRoute(`/demo/${config.agencySlug}/agent`, onNavigate)}>Espace agent</Button>
            </div>
          </SpaceCard>
        )}
      </section>

      <section className="re-section">
        <SectionIntro eyebrow="Biens suivis" title="Gestion simple des biens" text="Le template affiche les biens liés à l’agence. L’édition complète reste volontairement légère en V1." />
        <div className="re-property-grid compact">
          {config.properties.map((property) => (
            <article className="re-property-card" key={property.id}>
              <PropertyVisual property={property} />
              <h3>{property.title}</h3>
              <p>{property.city}</p>
              <div className="re-meta">
                <b>{getPropertyPrice(property)}</b>
                <span>{property.surface}</span>
                <span>{property.rooms}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PrivateSpaceShell>
  )
}

function PrivateSpaceShell({
  config,
  eyebrow,
  title,
  roleLabel,
  children,
}: {
  config: RealEstateAgencyConfig
  eyebrow: string
  title: string
  roleLabel: string
  children: ReactNode
}) {
  return (
    <main className="re-template-page re-private-page" style={createTheme(config)}>
      <header className="re-nav">
        <a className="re-brand" href={`/demo/${config.agencySlug}`}>
          <span>{getInitials(config.agencyName)}</span>
          <strong>{config.agencyName}</strong>
        </a>
        <nav>
          <a href={`/demo/${config.agencySlug}`}>Version publique</a>
          <a href={`/demo/${config.agencySlug}/connexion`}>Changer d’espace</a>
        </nav>
        <span className="re-role-badge">{roleLabel}</span>
      </header>
      <div className="re-private-heading">
        <p className="re-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      {children}
    </main>
  )
}

function SectionIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="re-section-intro">
      <p className="re-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  )
}

function PropertyVisual({ property, large = false }: { property: RealEstateProperty; large?: boolean }) {
  return (
    <div className={large ? 're-property-visual large' : 're-property-visual'}>
      {property.imageUrl ? <img src={property.imageUrl} alt={property.title} /> : <span>{property.imageLabel || 'Photo temporaire'}</span>}
    </div>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="re-info-pill">
      <small>{label}</small>
      <strong>{value}</strong>
    </span>
  )
}

function ValueCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="re-value-card">
      <strong>{title}</strong>
      <p>{text}</p>
    </article>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="re-metric">
      <strong>{value}</strong>
      <small>{label}</small>
    </span>
  )
}

function SpaceCard({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <article className="re-space-card">
      <strong>{title}</strong>
      <p>{text}</p>
      {children}
    </article>
  )
}

function createTheme(config: RealEstateAgencyConfig): CSSProperties {
  return {
    '--re-primary': config.primaryColor,
    '--re-secondary': config.secondaryColor,
    '--re-accent': config.accentColor,
    '--re-bg': config.backgroundColor,
  } as CSSProperties
}

function getInitials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

function getPropertyPrice(property: RealEstateProperty) {
  return property.rent || property.price || 'Prix sur demande'
}

function getVariantCopy(config: RealEstateAgencyConfig) {
  const variants = {
    trust: {
      shortProof: 'Suivi clair',
      promise: 'Une expérience qui rassure avant même le premier contact.',
      whyTitle: 'Rendre l’accompagnement visible, pas seulement annoncé.',
      whyText: 'Le suivi vendeur, les comptes rendus et les demandes qualifiées deviennent des preuves visibles.',
    },
    premium: {
      shortProof: 'Image premium',
      promise: 'Une présentation plus haut de gamme sans perdre l’identité de l’agence.',
      whyTitle: 'Valoriser les biens avec plus de rareté et de clarté.',
      whyText: 'Les photos, les fiches biens et les parcours vendeur montent en gamme sans créer une architecture différente.',
    },
    estimation: {
      shortProof: 'Demandes vendeurs',
      promise: 'Un parcours pensé pour générer plus de demandes d’estimation.',
      whyTitle: 'Transformer l’intention vendeur en demande claire.',
      whyText: 'Le CTA estimation, le formulaire et les preuves locales sont placés au bon moment.',
    },
    local: {
      shortProof: 'Proximité locale',
      promise: `Une expérience centrée sur ${config.city} et la confiance terrain.`,
      whyTitle: 'Mettre la connaissance locale au centre.',
      whyText: 'La ville, les quartiers, les biens et l’accompagnement humain deviennent les preuves principales.',
    },
  }

  return variants[config.variant]
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
