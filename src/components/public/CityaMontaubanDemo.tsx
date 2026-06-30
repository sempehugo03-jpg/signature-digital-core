import { useState } from 'react'
import type { FormEvent } from 'react'
import { cityaAgency, cityaAgencyId, cityaWebsiteUrl, readCityaProperties } from '../../data/cityaMontauban'
import type { CityaProperty } from '../../data/cityaMontauban'
import { createSignatureAppointment, createSignatureLead } from '../../data/signatureDigitalStore'
import { createAppointment, createCallbackRequest, createLead } from '../../lib/signature-digital-client'
import { Button, Card, TextArea, TextInput } from '../shared/DesignSystem'

type Notice = {
  type: 'estimation' | 'visit' | 'callback'
  message: string
}

export function CityaMontaubanDemo() {
  const [properties] = useState<CityaProperty[]>(() => readCityaProperties())
  const [selectedProperty, setSelectedProperty] = useState<CityaProperty>(properties[0])
  const [notice, setNotice] = useState<Notice | undefined>()
  const [estimation, setEstimation] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    propertyType: 'Appartement',
    city: 'Montauban',
    surface: '',
    rooms: '',
    projectTimeline: 'Dans les 3 prochains mois',
  })
  const [visit, setVisit] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    buyerSituation: 'Locataire en recherche active',
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
      source: 'citya_live_estimation',
      status: 'new',
      agencySlug: 'citya-montauban',
    }
    createSignatureLead(cityaAgencyId, 'estimation', payload)
    void createLead(cityaAgencyId, payload)
    setNotice({ type: 'estimation', message: 'Votre demande a bien été transmise. Un conseiller vous rappellera rapidement.' })
  }

  async function submitVisit(event: FormEvent) {
    event.preventDefault()
    const payload = {
      ...visit,
      moduleKey: 'visit_request',
      source: 'citya_live_visit_request',
      status: 'new',
      propertyId: selectedProperty.id,
      propertyTitle: selectedProperty.title,
      propertyPrice: selectedProperty.price,
      agencySlug: 'citya-montauban',
    }
    createSignatureLead(cityaAgencyId, 'visit_request', payload)
    createSignatureAppointment(cityaAgencyId, {
      ...payload,
      title: `Demande de visite - ${selectedProperty.title}`,
      date: '',
      time: '',
    })
    void createLead(cityaAgencyId, payload)
    void createAppointment(cityaAgencyId, {
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
      source: 'citya_live_callback',
      status: 'new',
      agencySlug: 'citya-montauban',
    }
    createSignatureLead(cityaAgencyId, 'callback_request', payload)
    void createCallbackRequest(cityaAgencyId, payload)
    setNotice({ type: 'callback', message: 'Votre demande a bien été transmise.' })
  }

  return (
    <main className="citya-demo-page">
      <header className="citya-demo-nav">
        <a href="#accueil" className="citya-logo-mark" aria-label="Citya Montauban accueil">
          <span>C</span>
          <strong>Citya Montauban</strong>
        </a>
        <nav aria-label="Navigation Citya Montauban">
          <a href="#biens">Nos biens</a>
          <a href="#estimation">Estimation</a>
          <a href="#vendeur">Espace vendeur</a>
          <a href="#valeur">Pourquoi nous</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="citya-phone-link" href={`tel:${cityaAgency.phone.replace(/\s/g, '')}`}>{cityaAgency.phone}</a>
        <Button className="citya-nav-cta" onClick={() => scrollToId('estimation')}>Estimer mon bien</Button>
      </header>

      <section className="citya-hero" id="accueil">
        <div className="citya-hero-copy">
          <p className="citya-eyebrow">Agence Citya - Montauban & Tarn-et-Garonne</p>
          <h1>L'immobilier à Montauban, en plus clair.</h1>
          <p>
            Vendre, louer ou confier son bien sans bruit. Une équipe locale, un suivi transparent,
            des décisions éclairées.
          </p>
          <div className="citya-hero-actions">
            <Button onClick={() => scrollToId('estimation')}>Estimer mon bien</Button>
            <Button variant="secondary" onClick={() => scrollToId('biens')}>Voir les biens</Button>
          </div>
          <div className="citya-proof-grid">
            <InfoPill label="à Montauban" value="23 ans" />
            <InfoPill label="vendeurs accompagnés" value="98%" />
            <InfoPill label="délai moyen 1re visite" value="11 j" />
          </div>
        </div>

        <aside className="citya-hero-showcase" aria-label="Aperçu premium Citya Montauban">
          <PropertyVisual property={selectedProperty} large />
          <div className="citya-hero-property-card">
            <span>Place Nationale</span>
            <strong>{selectedProperty.title}</strong>
            <p>{selectedProperty.price}</p>
            <div className="citya-property-meta">
              <span>{selectedProperty.surface}</span>
              <span>{selectedProperty.rooms}</span>
              <span>{selectedProperty.type}</span>
            </div>
          </div>
          <div className="citya-service-stack">
            <FeatureNote title="Image moderne" text="Une présentation soignée, à la hauteur de votre bien et de votre temps." />
            <FeatureNote title="Confiance rapide" text="Engagements écrits, conseillers locaux, communication claire." />
            <FeatureNote title="Transparence totale" text="Espace vendeur privé : visites, retours, étapes, documents." />
          </div>
        </aside>
      </section>

      <section className="citya-section citya-featured-properties" id="biens">
        <div className="citya-section-heading">
          <p className="citya-eyebrow">Sélection</p>
          <h2>Biens à la une</h2>
          <a href={cityaWebsiteUrl} target="_blank" rel="noreferrer">Voir tous les biens</a>
        </div>
        <div className="citya-property-grid">
          {properties.map((property) => (
            <button
              className={selectedProperty.id === property.id ? 'citya-property-card active' : 'citya-property-card'}
              key={property.id}
              type="button"
              onClick={() => setSelectedProperty(property)}
            >
              <PropertyVisual property={property} />
              <span className="citya-card-tag">{property.transaction === 'location' ? 'Location' : 'Vente'}</span>
              <strong>{property.title}</strong>
              <p>{property.city}</p>
              <div className="citya-property-meta">
                <b>{property.price}</b>
                <span>{property.surface}</span>
                <span>{property.rooms}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="citya-section citya-detail-section">
        <Card className="citya-detail-card">
          <PropertyVisual property={selectedProperty} large />
          <div className="citya-detail-copy">
            <p className="citya-eyebrow">Fiche bien détaillée</p>
            <h2>{selectedProperty.title}</h2>
            <p>{selectedProperty.description}</p>
            <div className="citya-property-meta">
              <b>{selectedProperty.price}</b>
              <span>{selectedProperty.surface}</span>
              <span>{selectedProperty.rooms}</span>
              <span>{selectedProperty.type}</span>
            </div>
            <div className="citya-highlight-row">
              {selectedProperty.highlights.map((highlight) => <i key={highlight}>{highlight}</i>)}
            </div>
            <div className="citya-hero-actions">
              <Button onClick={() => window.location.href = `tel:${cityaAgency.phone.replace(/\s/g, '')}`}>Appeler l'agence</Button>
              <Button variant="secondary" onClick={() => scrollToId('visite')}>Demander une visite</Button>
            </div>
            <small className="citya-source-note">Source : informations publiques visibles sur la page agence Citya Montauban.</small>
          </div>
        </Card>
      </section>

      <section className="citya-section citya-estimation-band" id="estimation">
        <div className="citya-estimation-copy">
          <p className="citya-eyebrow">Estimation</p>
          <h2>Le juste prix, sans bruit.</h2>
          <p>
            Une estimation argumentée, basée sur les ventes réelles à Montauban et l'expérience terrain de l'équipe.
            Pas de gonflage, pas de baratin.
          </p>
          <ul className="citya-check-list">
            <li>Analyse comparée par quartier : Villebourbon, Centre, Sapiac...</li>
            <li>Visite sur place par un conseiller local</li>
            <li>Retour clair sous 72h, sans engagement</li>
          </ul>
        </div>
        <Card className="citya-form-card citya-form-card-premium">
          <form onSubmit={submitEstimation}>
            <div className="citya-form-heading">
              <span>Parcours vendeur</span>
              <strong>Démarrer mon estimation</strong>
            </div>
            <div className="citya-form-grid">
              <TextInput label="Prénom" value={estimation.firstName} onChange={(value) => setEstimation({ ...estimation, firstName: value })} />
              <TextInput label="Nom" value={estimation.lastName} onChange={(value) => setEstimation({ ...estimation, lastName: value })} />
              <TextInput label="Téléphone" value={estimation.phone} onChange={(value) => setEstimation({ ...estimation, phone: value })} />
              <TextInput label="Email" type="email" value={estimation.email} onChange={(value) => setEstimation({ ...estimation, email: value })} />
              <TextInput label="Type de bien" value={estimation.propertyType} onChange={(value) => setEstimation({ ...estimation, propertyType: value })} />
              <TextInput label="Ville" value={estimation.city} onChange={(value) => setEstimation({ ...estimation, city: value })} />
              <TextInput label="Surface" value={estimation.surface} onChange={(value) => setEstimation({ ...estimation, surface: value })} />
              <TextInput label="Pièces" value={estimation.rooms} onChange={(value) => setEstimation({ ...estimation, rooms: value })} />
            </div>
            <Button type="submit">Envoyer ma demande d'estimation</Button>
            {notice?.type === 'estimation' && <SuccessNotice message={notice.message} />}
          </form>
        </Card>
      </section>

      <section className="citya-section citya-seller-space" id="vendeur">
        <div className="citya-section-heading">
          <p className="citya-eyebrow">Espace vendeur</p>
          <h2>Vous ne relancez plus l'agence. Vous voyez où en est votre vente.</h2>
          <p>Visites, comptes rendus, retours acheteurs, documents : tout est centralisé dans un espace privé.</p>
        </div>
        <div className="citya-seller-dashboard">
          <Card className="citya-seller-main-card">
            <PropertyVisual property={selectedProperty} />
            <div>
              <span>Votre bien</span>
              <strong>{selectedProperty.title}</strong>
              <p>En commercialisation</p>
            </div>
          </Card>
          <Card className="citya-progress-card">
            <span>Progression</span>
            <ol className="citya-steps">
              <li>Mandat signé</li>
              <li>Mise en ligne</li>
              <li>Visites qualifiées</li>
              <li>Retour vendeur</li>
              <li>Offre acceptée</li>
            </ol>
          </Card>
          <Card className="citya-report-card">
            <span>Dernier compte rendu</span>
            <p>Visite réalisée samedi. Retour positif sur la luminosité, interrogation sur la copropriété. Documents transmis.</p>
            <small>Laura S. - il y a 2 jours</small>
          </Card>
          <Card className="citya-documents-card">
            <span>Documents</span>
            <p>Mandat, diagnostics, compte rendu de visite, dossier locataire.</p>
          </Card>
        </div>
      </section>

      <section className="citya-section citya-value-section" id="valeur">
        <div className="citya-section-heading">
          <p className="citya-eyebrow">Pourquoi nous confier votre bien</p>
          <h2>Une agence nationale, un accompagnement local lisible.</h2>
        </div>
        <div className="citya-value-grid">
          <FeatureNote title="Expertise locale" text="Montauban, Villebourbon, Centre historique, Sapiac : chaque secteur demande une lecture précise." />
          <FeatureNote title="Location, vente, gestion" text="Une seule équipe pour rendre les parcours plus clairs, sans multiplier les interlocuteurs." />
          <FeatureNote title="Suivi transparent" text="Les propriétaires visualisent les étapes, les visites, les retours et les documents importants." />
        </div>
      </section>

      <section className="citya-section citya-forms-row" id="visite">
        <Card className="citya-form-card">
          <form onSubmit={submitVisit}>
            <div className="citya-form-heading">
              <span>Demande de visite qualifiée</span>
              <strong>Un conseiller valide votre situation et le créneau.</strong>
            </div>
            <div className="citya-form-grid">
              <TextInput label="Prénom" value={visit.firstName} onChange={(value) => setVisit({ ...visit, firstName: value })} />
              <TextInput label="Nom" value={visit.lastName} onChange={(value) => setVisit({ ...visit, lastName: value })} />
              <TextInput label="Téléphone" value={visit.phone} onChange={(value) => setVisit({ ...visit, phone: value })} />
              <TextInput label="Email" type="email" value={visit.email} onChange={(value) => setVisit({ ...visit, email: value })} />
              <TextInput label="Situation acheteur / locataire" value={visit.buyerSituation} onChange={(value) => setVisit({ ...visit, buyerSituation: value })} />
              <TextInput label="Financement ou situation" value={visit.financingStatus} onChange={(value) => setVisit({ ...visit, financingStatus: value })} />
              <TextInput label="Délai" value={visit.buyingTimeline} onChange={(value) => setVisit({ ...visit, buyingTimeline: value })} />
            </div>
            <TextArea label="Message" value={visit.message} onChange={(value) => setVisit({ ...visit, message: value })} />
            <Button type="submit">Envoyer ma demande de visite</Button>
            {notice?.type === 'visit' && <SuccessNotice message={notice.message} />}
          </form>
        </Card>

        <Card className="citya-form-card" id="contact">
          <form onSubmit={submitCallback}>
            <div className="citya-form-heading">
              <span>Parler à un conseiller local</span>
              <strong>Rappel sous 24h ouvrées, sans engagement.</strong>
              <small>{cityaAgency.address} - {cityaAgency.phone}</small>
            </div>
            <div className="citya-form-grid">
              <TextInput label="Prénom" value={callback.firstName} onChange={(value) => setCallback({ ...callback, firstName: value })} />
              <TextInput label="Nom" value={callback.lastName} onChange={(value) => setCallback({ ...callback, lastName: value })} />
              <TextInput label="Téléphone" value={callback.phone} onChange={(value) => setCallback({ ...callback, phone: value })} />
              <TextInput label="Email" type="email" value={callback.email} onChange={(value) => setCallback({ ...callback, email: value })} />
              <TextInput label="Motif" value={callback.reason} onChange={(value) => setCallback({ ...callback, reason: value })} />
            </div>
            <TextArea label="Message" value={callback.message} onChange={(value) => setCallback({ ...callback, message: value })} />
            <Button type="submit">Demander un rappel</Button>
            {notice?.type === 'callback' && <SuccessNotice message={notice.message} />}
          </form>
        </Card>
      </section>
    </main>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="citya-info-pill">
      <strong>{value}</strong>
      <small>{label}</small>
    </span>
  )
}

function FeatureNote({ title, text }: { title: string; text: string }) {
  return (
    <article className="citya-feature-note">
      <strong>{title}</strong>
      <p>{text}</p>
    </article>
  )
}

function SuccessNotice({ message }: { message: string }) {
  return <p className="citya-success">{message}</p>
}

function PropertyVisual({ property, large = false }: { property: CityaProperty; large?: boolean }) {
  return (
    <div className={large ? 'citya-property-visual large' : 'citya-property-visual'}>
      {property.imageUrl ? (
        <img src={property.imageUrl} alt={property.title} />
      ) : (
        <span>{property.imageLabel}</span>
      )}
    </div>
  )
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
