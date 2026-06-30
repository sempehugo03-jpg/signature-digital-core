import { useState } from 'react'
import type { FormEvent } from 'react'
import { cityaAgency, cityaAgencyId, cityaProperties, cityaWebsiteUrl } from '../../data/cityaMontauban'
import type { CityaProperty } from '../../data/cityaMontauban'
import { createSignatureAppointment, createSignatureLead } from '../../data/signatureDigitalStore'
import { createCallbackRequest, createLead, createAppointment } from '../../lib/signature-digital-client'
import { Button, Card, SectionTitle, TextArea, TextInput } from '../shared/DesignSystem'

type Notice = {
  type: 'estimation' | 'visit' | 'callback'
  message: string
}

export function CityaMontaubanDemo() {
  const [selectedProperty, setSelectedProperty] = useState<CityaProperty>(cityaProperties[0])
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
      title: `Demande de visite — ${selectedProperty.title}`,
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
      <nav className="citya-demo-nav">
        <a href="#accueil" className="citya-logo-mark" aria-label="Citya Montauban accueil">
          <span>Citya</span>
          <small>Montauban</small>
        </a>
        <div>
          <a href="#biens">Biens</a>
          <a href="#estimation">Estimation</a>
          <a href="#vendeur">Espace vendeur</a>
          <a href="#contact">Contact</a>
        </div>
      </nav>

      <section className="citya-hero" id="accueil">
        <div className="citya-hero-copy">
          <p className="citya-eyebrow">Citya Naudin · Montauban</p>
          <h1>Votre projet immobilier à Montauban, suivi avec clarté.</h1>
          <p>
            Location, vente, gestion et syndic : Citya Montauban vous accompagne avec une expérience plus simple,
            plus lisible et plus rassurante.
          </p>
          <div className="inline-actions">
            <Button onClick={() => scrollToId('estimation')}>Estimer mon bien</Button>
            <Button variant="secondary" onClick={() => scrollToId('biens')}>Voir les biens</Button>
          </div>
          <div className="citya-proof-grid">
            <InfoPill label="Agence" value="Citya Naudin" />
            <InfoPill label="Adresse" value="3 place Prax Paris" />
            <InfoPill label="Téléphone" value={cityaAgency.phone} />
          </div>
        </div>
        <Card className="citya-hero-card">
          <span className="citya-card-tag">Aperçu location</span>
          <strong>{cityaProperties[0].title}</strong>
          <p>{cityaProperties[0].city}</p>
          <div className="citya-property-visual">
            <span>{cityaProperties[0].imageLabel}</span>
          </div>
          <div className="citya-property-meta">
            <b>{cityaProperties[0].price}</b>
            <span>{cityaProperties[0].surface}</span>
            <span>{cityaProperties[0].rooms}</span>
          </div>
        </Card>
      </section>

      <section className="citya-section" id="biens">
        <SectionTitle
          eyebrow="Biens Citya Montauban"
          title="Les annonces réelles, présentées plus clairement."
          text="Les informations ci-dessous reprennent les annonces visibles sur le site Citya Montauban. Les photos sont marquées temporaires lorsque l’URL directe n’est pas exploitable."
        />
        <div className="citya-property-grid">
          {cityaProperties.map((property) => (
            <button
              className={selectedProperty.id === property.id ? 'citya-property-card active' : 'citya-property-card'}
              key={property.id}
              type="button"
              onClick={() => setSelectedProperty(property)}
            >
              <div className="citya-property-visual">
                <span>{property.imageLabel}</span>
              </div>
              <small>{property.transaction === 'location' ? 'Location' : 'Vente'}</small>
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
          <div className="citya-property-visual large">
            <span>{selectedProperty.imageLabel}</span>
          </div>
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
            <div className="badge-row">
              {selectedProperty.highlights.map((highlight) => <i key={highlight}>{highlight}</i>)}
            </div>
            <div className="inline-actions">
              <Button onClick={() => window.location.href = `tel:${cityaAgency.phone.replace(/\s/g, '')}`}>Appeler l’agence</Button>
              <Button variant="secondary" onClick={() => scrollToId('visite')}>Demander une visite</Button>
            </div>
            <small className="citya-source-note">Source : informations publiques visibles sur la page agence Citya Montauban.</small>
          </div>
        </Card>
      </section>

      <section className="citya-section citya-split" id="estimation">
        <div>
          <SectionTitle
            eyebrow="Estimation vendeur"
            title="Estimer votre bien avec un conseiller Citya."
            text="Un parcours simple pour qualifier la demande et organiser un rappel professionnel."
          />
          <ul className="citya-check-list">
            <li>Analyse du type de bien et de la surface</li>
            <li>Contexte Montauban et Tarn-et-Garonne</li>
            <li>Rappel conseiller sans ouverture Gmail</li>
          </ul>
        </div>
        <Card className="citya-form-card">
          <form onSubmit={submitEstimation}>
            <TextInput label="Prénom" value={estimation.firstName} onChange={(value) => setEstimation({ ...estimation, firstName: value })} />
            <TextInput label="Nom" value={estimation.lastName} onChange={(value) => setEstimation({ ...estimation, lastName: value })} />
            <TextInput label="Téléphone" value={estimation.phone} onChange={(value) => setEstimation({ ...estimation, phone: value })} />
            <TextInput label="Email" type="email" value={estimation.email} onChange={(value) => setEstimation({ ...estimation, email: value })} />
            <TextInput label="Type de bien" value={estimation.propertyType} onChange={(value) => setEstimation({ ...estimation, propertyType: value })} />
            <TextInput label="Ville" value={estimation.city} onChange={(value) => setEstimation({ ...estimation, city: value })} />
            <TextInput label="Surface" value={estimation.surface} onChange={(value) => setEstimation({ ...estimation, surface: value })} />
            <TextInput label="Pièces" value={estimation.rooms} onChange={(value) => setEstimation({ ...estimation, rooms: value })} />
            <Button type="submit">Envoyer ma demande d’estimation</Button>
            {notice?.type === 'estimation' && <p className="client-success">{notice.message}</p>}
          </form>
        </Card>
      </section>

      <section className="citya-section citya-seller-space" id="vendeur">
        <SectionTitle
          eyebrow="Espace vendeur démo"
          title="Vous ne relancez plus l’agence. Vous voyez où en est votre vente."
          text="Une projection simple de l’espace de suivi vendeur Signature Digital, habillée pour Citya Montauban."
        />
        <div className="citya-seller-grid">
          <Card>
            <strong>Progression de vente</strong>
            <ol className="citya-steps">
              <li>Mandat signé</li>
              <li>Mise en ligne</li>
              <li>Visites qualifiées</li>
              <li>Retour vendeur</li>
            </ol>
          </Card>
          <Card>
            <strong>Prochaine visite</strong>
            <p>Appartement 3 pièces 87.14 m² · créneau à confirmer avec le conseiller.</p>
          </Card>
          <Card>
            <strong>Dernier compte rendu</strong>
            <p>Visite intéressée, demande de précisions sur la copropriété et les charges. Documents transmis.</p>
          </Card>
          <Card>
            <strong>Documents importants</strong>
            <p>Mandat, diagnostics, compte rendu de visite, dossier locataire.</p>
          </Card>
        </div>
      </section>

      <section className="citya-section citya-split" id="visite">
        <div>
          <SectionTitle
            eyebrow="Demande de visite qualifiée"
            title="Valider la situation avant de confirmer un créneau."
            text="Aucune visite n’est confirmée automatiquement. Un conseiller rappelle pour valider la situation et le créneau."
          />
        </div>
        <Card className="citya-form-card">
          <form onSubmit={submitVisit}>
            <TextInput label="Prénom" value={visit.firstName} onChange={(value) => setVisit({ ...visit, firstName: value })} />
            <TextInput label="Nom" value={visit.lastName} onChange={(value) => setVisit({ ...visit, lastName: value })} />
            <TextInput label="Téléphone" value={visit.phone} onChange={(value) => setVisit({ ...visit, phone: value })} />
            <TextInput label="Email" type="email" value={visit.email} onChange={(value) => setVisit({ ...visit, email: value })} />
            <TextInput label="Situation acheteur / locataire" value={visit.buyerSituation} onChange={(value) => setVisit({ ...visit, buyerSituation: value })} />
            <TextInput label="Financement ou situation" value={visit.financingStatus} onChange={(value) => setVisit({ ...visit, financingStatus: value })} />
            <TextInput label="Délai" value={visit.buyingTimeline} onChange={(value) => setVisit({ ...visit, buyingTimeline: value })} />
            <TextArea label="Message" value={visit.message} onChange={(value) => setVisit({ ...visit, message: value })} />
            <Button type="submit">Envoyer ma demande de visite</Button>
            {notice?.type === 'visit' && <p className="client-success">{notice.message}</p>}
          </form>
        </Card>
      </section>

      <section className="citya-section citya-split" id="contact">
        <div>
          <SectionTitle
            eyebrow="Contact Citya Montauban"
            title="Location, vente, gestion : parler à un conseiller."
            text={`${cityaAgency.address} · ${cityaAgency.phone}`}
          />
          <p className="citya-source-note">{cityaAgency.sourceNote}</p>
          <a className="citya-plain-link" href={cityaWebsiteUrl} target="_blank" rel="noreferrer">Voir le site actuel Citya</a>
        </div>
        <Card className="citya-form-card">
          <form onSubmit={submitCallback}>
            <TextInput label="Prénom" value={callback.firstName} onChange={(value) => setCallback({ ...callback, firstName: value })} />
            <TextInput label="Nom" value={callback.lastName} onChange={(value) => setCallback({ ...callback, lastName: value })} />
            <TextInput label="Téléphone" value={callback.phone} onChange={(value) => setCallback({ ...callback, phone: value })} />
            <TextInput label="Email" type="email" value={callback.email} onChange={(value) => setCallback({ ...callback, email: value })} />
            <TextInput label="Motif" value={callback.reason} onChange={(value) => setCallback({ ...callback, reason: value })} />
            <TextArea label="Message" value={callback.message} onChange={(value) => setCallback({ ...callback, message: value })} />
            <Button type="submit">Demander un rappel</Button>
            {notice?.type === 'callback' && <p className="client-success">{notice.message}</p>}
          </form>
        </Card>
      </section>
    </main>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="citya-info-pill">
      <small>{label}</small>
      <strong>{value}</strong>
    </span>
  )
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
