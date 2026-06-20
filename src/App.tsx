import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import {
  createCustomButton,
  createCustomPage,
  createAgency,
  createAgencyFromAnalysis,
  createGlobalButton,
  createGlobalPage,
  createProperty,
  addTeamMember,
  createAccessToken,
  deleteButton,
  deleteAgency,
  deletePage,
  deleteProperty,
  generateInvitation,
  getAgencyButtons,
  getAgencyButtonsByPlacement,
  getAgencyAccessTokens,
  getAgencyActivity,
  getAgencyInvitations,
  getAgencyPageBySlug,
  getAgencyPages,
  getAgencyPaymentLink,
  getAgencyProperties,
  getAgencySimulatedEmails,
  getAgencyTeamMembers,
  getAgencyUsers,
  getAdminLayout,
  getAccessByToken,
  getBranchableStatuses,
  getGlobalAppearance,
  getGlobalButtons,
  getGlobalButtonsByPlacement,
  getGlobalModules,
  getGlobalPageBySlug,
  getGlobalPages,
  getLocalState,
  getProperty,
  getPublicSiteConfig,
  resetDemoData,
  resetAgencyDemo,
  removeTeamMember,
  updateAgency,
  updateAgencyMood,
  updateAccessToken,
  updateAdminLayout,
  updateGlobalAppearance,
  updateGlobalModules,
  updateInvitationStatus,
  updatePublicSiteConfig,
  updateProperty,
  updateSimulatedEmailStatus,
  upsertPaymentLink,
} from './lib/localStore'
import type {
  AdminCardConfig,
  Agency,
  AgencyAnalysis,
  AgencyMood,
  CustomButton,
  CreatePropertyInput,
  GlobalButton,
  GlobalModule,
  GlobalPage,
  InvitationRole,
  Property,
  PropertyDocument,
  PropertyVisit,
  PublicSiteConfig,
  TeamMember,
} from './lib/localStore'
import {
  demoProperty,
  immobilierAgency,
  immobilierSector,
  sellerTracking,
} from './sectors/immobilier/data'

type Navigate = (route: string) => void
type FlashSetter = (message: string) => void

const hubLinks = [
  { label: 'Site public', route: '/demo/immobilier/public' },
  { label: 'Espace patron', route: '/demo/immobilier/patron' },
  { label: 'Espace agent', route: '/demo/immobilier/agent' },
  { label: 'Espace vendeur', route: '/demo/immobilier/vendeur' },
  { label: 'Gérer le bien', route: '/demo/immobilier/bien' },
]

const saleSteps = ['Mandat', 'Annonce', 'Visites', 'Offre', 'Compromis', 'Vente']
const branchableBadge = 'Fonction prête à connecter'

function getRoute() {
  return window.location.pathname
}

function copyLocalText(value: string, setFlash: FlashSetter, message = 'Copié localement') {
  navigator.clipboard?.writeText(value).catch(() => undefined)
  setFlash(message)
}

function App() {
  const [route, setRoute] = useState(getRoute)
  const [storeVersion, setStoreVersion] = useState(0)
  const [flash, setFlash] = useState('')
  const state = useMemo(() => getLocalState(), [storeVersion])

  const currentLabel = useMemo(() => {
    if (route.startsWith('/admin/agences')) return 'Agences'
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

  function refreshStore() {
    setStoreVersion((version) => version + 1)
  }

  function navigate(nextRoute: string) {
    window.history.pushState({}, '', nextRoute)
    setRoute(nextRoute)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function flashAndRefresh(message: string) {
    setFlash(message)
    refreshStore()
  }

  const adminAgencyNew = route === '/admin/agences/new'
  const adminSite = route === '/admin/site'
  const adminGlobalAppearance = route === '/admin/apparence'
  const adminGlobalPages = route === '/admin/pages'
  const adminGlobalButtons = route === '/admin/buttons'
  const adminGlobalModules = route === '/admin/modules'
  const adminTemplates = route === '/admin/templates'
  const adminLayout = route === '/admin/layout'
  const adminAssistant = route === '/admin/assistant'
  const adminPreview = route === '/admin/preview'
  const adminSystem = route === '/admin/system'
  const globalPage = route.match(/^\/page\/([^/]+)$/)
  const adminAgencyDetail = adminAgencyNew ? null : route.match(/^\/admin\/agences\/([^/]+)$/)
  const adminAnalysis = route.match(/^\/admin\/agences\/([^/]+)\/analyse$/)
  const adminAppearance = route.match(/^\/admin\/agences\/([^/]+)\/apparence$/)
  const adminMood = route.match(/^\/admin\/agences\/([^/]+)\/ambiance$/)
  const adminAccess = route.match(/^\/admin\/agences\/([^/]+)\/acces$/)
  const adminInvitations = route.match(/^\/admin\/agences\/([^/]+)\/invitations$/)
  const adminEmails = route.match(/^\/admin\/agences\/([^/]+)\/emails$/)
  const adminPayment = route.match(/^\/admin\/agences\/([^/]+)\/paiement$/)
  const adminTeam = route.match(/^\/admin\/agences\/([^/]+)\/equipe$/)
  const adminTracking = route.match(/^\/admin\/agences\/([^/]+)\/suivi$/)
  const adminDanger = route.match(/^\/admin\/agences\/([^/]+)\/danger$/)
  const adminProperties = route.match(/^\/admin\/agences\/([^/]+)\/annonces$/)
  const adminPropertyNew = route.match(/^\/admin\/agences\/([^/]+)\/annonces\/new$/)
  const adminPropertyEdit = adminPropertyNew ? null : route.match(/^\/admin\/agences\/([^/]+)\/annonces\/([^/]+)$/)
  const adminPages = route.match(/^\/admin\/agences\/([^/]+)\/pages$/)
  const adminButtons = route.match(/^\/admin\/agences\/([^/]+)\/buttons$/)
  const adminModules = route.match(/^\/admin\/agences\/([^/]+)\/modules$/)
  const adminAgencyDemo = route.match(/^\/admin\/agences\/([^/]+)\/demo$/)
  const adminExport = route.match(/^\/admin\/agences\/([^/]+)\/export$/)
  const generatedPublic = route.match(/^\/demo\/immobilier\/agence\/([^/]+)\/public$/)
  const generatedPublicProperty = route.match(/^\/demo\/immobilier\/agence\/([^/]+)\/public\/([^/]+)$/)
  const generatedPatron = route.match(/^\/demo\/immobilier\/agence\/([^/]+)\/patron$/)
  const generatedAgent = route.match(/^\/demo\/immobilier\/agence\/([^/]+)\/agent$/)
  const generatedSeller = route.match(/^\/demo\/immobilier\/agence\/([^/]+)\/vendeur\/([^/]+)$/)
  const generatedProperty = route.match(/^\/demo\/immobilier\/agence\/([^/]+)\/bien\/([^/]+)$/)
  const generatedPage = route.match(/^\/demo\/immobilier\/agence\/([^/]+)\/page\/([^/]+)$/)
  const generatedPreparation = route.match(/^\/demo\/immobilier\/agence\/([^/]+)\/preparation$/)
  const accessRoute = route.match(/^\/(?:access|acces|invitation)\/([^/]+)$/)
  const paymentRoute = route.match(/^\/payment\/([^/]+)$/)
  const paymentSuccess = route.match(/^\/payment\/([^/]+)\/success$/)
  const paymentCancel = route.match(/^\/payment\/([^/]+)\/cancel$/)

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
          <button className={route.startsWith('/admin') ? 'active' : ''} type="button" onClick={() => navigate('/admin')}>
            Admin
          </button>
          <button className={route.startsWith('/demo') ? 'active' : ''} type="button" onClick={() => navigate('/demo')}>
            Démo
          </button>
        </div>
      </nav>

      <p className="route-pill">{currentLabel}</p>
      {flash && <p className="flash-message">{flash}</p>}

      {route === '/' && <HomeView onNavigate={navigate} />}
      {route === '/admin' && <AdminView onNavigate={navigate} />}
      {adminSite && <GlobalSiteView onNavigate={navigate} onSaved={flashAndRefresh} />}
      {adminGlobalAppearance && <GlobalAppearanceView onNavigate={navigate} onSaved={flashAndRefresh} />}
      {adminGlobalPages && <GlobalPagesView onNavigate={navigate} onSaved={flashAndRefresh} />}
      {adminGlobalButtons && <GlobalButtonsView onNavigate={navigate} onSaved={flashAndRefresh} />}
      {adminGlobalModules && <GlobalModulesView onNavigate={navigate} onSaved={flashAndRefresh} />}
      {adminTemplates && <GlobalTemplatesView onNavigate={navigate} />}
      {adminLayout && <AdminLayoutView onNavigate={navigate} onSaved={flashAndRefresh} />}
      {adminAssistant && <AdminAssistantView onNavigate={navigate} onSaved={flashAndRefresh} />}
      {adminPreview && <AdminPreviewView onNavigate={navigate} />}
      {adminSystem && <AdminSystemView onNavigate={navigate} />}
      {globalPage && <GlobalPageView slug={globalPage[1]} onNavigate={navigate} />}
      {route === '/admin/agences' && <AgenciesView agencies={state.agencies} onNavigate={navigate} onReset={flashAndRefresh} />}
      {adminAgencyNew && <NewAgencyView onNavigate={navigate} onCreated={flashAndRefresh} />}
      {adminAgencyDetail && (
        <AgencyDetailView agencyId={adminAgencyDetail[1]} onNavigate={navigate} setFlash={setFlash} />
      )}
      {adminAnalysis && (
        <AgencyAnalysisView agencyId={adminAnalysis[1]} onNavigate={navigate} onSaved={flashAndRefresh} />
      )}
      {adminAppearance && (
        <AgencyAppearanceView agencyId={adminAppearance[1]} onNavigate={navigate} onSaved={flashAndRefresh} />
      )}
      {adminMood && (
        <AgencyMoodView agencyId={adminMood[1]} onNavigate={navigate} onSaved={flashAndRefresh} />
      )}
      {adminAccess && (
        <AgencyAccessView agencyId={adminAccess[1]} onNavigate={navigate} setFlash={setFlash} />
      )}
      {adminInvitations && (
        <AgencyInvitationsView agencyId={adminInvitations[1]} onNavigate={navigate} onSaved={flashAndRefresh} setFlash={setFlash} />
      )}
      {adminEmails && (
        <AgencyEmailsView agencyId={adminEmails[1]} onNavigate={navigate} onSaved={flashAndRefresh} setFlash={setFlash} />
      )}
      {adminPayment && (
        <AgencyPaymentView agencyId={adminPayment[1]} onNavigate={navigate} onSaved={flashAndRefresh} setFlash={setFlash} />
      )}
      {adminTeam && (
        <AgencyTeamView agencyId={adminTeam[1]} onNavigate={navigate} onSaved={flashAndRefresh} />
      )}
      {adminTracking && (
        <AgencyTrackingView agencyId={adminTracking[1]} onNavigate={navigate} onSaved={flashAndRefresh} />
      )}
      {adminDanger && (
        <AgencyDangerView agencyId={adminDanger[1]} onNavigate={navigate} onSaved={flashAndRefresh} />
      )}
      {adminProperties && (
        <AgencyPropertiesView agencyId={adminProperties[1]} onNavigate={navigate} />
      )}
      {adminPropertyNew && (
        <NewPropertyView agencyId={adminPropertyNew[1]} onNavigate={navigate} onCreated={flashAndRefresh} />
      )}
      {adminPages && (
        <AgencyPagesView agencyId={adminPages[1]} onNavigate={navigate} onCreated={flashAndRefresh} />
      )}
      {adminButtons && (
        <AgencyButtonsView agencyId={adminButtons[1]} onNavigate={navigate} onCreated={flashAndRefresh} />
      )}
      {adminModules && (
        <AgencyModulesView agencyId={adminModules[1]} onNavigate={navigate} onSaved={flashAndRefresh} />
      )}
      {adminAgencyDemo && (
        <AgencyDemoView agencyId={adminAgencyDemo[1]} onNavigate={navigate} />
      )}
      {adminExport && (
        <AgencyExportView agencyId={adminExport[1]} onNavigate={navigate} setFlash={setFlash} />
      )}
      {adminPropertyEdit && (
        <EditPropertyView
          agencyId={adminPropertyEdit[1]}
          propertyId={adminPropertyEdit[2]}
          onNavigate={navigate}
          onSaved={flashAndRefresh}
        />
      )}
      {route === '/demo' && <DemoIndexView onNavigate={navigate} />}
      {route === '/demo/immobilier' && <ImmobilierHubView agencies={state.agencies} onNavigate={navigate} />}
      {route === '/demo/immobilier/public' && <ImmobilierPublicView onNavigate={navigate} />}
      {route === '/demo/immobilier/patron' && <ImmobilierPatronView onNavigate={navigate} />}
      {route === '/demo/immobilier/agent' && <ImmobilierAgentView onNavigate={navigate} />}
      {route === '/demo/immobilier/vendeur' && <ImmobilierVendeurView onNavigate={navigate} />}
      {route === '/demo/immobilier/bien' && <ImmobilierBienView onNavigate={navigate} />}
      {generatedPublic && <GeneratedPublicView agencyId={generatedPublic[1]} onNavigate={navigate} />}
      {generatedPublicProperty && (
        <GeneratedPublicView
          agencyId={generatedPublicProperty[1]}
          propertyId={generatedPublicProperty[2]}
          onNavigate={navigate}
        />
      )}
      {generatedPatron && <GeneratedPatronView agencyId={generatedPatron[1]} onNavigate={navigate} />}
      {generatedAgent && <GeneratedAgentView agencyId={generatedAgent[1]} onNavigate={navigate} />}
      {generatedSeller && (
        <GeneratedSellerView agencyId={generatedSeller[1]} propertyId={generatedSeller[2]} onNavigate={navigate} />
      )}
      {generatedProperty && (
        <GeneratedPropertyView agencyId={generatedProperty[1]} propertyId={generatedProperty[2]} onNavigate={navigate} />
      )}
      {generatedPage && (
        <GeneratedCustomPageView agencyId={generatedPage[1]} slug={generatedPage[2]} onNavigate={navigate} />
      )}
      {generatedPreparation && (
        <PreparationView agencyId={generatedPreparation[1]} onNavigate={navigate} />
      )}
      {accessRoute && <AccessTokenView token={accessRoute[1]} onNavigate={navigate} />}
      {paymentRoute && <PaymentSimulationView agencyId={paymentRoute[1]} onNavigate={navigate} />}
      {paymentSuccess && <PaymentResultView agencyId={paymentSuccess[1]} status="success" onNavigate={navigate} />}
      {paymentCancel && <PaymentResultView agencyId={paymentCancel[1]} status="cancel" onNavigate={navigate} />}
      {!isKnownRoute(route) &&
        !adminAgencyNew &&
        !adminSite &&
        !adminGlobalAppearance &&
        !adminGlobalPages &&
        !adminGlobalButtons &&
        !adminGlobalModules &&
        !adminTemplates &&
        !adminLayout &&
        !adminAssistant &&
        !adminPreview &&
        !adminSystem &&
        !globalPage &&
        !adminAgencyDetail &&
        !adminAnalysis &&
        !adminAppearance &&
        !adminMood &&
        !adminAccess &&
        !adminInvitations &&
        !adminEmails &&
        !adminPayment &&
        !adminTeam &&
        !adminTracking &&
        !adminDanger &&
        !adminProperties &&
        !adminPropertyNew &&
        !adminPropertyEdit &&
        !adminPages &&
        !adminButtons &&
        !adminModules &&
        !adminAgencyDemo &&
        !adminExport &&
        !generatedPublic &&
        !generatedPublicProperty &&
        !generatedPatron &&
        !generatedAgent &&
        !generatedSeller &&
        !generatedProperty &&
        !generatedPage &&
        !generatedPreparation &&
        !accessRoute &&
        !paymentRoute &&
        !paymentSuccess &&
        !paymentCancel && <NotFoundView onNavigate={navigate} />}
    </main>
  )
}

function isKnownRoute(route: string) {
  return [
    '/',
    '/admin',
    '/admin/system',
    '/admin/site',
    '/admin/apparence',
    '/admin/pages',
    '/admin/buttons',
    '/admin/modules',
    '/admin/templates',
    '/admin/layout',
    '/admin/assistant',
    '/admin/preview',
    '/admin/agences',
    '/demo',
    '/demo/immobilier',
    '/demo/immobilier/public',
    '/demo/immobilier/patron',
    '/demo/immobilier/agent',
    '/demo/immobilier/vendeur',
    '/demo/immobilier/bien',
  ].includes(route)
}

function HomeView({ onNavigate }: { onNavigate: Navigate }) {
  const config = getPublicSiteConfig()
  const homeButtons = getGlobalButtonsByPlacement('accueil')
  return (
    <section className="hero-view">
      <div className="hero-content">
        <h1>{config.title}</h1>
        <p className="subtitle">{config.subtitle}</p>
        <p className="intro">{config.promise}</p>
        <div className="actions">
          <button className="primary-button" type="button" onClick={() => onNavigate(config.primaryButtonDestination)}>
            {config.primaryButtonText}
          </button>
          <button className="secondary-button" type="button" onClick={() => onNavigate(config.secondaryButtonDestination)}>
            {config.secondaryButtonText}
          </button>
          {homeButtons.map((button) => (
            <button className="secondary-button" key={button.id} type="button" onClick={() => openGlobalDestination(button, onNavigate)}>
              {button.label}
            </button>
          ))}
        </div>
      </div>
      <AgencyPreview />
    </section>
  )
}

function AdminView({ onNavigate }: { onNavigate: Navigate }) {
  const layout = getAdminLayout()
  const cards = [...layout.cards].filter((card) => card.visible).sort((a, b) => a.order - b.order)
  const sections: AdminCardConfig['section'][] = ['Production', 'Personnalisation globale', 'Système']
  const adminButtons = getGlobalButtonsByPlacement('admin')
  const state = getLocalState()
  const latestAgency = [...state.agencies].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  const shortcutCards = [
    {
      title: 'Mes agences',
      text: `${state.agencies.length} demo${state.agencies.length > 1 ? 's' : ''} locale${state.agencies.length > 1 ? 's' : ''}.`,
      route: '/admin/agences',
      label: 'Ouvrir',
    },
    {
      title: 'Signature Immobilier',
      text: 'Tester le premier module metier.',
      route: '/demo/immobilier',
      label: 'Voir',
    },
    {
      title: 'Site Signature Digital',
      text: 'Modifier la page d accueil globale.',
      route: '/admin/site',
      label: 'Modifier',
    },
  ]
  const advancedCards = cards.filter((card) => !['agencies', 'create-agency', 'preview'].includes(card.id))

  return (
    <section className="page-view admin-cockpit">
      <div className="calm-heading">
        <p className="eyebrow">Studio Admin</p>
        <h1>Bonjour Hugo</h1>
        <p className="subtitle">Que veux-tu faire aujourd’hui ?</p>
        <p className="microcopy">Commence par une action. Tu pourras tout modifier plus tard.</p>
      </div>

      <div className="hero-action">
        <button className="primary-button" type="button" onClick={() => onNavigate('/admin/agences/new')}>
          Créer une demo agence
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/admin/preview')}>
          Voir le rendu
        </button>
      </div>

      <article className="guided-card">
        <div>
          <p className="eyebrow">Reprendre</p>
          {latestAgency ? (
            <>
              <h2>{latestAgency.name}</h2>
              <p>{latestAgency.city} · {latestAgency.status}</p>
            </>
          ) : (
            <>
              <h2>Aucune agence locale</h2>
              <p>Cree une premiere demo pour generer les espaces public, patron, agent et vendeur.</p>
            </>
          )}
        </div>
        <div className="inline-actions">
          <button
            className="primary-button compact"
            type="button"
            onClick={() => onNavigate(latestAgency ? `/admin/agences/${latestAgency.id}` : '/admin/agences/new')}
          >
            {latestAgency ? 'Continuer' : 'Créer'}
          </button>
          <button
            className="secondary-button compact"
            type="button"
            onClick={() => onNavigate(latestAgency ? `/demo/immobilier/agence/${latestAgency.id}/public` : '/demo/immobilier')}
          >
            Voir la demo
          </button>
        </div>
      </article>

      <section className="calm-section">
        <div>
          <p className="eyebrow">Raccourcis</p>
          <h2>Les essentiels</h2>
        </div>
        <div className="shortcut-grid">
          {shortcutCards.map((card) => (
            <article className="quiet-card" key={card.title}>
              <h2>{card.title}</h2>
              <p>{card.text}</p>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(card.route)}>
                {card.label}
              </button>
            </article>
          ))}
        </div>
      </section>

      <details className="advanced-box">
        <summary>Avance</summary>
        <div className="shortcut-grid">
          {advancedCards.map((card) => (
            <article className="quiet-card" key={card.id}>
              <h2>{card.title}</h2>
              <p>{card.text}</p>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(card.route)}>
                {card.buttonLabel}
              </button>
            </article>
          ))}
          {adminButtons.map((button) => (
            <article className="quiet-card" key={button.id}>
              <h2>{button.label}</h2>
              <p>Bouton global admin.</p>
              <button className="secondary-button compact" type="button" onClick={() => openGlobalDestination(button, onNavigate)}>
                Tester
              </button>
            </article>
          ))}
          <div className="advanced-links">
            <button className="secondary-button compact" type="button" onClick={() => onNavigate('/admin/pages')}>Pages</button>
            <button className="secondary-button compact" type="button" onClick={() => onNavigate('/admin/buttons')}>Boutons</button>
            <button className="secondary-button compact" type="button" onClick={() => onNavigate('/admin/modules')}>Modules</button>
            <button className="secondary-button compact" type="button" onClick={() => onNavigate('/admin/templates')}>Templates</button>
            <button className="secondary-button compact" type="button" onClick={() => onNavigate('/admin/layout')}>Personnaliser admin</button>
            <button className="secondary-button compact" type="button" onClick={() => onNavigate('/admin/assistant')}>Assistant IA</button>
            <button
              className="secondary-button compact"
              type="button"
              onClick={() => {
                resetDemoData()
                window.location.assign('/admin')
              }}
            >
              Réinitialiser les données locales
            </button>
          </div>
        </div>
      </details>

      <div className="page-heading">
        <h1>{layout.title}</h1>
        <p className="subtitle">{layout.subtitle}</p>
      </div>

      <div className="actions">
        <button className="primary-button" type="button" onClick={() => onNavigate('/admin/agences/new')}>
          Créer une agence
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/admin/preview')}>
          Prévisualiser le système
        </button>
      </div>

      {sections.map((section) => (
        <section className="page-view" key={section}>
          <p className="eyebrow">{section}</p>
          <div className="card-grid">
            {cards
              .filter((card) => card.section === section)
              .map((card) => (
                <article className="info-card" key={card.id}>
                  <h2>{card.title}</h2>
                  <p>{card.text}</p>
                  <div className="inline-actions">
                    <button className="secondary-button compact" type="button" onClick={() => onNavigate(card.route)}>
                      {card.buttonLabel}
                    </button>
                  </div>
                </article>
              ))}
          </div>
        </section>
      ))}

      {adminButtons.length > 0 && (
        <article className="demo-panel">
          <p className="eyebrow">Boutons globaux admin</p>
          <div className="inline-actions">
            {adminButtons.map((button) => (
              <button className="secondary-button compact" key={button.id} type="button" onClick={() => openGlobalDestination(button, onNavigate)}>
                {button.label}
              </button>
            ))}
          </div>
        </article>
      )}
    </section>
  )
}

function GlobalSiteView({ onNavigate, onSaved }: { onNavigate: Navigate; onSaved: FlashSetter }) {
  const [config, setConfig] = useState<PublicSiteConfig>(getPublicSiteConfig)
  const sectionNames = ['Hero', 'Signature Immobilier', 'Secteurs', 'Méthode', 'Contact']

  function updateField(field: keyof PublicSiteConfig, value: string) {
    setConfig((current) => ({ ...current, [field]: value }))
  }

  function toggleSection(section: string) {
    setConfig((current) => ({
      ...current,
      sections: {
        ...current.sections,
        [section]: !current.sections[section],
      },
    }))
  }

  function save() {
    updatePublicSiteConfig(config)
    onSaved('Accueil enregistré localement')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Site Signature Digital</h1>
        <p className="subtitle">Modifiez l’accueil, les textes et les CTA.</p>
      </div>
      <article className="edit-panel form-grid">
        <TextField label="Titre principal" value={config.title} onChange={(value) => updateField('title', value)} />
        <TextField label="Sous-titre" value={config.subtitle} onChange={(value) => updateField('subtitle', value)} />
        <TextAreaField label="Promesse" value={config.promise} onChange={(value) => updateField('promise', value)} />
        <TextField label="Texte bouton principal" value={config.primaryButtonText} onChange={(value) => updateField('primaryButtonText', value)} />
        <TextField label="Destination bouton principal" value={config.primaryButtonDestination} onChange={(value) => updateField('primaryButtonDestination', value)} />
        <TextField label="Texte bouton secondaire" value={config.secondaryButtonText} onChange={(value) => updateField('secondaryButtonText', value)} />
        <TextField label="Destination bouton secondaire" value={config.secondaryButtonDestination} onChange={(value) => updateField('secondaryButtonDestination', value)} />
      </article>
      <article className="demo-panel">
        <p className="eyebrow">Sections visibles</p>
        <div className="inline-actions">
          {sectionNames.map((section) => (
            <button className="secondary-button compact" key={section} type="button" onClick={() => toggleSection(section)}>
              {config.sections[section] ? 'ON' : 'OFF'} · {section}
            </button>
          ))}
        </div>
      </article>
      <div className="actions">
        <button className="primary-button" type="button" onClick={save}>
          Enregistrer
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/')}>
          Prévisualiser l’accueil
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/admin')}>
          Retour admin
        </button>
      </div>
    </section>
  )
}

function GlobalAppearanceView({ onNavigate, onSaved }: { onNavigate: Navigate; onSaved: FlashSetter }) {
  const [appearance, setAppearance] = useState(getGlobalAppearance)

  function updateField(field: keyof typeof appearance, value: string) {
    setAppearance((current) => ({ ...current, [field]: value }))
  }

  function save() {
    updateGlobalAppearance(appearance)
    onSaved('Apparence globale enregistrée localement')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Apparence globale</h1>
        <p className="subtitle">Couleurs, ambiance et densité du système.</p>
      </div>
      <article className="edit-panel form-grid">
        <TextField label="Couleur principale" value={appearance.primary} onChange={(value) => updateField('primary', value)} />
        <TextField label="Couleur secondaire" value={appearance.secondary} onChange={(value) => updateField('secondary', value)} />
        <TextField label="Couleur accent" value={appearance.accent} onChange={(value) => updateField('accent', value)} />
        <TextField label="Fond" value={appearance.background} onChange={(value) => updateField('background', value)} />
        <SelectField label="Style" value={appearance.style} options={['premium sobre', 'luxe discret', 'moderne', 'minimal']} onChange={(value) => updateField('style', value)} />
        <SelectField label="Arrondis" value={appearance.radius} options={['doux', 'très arrondis', 'sobres']} onChange={(value) => updateField('radius', value)} />
        <SelectField label="Densité" value={appearance.density} options={['compacte', 'confortable']} onChange={(value) => updateField('density', value)} />
      </article>
      <div className="actions">
        <button className="primary-button" type="button" onClick={save}>
          Enregistrer
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/admin')}>
          Retour admin
        </button>
      </div>
    </section>
  )
}

function GlobalPagesView({ onNavigate, onSaved }: { onNavigate: Navigate; onSaved: FlashSetter }) {
  const pages = getGlobalPages()
  const [form, setForm] = useState({
    title: 'Page contact',
    slug: 'contact',
    placement: 'site public',
    content: 'Une page globale créée depuis le Studio Signature.',
    status: 'publié',
    ctaLabel: 'Retour accueil',
    ctaDestination: '/',
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    const page = createGlobalPage({
      title: form.title,
      slug: form.slug,
      placement: form.placement as GlobalPage['placement'],
      content: form.content,
      status: form.status as GlobalPage['status'],
      ctaLabel: form.ctaLabel,
      ctaDestination: form.ctaDestination,
    })
    onSaved('Page globale créée localement')
    onNavigate(`/page/${page.slug}`)
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Pages globales</h1>
        <p className="subtitle">Ajoutez des pages au site, à l’admin, à l’aide ou aux secteurs.</p>
      </div>
      <form className="edit-panel form-grid" onSubmit={submit}>
        <TextField label="Titre" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} />
        <TextField label="Slug" value={form.slug} onChange={(value) => setForm((current) => ({ ...current, slug: value }))} />
        <SelectField label="Emplacement" value={form.placement} options={['site public', 'admin', 'aide', 'secteur']} onChange={(value) => setForm((current) => ({ ...current, placement: value }))} />
        <SelectField label="Statut" value={form.status} options={['brouillon', 'publié']} onChange={(value) => setForm((current) => ({ ...current, status: value }))} />
        <TextAreaField label="Contenu" value={form.content} onChange={(value) => setForm((current) => ({ ...current, content: value }))} />
        <TextField label="CTA texte" value={form.ctaLabel} onChange={(value) => setForm((current) => ({ ...current, ctaLabel: value }))} />
        <TextField label="CTA destination" value={form.ctaDestination} onChange={(value) => setForm((current) => ({ ...current, ctaDestination: value }))} />
        <button className="primary-button" type="submit">
          Créer page
        </button>
      </form>
      <div className="list-grid">
        {pages.map((page) => (
          <article className="list-card" key={page.id}>
            <div>
              <p className="eyebrow">{page.placement} · {page.status}</p>
              <h2>{page.title}</h2>
              <p>/page/{page.slug}</p>
            </div>
            <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/page/${page.slug}`)}>
              Voir
            </button>
          </article>
        ))}
      </div>
      <button className="secondary-button" type="button" onClick={() => onNavigate('/admin')}>
        Retour admin
      </button>
    </section>
  )
}

function GlobalButtonsView({ onNavigate, onSaved }: { onNavigate: Navigate; onSaved: FlashSetter }) {
  const buttons = getGlobalButtons()
  const [form, setForm] = useState({
    label: 'Ouvrir Signature Immobilier',
    placement: 'accueil',
    destination: '/demo/immobilier',
    style: 'secondaire',
    status: 'actif',
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    createGlobalButton({
      label: form.label,
      placement: form.placement as GlobalButton['placement'],
      destination: form.destination,
      style: form.style as GlobalButton['style'],
      status: form.status as GlobalButton['status'],
    })
    onSaved('Bouton global créé localement')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Boutons globaux</h1>
        <p className="subtitle">Ajoutez des boutons dans l’accueil, l’admin ou les pages globales.</p>
      </div>
      <form className="edit-panel form-grid" onSubmit={submit}>
        <TextField label="Texte" value={form.label} onChange={(value) => setForm((current) => ({ ...current, label: value }))} />
        <SelectField label="Emplacement" value={form.placement} options={['accueil', 'admin', 'démo immobilier', 'page globale']} onChange={(value) => setForm((current) => ({ ...current, placement: value }))} />
        <TextField label="Destination" value={form.destination} onChange={(value) => setForm((current) => ({ ...current, destination: value }))} />
        <SelectField label="Style" value={form.style} options={['principal', 'secondaire', 'discret']} onChange={(value) => setForm((current) => ({ ...current, style: value }))} />
        <SelectField label="Statut" value={form.status} options={['actif', 'inactif']} onChange={(value) => setForm((current) => ({ ...current, status: value }))} />
        <button className="primary-button" type="submit">
          Créer bouton
        </button>
      </form>
      <div className="list-grid">
        {buttons.map((button) => (
          <article className="list-card" key={button.id}>
            <div>
              <p className="eyebrow">{button.placement} · {button.status}</p>
              <h2>{button.label}</h2>
              <p>{button.destination}</p>
            </div>
            <button className="secondary-button compact" type="button" onClick={() => openGlobalDestination(button, onNavigate)}>
              Tester
            </button>
          </article>
        ))}
      </div>
      <button className="secondary-button" type="button" onClick={() => onNavigate('/admin')}>
        Retour admin
      </button>
    </section>
  )
}

function GlobalModulesView({ onNavigate, onSaved }: { onNavigate: Navigate; onSaved: FlashSetter }) {
  const [modules, setModules] = useState<GlobalModule[]>(getGlobalModules)

  function toggle(id: string) {
    setModules((current) =>
      current.map((module) =>
        module.id === id ? { ...module, active: !module.active } : module,
      ),
    )
    onSaved('Module modifié localement')
  }

  function save() {
    updateGlobalModules(modules)
    onSaved('Modules globaux enregistrés localement')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Modules globaux</h1>
        <p className="subtitle">Activez ou désactivez les fonctionnalités du cockpit.</p>
      </div>
      <div className="list-grid">
        {modules.map((module) => (
          <article className="list-card" key={module.id}>
            <div>
              <p className="eyebrow">{module.active ? 'actif' : 'inactif'} · {module.state}</p>
              <h2>{module.name}</h2>
              <p>{module.description}</p>
            </div>
            <button className="secondary-button compact" type="button" onClick={() => toggle(module.id)}>
              {module.active ? 'Désactiver' : 'Activer'}
            </button>
          </article>
        ))}
      </div>
      <div className="actions">
        <button className="primary-button" type="button" onClick={save}>
          Enregistrer
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/admin')}>
          Retour admin
        </button>
      </div>
    </section>
  )
}

function GlobalTemplatesView({ onNavigate }: { onNavigate: Navigate }) {
  const templates = [
    { name: 'Immobilier', status: 'actif', spaces: 'public / pro / client', modules: 'annonces, vendeur, documents' },
    { name: 'Constructeur', status: 'bientôt', spaces: 'public / pro / client', modules: 'projets, devis, suivi' },
    { name: 'Avocat', status: 'bientôt', spaces: 'public / pro / client', modules: 'dossiers, rendez-vous' },
    { name: 'Architecte', status: 'bientôt', spaces: 'public / pro / client', modules: 'portfolio, projets' },
    { name: 'Notaire', status: 'bientôt', spaces: 'public / pro / client', modules: 'dossiers, actes' },
    { name: 'Clinique', status: 'bientôt', spaces: 'public / pro / client', modules: 'patients, rendez-vous' },
    { name: 'Courtier', status: 'bientôt', spaces: 'public / pro / client', modules: 'leads, dossiers' },
  ]

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Templates secteurs</h1>
        <p className="subtitle">Préparez les prochains modules métier depuis le cockpit.</p>
      </div>
      <div className="list-grid">
        {templates.map((template) => (
          <article className="list-card" key={template.name}>
            <div>
              <p className="eyebrow">{template.status}</p>
              <h2>{template.name}</h2>
              <p>{template.spaces} · {template.modules}</p>
            </div>
            <div className="inline-actions">
              <button className="secondary-button compact" type="button" onClick={() => template.name === 'Immobilier' ? onNavigate('/demo/immobilier') : onNavigate('/admin/preview')}>
                Voir
              </button>
              <button className="secondary-button compact" type="button" onClick={() => template.name === 'Immobilier' ? onNavigate('/admin/agences') : onNavigate('/admin/preview')}>
                Modifier
              </button>
            </div>
          </article>
        ))}
      </div>
      <button className="secondary-button" type="button" onClick={() => onNavigate('/admin')}>
        Retour admin
      </button>
    </section>
  )
}

function AdminLayoutView({ onNavigate, onSaved }: { onNavigate: Navigate; onSaved: FlashSetter }) {
  const [layout, setLayout] = useState(getAdminLayout)

  function updateCard(id: string, updates: Partial<AdminCardConfig>) {
    setLayout((current) => ({
      ...current,
      cards: current.cards.map((card) => (card.id === id ? { ...card, ...updates } : card)),
    }))
  }

  function moveCard(id: string, direction: -1 | 1) {
    setLayout((current) => ({
      ...current,
      cards: current.cards.map((card) =>
        card.id === id ? { ...card, order: card.order + direction } : card,
      ),
    }))
  }

  function save() {
    updateAdminLayout(layout)
    onSaved('Cockpit admin enregistré localement')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Personnaliser l’admin</h1>
        <p className="subtitle">Cartes, raccourcis et textes du cockpit.</p>
      </div>
      <article className="edit-panel form-grid">
        <TextField label="Titre du cockpit" value={layout.title} onChange={(value) => setLayout((current) => ({ ...current, title: value }))} />
        <TextField label="Sous-titre" value={layout.subtitle} onChange={(value) => setLayout((current) => ({ ...current, subtitle: value }))} />
        <SelectField label="Style" value={layout.style} options={['compact', 'confortable', 'premium']} onChange={(value) => setLayout((current) => ({ ...current, style: value as typeof layout.style }))} />
      </article>
      <div className="list-grid">
        {[...layout.cards].sort((a, b) => a.order - b.order).map((card) => (
          <article className="list-card" key={card.id}>
            <div>
              <p className="eyebrow">{card.visible ? 'visible' : 'masquée'} · {card.section}</p>
              <TextField label="Titre" value={card.title} onChange={(value) => updateCard(card.id, { title: value })} />
              <TextField label="Texte" value={card.text} onChange={(value) => updateCard(card.id, { text: value })} />
              <TextField label="Destination" value={card.route} onChange={(value) => updateCard(card.id, { route: value })} />
            </div>
            <div className="inline-actions">
              <button className="secondary-button compact" type="button" onClick={() => updateCard(card.id, { visible: !card.visible })}>
                {card.visible ? 'Désactiver' : 'Activer'}
              </button>
              <button className="secondary-button compact" type="button" onClick={() => moveCard(card.id, -1)}>
                Monter
              </button>
              <button className="secondary-button compact" type="button" onClick={() => moveCard(card.id, 1)}>
                Descendre
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="actions">
        <button className="primary-button" type="button" onClick={save}>
          Enregistrer
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/admin')}>
          Retour admin
        </button>
      </div>
    </section>
  )
}

function AdminAssistantView({ onNavigate, onSaved }: { onNavigate: Navigate; onSaved: FlashSetter }) {
  const [prompt, setPrompt] = useState('Ajoute une carte Pages dans mon admin')
  const [proposal, setProposal] = useState('')

  function simulate() {
    setProposal(`Action proposée : ${prompt}. Cette modification sera appliquée localement sans API externe.`)
  }

  function apply() {
    if (prompt.toLowerCase().includes('page')) {
      createGlobalPage({
        title: 'Page créée par assistant',
        slug: 'page-assistant',
        placement: 'admin',
        content: 'Page simulée depuis l’assistant IA local.',
        status: 'publié',
        ctaLabel: 'Retour admin',
        ctaDestination: '/admin',
      })
      onSaved('Page créée localement par l’assistant')
      return
    }
    if (prompt.toLowerCase().includes('bouton')) {
      createGlobalButton({
        label: 'Signature Immobilier',
        placement: 'admin',
        destination: '/demo/immobilier',
        style: 'secondaire',
        status: 'actif',
      })
      onSaved('Bouton ajouté localement par l’assistant')
      return
    }
    onSaved('Modification simulée appliquée localement')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Assistant IA</h1>
        <p className="subtitle">Décrivez une modification. Le système simule une action locale.</p>
      </div>
      <article className="edit-panel">
        <TextAreaField label="Décris ce que tu veux modifier" value={prompt} onChange={setPrompt} />
        <button className="primary-button compact" type="button" onClick={simulate}>
          Simuler
        </button>
        {proposal && <p className="save-message">{proposal}</p>}
      </article>
      <div className="actions">
        <button className="primary-button" type="button" onClick={apply}>
          Appliquer
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/admin')}>
          Retour admin
        </button>
      </div>
    </section>
  )
}

function AdminPreviewView({ onNavigate }: { onNavigate: Navigate }) {
  const items = ['accueil configurable', 'admin configurable', 'agences', 'Signature Immobilier', 'pages globales', 'boutons globaux', 'modules', 'templates secteurs']
  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Prévisualisation globale</h1>
        <p className="subtitle">Checklist du cockpit local.</p>
      </div>
      <div className="card-grid">
        {items.map((item) => <InfoBlock key={item} title={item} text="Prêt à tester localement." />)}
      </div>
      <div className="actions">
        <button className="secondary-button" type="button" onClick={() => onNavigate('/')}>Accueil</button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/admin')}>Admin</button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier')}>Signature Immobilier</button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/admin/agences')}>Agences</button>
      </div>
    </section>
  )
}

function AdminSystemView({ onNavigate }: { onNavigate: Navigate }) {
  const statuses = getBranchableStatuses()
  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Réglages intégrés</h1>
        <p className="subtitle">Ces réglages sont maintenant directement intégrés dans l’admin principal.</p>
      </div>
      <div className="list-grid">
        {statuses.map(([id, label, status]) => (
          <InfoBlock key={id} title={label} text={status} />
        ))}
      </div>
      <button className="primary-button" type="button" onClick={() => onNavigate('/admin')}>
        Retour admin
      </button>
    </section>
  )
}

function AgenciesView({
  agencies,
  onNavigate,
  onReset,
}: {
  agencies: Agency[]
  onNavigate: Navigate
  onReset: FlashSetter
}) {
  function resetData() {
    resetDemoData()
    onReset('Données locales réinitialisées.')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Agences</h1>
        <p className="subtitle">Créez et ouvrez les espaces générés localement.</p>
      </div>

      <div className="actions">
        <button className="primary-button" type="button" onClick={() => onNavigate('/admin/agences/new')}>
          Créer une agence
        </button>
        <button className="secondary-button" type="button" onClick={resetData}>
          Réinitialiser les données démo
        </button>
      </div>

      <div className="list-grid">
        {agencies.length === 0 && (
          <article className="info-card">
            <h2>Aucune agence créée</h2>
            <p>Créez une agence immobilière pour générer ses espaces patron, agent et vendeur.</p>
          </article>
        )}

        {agencies.map((agency) => (
          <article className="list-card" key={agency.id}>
            <div>
              <p className="eyebrow">{agency.sector}</p>
              <h2>{agency.name}</h2>
              <p>{agency.city} · {agency.status}</p>
            </div>
            <div className="inline-actions">
              <button className="primary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}`)}>
                Gérer
              </button>
              <button
                className="secondary-button compact"
                type="button"
                onClick={() => onNavigate(`/admin/agences/${agency.id}/demo`)}
              >
                Ouvrir démo
              </button>
              <button
                className="secondary-button compact"
                type="button"
                onClick={() => onNavigate(`/demo/immobilier/agence/${agency.id}/public`)}
              >
                Site public
              </button>
              <button
                className="secondary-button compact"
                type="button"
                onClick={() => onNavigate(`/demo/immobilier/agence/${agency.id}/patron`)}
              >
                Patron
              </button>
              <button
                className="secondary-button compact"
                type="button"
                onClick={() => onNavigate(`/demo/immobilier/agence/${agency.id}/agent`)}
              >
                Agent
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function NewAgencyView({ onNavigate, onCreated }: { onNavigate: Navigate; onCreated: FlashSetter }) {
  const [mode, setMode] = useState<'manual' | 'ai'>('manual')
  const [form, setForm] = useState({
    name: 'Signature Immobilier',
    sector: 'Immobilier',
    city: 'Tarbes',
    currentSite: 'https://example.com',
    phone: '05 62 00 00 00',
    email: 'contact@signature.test',
    primary: 'bleu nuit',
    secondary: 'crème',
    accent: 'doré doux',
    ownerName: 'Camille Patron',
    ownerEmail: 'camille@signature.test',
    agentName: 'Alex Agent',
    agentEmail: 'alex@signature.test',
  })
  const [analysisInput, setAnalysisInput] = useState({
    siteUrl: 'https://signature-immobilier.example',
    sector: 'Immobilier',
    city: 'Tarbes',
  })
  const [analysis, setAnalysis] = useState<AgencyAnalysis | null>(null)
  const [detailMode, setDetailMode] = useState<'simple' | 'advanced'>('simple')

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const input = {
      name: form.name,
      sector: form.sector,
      city: form.city,
      currentSite: form.currentSite,
      phone: form.phone,
      email: form.email,
      colors: {
        primary: form.primary,
        secondary: form.secondary,
        accent: form.accent,
      },
      ownerName: form.ownerName,
      ownerEmail: form.ownerEmail,
      agentName: form.agentName,
      agentEmail: form.agentEmail,
    }
    const agency = analysis ? createAgencyFromAnalysis(input, analysis) : createAgency(input)

    onCreated('Agence créée localement.')
    onNavigate(`/admin/agences/${agency.id}`)
  }

  function runAnalysis() {
    const hostname = analysisInput.siteUrl
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
    const agencyName = hostname
      .split('.')[0]
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')

    setAnalysis({
      siteUrl: analysisInput.siteUrl,
      detectedName: agencyName || 'Agence Immobilière Locale',
      logoUrl: 'https://placehold.co/320x140/0d1f36/fbf3e6?text=Logo',
      colors: {
        primary: 'bleu nuit',
        secondary: 'crème',
        accent: 'doré doux',
      },
      mood: 'Premium sobre',
      tone: 'rassurant, local et expert',
      promise: 'Vendez votre bien avec un suivi clair à chaque étape.',
      detectedListings: ['Appartement lumineux à Tarbes', 'Maison familiale avec jardin'],
      weaknesses: ['Peu de suivi vendeur visible', 'Formulaires peu rassurants', 'Annonces peu premium'],
      premiumSuggestion: 'Mettre en avant le suivi vendeur, les comptes rendus et les documents accessibles.',
      confidenceScore: '87%',
      recommendations: ['Créer un espace vendeur', 'Clarifier les appels à action', 'Uniformiser les couleurs'],
    })
  }

  function applyAnalysis() {
    if (!analysis) return
    setForm((current) => ({
      ...current,
      name: analysis.detectedName,
      sector: analysisInput.sector,
      city: analysisInput.city,
      currentSite: analysis.siteUrl,
      primary: analysis.colors.primary,
      secondary: analysis.colors.secondary,
      accent: analysis.colors.accent,
    }))
    setMode('manual')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Créer une agence</h1>
        <p className="subtitle">Le Studio crée automatiquement les accès patron, agent et vendeur.</p>
      </div>

      <div className="filter-row">
        <button className={mode === 'manual' ? 'active' : ''} type="button" onClick={() => setMode('manual')}>
          Créer manuellement
        </button>
        <button className={mode === 'ai' ? 'active' : ''} type="button" onClick={() => setMode('ai')}>
          Créer avec l’IA
        </button>
      </div>

      <div className="filter-row">
        <button className={detailMode === 'simple' ? 'active' : ''} type="button" onClick={() => setDetailMode('simple')}>
          Mode simple
        </button>
        <button className={detailMode === 'advanced' ? 'active' : ''} type="button" onClick={() => setDetailMode('advanced')}>
          Mode avance
        </button>
      </div>

      <div className="journey-map">
        {['Agence', 'IA simulee', 'Apparence', 'Equipe', 'Créer'].map((step, index) => (
          <span key={step}>{index + 1}. {step}</span>
        ))}
      </div>

      {mode === 'ai' && (
        <section className="edit-panel">
          <h2>Analyse IA simulée</h2>
          <TextField label="URL du site actuel" value={analysisInput.siteUrl} onChange={(value) => setAnalysisInput((current) => ({ ...current, siteUrl: value }))} />
          <TextField label="Secteur" value={analysisInput.sector} onChange={(value) => setAnalysisInput((current) => ({ ...current, sector: value }))} />
          <TextField label="Ville" value={analysisInput.city} onChange={(value) => setAnalysisInput((current) => ({ ...current, city: value }))} />
          <button className="primary-button compact" type="button" onClick={runAnalysis}>
            Analyser le site
          </button>
          {analysis && (
            <article className="demo-panel">
              <p className="eyebrow">Analyse détectée</p>
              <h2>{analysis.detectedName}</h2>
              <p>{analysis.promise}</p>
              <div className="document-list">
                <span>{analysis.colors.primary}</span>
                <span>{analysis.colors.secondary}</span>
                <span>{analysis.colors.accent}</span>
                <span>{analysis.confidenceScore}</span>
              </div>
              <p>{analysis.premiumSuggestion}</p>
              <div className="inline-actions">
                <button className="secondary-button compact" type="button" onClick={applyAnalysis}>
                  Appliquer cette analyse
                </button>
                <button className="secondary-button compact" type="button" onClick={() => setMode('manual')}>
                  Modifier avant cr?ation
                </button>
              </div>
            </article>
          )}
        </section>
      )}

      <form className={`edit-panel form-grid creation-form ${detailMode === 'simple' ? 'simple-mode' : 'advanced-mode'}`} onSubmit={submit}>
        <div className="form-section-title">
          <p className="eyebrow">Etape 1</p>
          <h2>Agence</h2>
          <p>Rien n’est publie tant que tu ne valides pas.</p>
        </div>
        <TextField label="Nom de l’agence" value={form.name} onChange={(value) => updateField('name', value)} />
        <TextField label="Secteur" value={form.sector} onChange={(value) => updateField('sector', value)} />
        <TextField label="Ville" value={form.city} onChange={(value) => updateField('city', value)} />
        <TextField label="Site actuel" value={form.currentSite} onChange={(value) => updateField('currentSite', value)} />
        <div className="form-section-title advanced-only">
          <p className="eyebrow">Etape 3</p>
          <h2>Apparence</h2>
          <p>Vous pourrez modifier ca plus tard.</p>
        </div>
        <TextField label="Téléphone" value={form.phone} onChange={(value) => updateField('phone', value)} />
        <TextField label="Email" value={form.email} onChange={(value) => updateField('email', value)} />
        <TextField label="Couleur principale" value={form.primary} onChange={(value) => updateField('primary', value)} />
        <TextField label="Couleur secondaire" value={form.secondary} onChange={(value) => updateField('secondary', value)} />
        <TextField label="Couleur accent" value={form.accent} onChange={(value) => updateField('accent', value)} />
        <div className="form-section-title advanced-only">
          <p className="eyebrow">Etape 4</p>
          <h2>Equipe</h2>
          <p>Cette etape cree automatiquement les espaces patron, agent et vendeur.</p>
        </div>
        <TextField label="Nom du patron" value={form.ownerName} onChange={(value) => updateField('ownerName', value)} />
        <TextField label="Email patron" value={form.ownerEmail} onChange={(value) => updateField('ownerEmail', value)} />
        <TextField label="Nom agent" value={form.agentName} onChange={(value) => updateField('agentName', value)} />
        <TextField label="Email agent" value={form.agentEmail} onChange={(value) => updateField('agentEmail', value)} />

        <div className="actions form-actions">
          <div className="form-section-title">
            <p className="eyebrow">Etape 5</p>
            <h2>Créer</h2>
            <p>{form.name} · {form.city} · {form.sector}</p>
          </div>
          <button className="primary-button" type="submit">
            Créer l’agence
          </button>
          <button className="secondary-button" type="button" onClick={() => onNavigate('/admin/agences')}>
            Annuler
          </button>
        </div>
      </form>
    </section>
  )
}

function AgencyDetailView({
  agencyId,
  onNavigate,
  setFlash,
}: {
  agencyId: string
  onNavigate: Navigate
  setFlash: FlashSetter
}) {
  const state = getLocalState()
  const agency = state.agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />

  const users = getAgencyUsers(agency.id)
  const properties = getAgencyProperties(agency.id)
  const pages = getAgencyPages(agency.id)
  const buttons = getAgencyButtons(agency.id)
  const activeModules = Object.values(agency.modules ?? {}).filter(Boolean).length
  const firstProperty = properties[0]
  const owner = users.find((user) => user.role === 'patron')
  const agent = users.find((user) => user.role === 'agent')
  const nextAction = !firstProperty
    ? {
        label: 'Créer une annonce',
        text: 'Ajoute le premier bien pour activer le parcours vendeur.',
        route: `/admin/agences/${agency.id}/annonces/new`,
      }
    : !agency.appearance?.heroImageUrl
      ? {
          label: 'Personnaliser apparence',
          text: 'Ajoute une image ou ajuste les couleurs avant audit.',
          route: `/admin/agences/${agency.id}/apparence`,
        }
      : {
          label: 'Voir la démo complète',
          text: 'Tout est prêt pour parcourir les espaces.',
          route: `/admin/agences/${agency.id}/demo`,
        }

  return (
    <section className="page-view agency-command">
      <div className="calm-heading">
        <button className="secondary-button compact" type="button" onClick={() => onNavigate('/admin/agences')}>
          Retour
        </button>
        <p className="eyebrow">{agency.city} · {agency.sector}</p>
        <h1>{agency.name}</h1>
        <p className="subtitle">{agency.status}</p>
      </div>

      <article className="guided-card recommended-card">
        <div>
          <p className="eyebrow">Prochaine action recommandee</p>
          <h2>{nextAction.label}</h2>
          <p>{nextAction.text}</p>
          <p className="microcopy">Modification locale uniquement.</p>
        </div>
        <button className="primary-button compact" type="button" onClick={() => onNavigate(nextAction.route)}>
          Continuer
        </button>
      </article>

      <section className="calm-section">
        <p className="eyebrow">Parcours agence</p>
        <div className="step-cards">
          <article className="quiet-card">
            <span className="step-number">1</span>
            <h2>Identite</h2>
            <p>Nom, secteur, site actuel, coordonnees.</p>
            <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/analyse`)}>
              Modifier
            </button>
          </article>
          <article className="quiet-card">
            <span className="step-number">2</span>
            <h2>Apparence</h2>
            <p>Logo, couleurs, ambiance.</p>
            <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/apparence`)}>
              Modifier
            </button>
          </article>
          <article className="quiet-card">
            <span className="step-number">3</span>
            <h2>Annonces</h2>
            <p>Biens, descriptions, photos, visites.</p>
            <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/annonces`)}>
              Gerer
            </button>
          </article>
          <article className="quiet-card">
            <span className="step-number">4</span>
            <h2>Espaces</h2>
            <p>Public, patron, agent, vendeur.</p>
            <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/demo`)}>
              Ouvrir
            </button>
          </article>
        </div>
      </section>



      <section className="calm-section">
        <p className="eyebrow">Activation</p>
        <div className="step-cards">
          {[
            ['Équipe', 'Patron, agents et vendeurs liés.', `/admin/agences/${agency.id}/equipe`],
            ['Invitations', 'Liens patron, agent et vendeur simulés.', `/admin/agences/${agency.id}/invitations`],
            ['Accès', 'Tokens, liens publics et espaces générés.', `/admin/agences/${agency.id}/acces`],
            ['Emails', 'Prévisualisation et envoi simulé.', `/admin/agences/${agency.id}/emails`],
            ['Paiement', 'Lien de paiement prêt à connecter.', `/admin/agences/${agency.id}/paiement`],
            ['Suivi', 'Mises à jour visibles côté vendeur.', `/admin/agences/${agency.id}/suivi`],
          ].map(([title, text, nextRoute]) => (
            <article className="quiet-card" key={title}>
              <h2>{title}</h2>
              <p>{text}</p>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(nextRoute)}>
                Ouvrir
              </button>
            </article>
          ))}
        </div>
      </section>

      <article className="guided-card compact-guided">
        <div>
          <p className="eyebrow">Voir le rendu</p>
          <h2>Liens rapides</h2>
        </div>
        <div className="inline-actions">
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agency.id}/public`)}>
            Site public
          </button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agency.id}/agent`)}>
            Agent
          </button>
          <button
            className="secondary-button compact"
            type="button"
            onClick={() =>
              firstProperty
                ? onNavigate(`/demo/immobilier/agence/${agency.id}/vendeur/${firstProperty.id}`)
                : setFlash('Creez une annonce pour generer un espace vendeur.')
            }
          >
            Vendeur
          </button>
        </div>
      </article>

      <details className="advanced-box">
        <summary>Personnalisation avancee</summary>
        <div className="advanced-links">
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/equipe`)}>Équipe</button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/invitations`)}>Invitations</button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/emails`)}>Emails</button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/paiement`)}>Paiement</button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/suivi`)}>Suivi</button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/pages`)}>Pages</button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/buttons`)}>Boutons</button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/modules`)}>Modules</button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/analyse`)}>Analyse</button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/export`)}>Export</button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/acces`)}>Acces</button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/ambiance`)}>Ambiance</button>
        </div>
      </details>

      <details className="advanced-box">
        <summary>Danger</summary>
        <div className="advanced-links">
          <button className="secondary-button compact danger-button" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/danger`)}>
            Ouvrir danger zone
          </button>
        </div>
      </details>

      <div className="page-heading">
        <h1>{agency.name}</h1>
        <p className="subtitle">Fiche agence locale</p>
      </div>

      <div className="card-grid">
        <InfoBlock title="Résumé agence" text={`${agency.sector} · ${agency.city} · ${agency.status}`} />
        <InfoBlock title="Apparence" text={`${agency.colors.primary} · ${agency.colors.secondary} · ${agency.colors.accent}`} />
        <InfoBlock title="Accès" text={`Patron : ${owner?.name ?? 'À compléter'} · Agent : ${agent?.name ?? 'À compléter'}`} />
        <InfoBlock title="Espaces créés" text={firstProperty ? 'Public, patron, agent et vendeur actifs.' : 'Public, patron et agent prêts. Vendeur vide.'} />
        <InfoBlock title="Pages personnalisées" text={`${pages.length} page${pages.length > 1 ? 's' : ''}`} />
        <InfoBlock title="Boutons personnalisés" text={`${buttons.length} bouton${buttons.length > 1 ? 's' : ''}`} />
        <InfoBlock title="Modules actifs" text={`${activeModules} module${activeModules > 1 ? 's' : ''} activé${activeModules > 1 ? 's' : ''}`} />
      </div>

      <article className="demo-panel">
        <p className="eyebrow">Liens rapides</p>
        <div className="inline-actions">
          <button className="primary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agency.id}/public`)}>
            Voir site public
          </button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agency.id}/patron`)}>
            Ouvrir espace patron
          </button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agency.id}/agent`)}>
            Ouvrir espace agent
          </button>
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/annonces`)}>
            Voir les annonces
          </button>
          <button
            className="secondary-button compact"
            type="button"
            onClick={() =>
              firstProperty
                ? onNavigate(`/demo/immobilier/agence/${agency.id}/vendeur/${firstProperty.id}`)
                : setFlash('Créez une annonce pour générer un espace vendeur.')
            }
          >
            Ouvrir espace vendeur
          </button>
        </div>
      </article>

      <section className="agency-panel">
        <div>
          <p className="eyebrow">Annonces</p>
          <h2>{properties.length} annonce{properties.length > 1 ? 's' : ''}</h2>
          <p>Créez une annonce pour alimenter le site public et l’espace vendeur.</p>
        </div>
        <button className="primary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/annonces/new`)}>
          Créer une annonce
        </button>
      </section>
      <CustomButtons agencyId={agency.id} placement="fiche agence" onNavigate={onNavigate} />

      <div className="list-grid">
        {properties.map((property) => (
          <article className="list-card" key={property.id}>
            <div>
              <p className="eyebrow">{property.status}</p>
              <h2>{property.title}</h2>
              <p>{property.city} · {property.price} · {property.surface}</p>
            </div>
            <div className="inline-actions">
              <button className="primary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/annonces/${property.id}`)}>
                Gérer
              </button>
              <button
                className="secondary-button compact"
                type="button"
                onClick={() => onNavigate(`/demo/immobilier/agence/${agency.id}/vendeur/${property.id}`)}
              >
                Vendeur
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="actions">
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/analyse`)}>
          Analyser / modifier analyse
        </button>
        <button className="primary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/annonces/new`)}>
          Créer une annonce
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/apparence`)}>
          Modifier apparence
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/ambiance`)}>
          Modifier ambiance
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/acces`)}>
          Voir les accès
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/annonces`)}>
          Voir les annonces
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/pages`)}>
          Créer une page
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/buttons`)}>
          Créer un bouton
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/modules`)}>
          Modules
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/demo`)}>
          Prévisualiser tout
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agency.id}/export`)}>
          Exporter démo
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/admin/agences')}>
          Retour aux agences
        </button>
      </div>
    </section>
  )
}

function AgencyAppearanceView({
  agencyId,
  onNavigate,
  onSaved,
}: {
  agencyId: string
  onNavigate: Navigate
  onSaved: FlashSetter
}) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  const [form, setForm] = useState({
    logoText: agency?.appearance?.logoText ?? agency?.name ?? '',
    primary: agency?.colors.primary ?? 'bleu nuit',
    secondary: agency?.colors.secondary ?? 'crème',
    accent: agency?.colors.accent ?? 'doré doux',
    heroImageUrl: agency?.appearance?.heroImageUrl ?? '',
    backgroundColor: agency?.appearance?.backgroundColor ?? 'crème',
    textColor: agency?.appearance?.textColor ?? 'bleu nuit',
    buttonStyle: agency?.appearance?.buttonStyle ?? 'premium',
    fontStyle: agency?.appearance?.fontStyle ?? 'moderne',
  })
  const [detailMode, setDetailMode] = useState<'simple' | 'advanced'>('simple')
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function saveAppearance(event: FormEvent) {
    event.preventDefault()
    updateAgency(agencyId, {
      colors: {
        primary: form.primary,
        secondary: form.secondary,
        accent: form.accent,
      },
      appearance: {
        logoText: form.logoText,
        heroImageUrl: form.heroImageUrl,
        visualStyle: form.buttonStyle,
        backgroundColor: form.backgroundColor,
        textColor: form.textColor,
        buttonStyle: form.buttonStyle,
        fontStyle: form.fontStyle,
      },
    })
    onSaved('Apparence enregistrée localement')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Modifier apparence</h1>
        <p className="subtitle">{agency.name}</p>
      </div>
      <div className="filter-row">
        <button className={detailMode === 'simple' ? 'active' : ''} type="button" onClick={() => setDetailMode('simple')}>
          Mode simple
        </button>
        <button className={detailMode === 'advanced' ? 'active' : ''} type="button" onClick={() => setDetailMode('advanced')}>
          Mode avance
        </button>
      </div>
      <form className={`edit-panel form-grid appearance-form ${detailMode === 'simple' ? 'simple-mode' : 'advanced-mode'}`} onSubmit={saveAppearance}>
        <div className="form-section-title">
          <p className="eyebrow">Essentiel</p>
          <h2>Identite visuelle</h2>
          <p>Vous pourrez modifier ca plus tard.</p>
        </div>
        <TextField label="Logo URL ou texte" value={form.logoText} onChange={(value) => updateField('logoText', value)} />
        <TextField label="Couleur principale" value={form.primary} onChange={(value) => updateField('primary', value)} />
        <TextField label="Couleur secondaire" value={form.secondary} onChange={(value) => updateField('secondary', value)} />
        <TextField label="Couleur accent" value={form.accent} onChange={(value) => updateField('accent', value)} />
        <TextField label="Image principale" value={form.heroImageUrl} onChange={(value) => updateField('heroImageUrl', value)} />
        <TextField label="Couleur fond" value={form.backgroundColor} onChange={(value) => updateField('backgroundColor', value)} />
        <TextField label="Couleur texte" value={form.textColor} onChange={(value) => updateField('textColor', value)} />
        <SelectField
          label="Style de boutons"
          value={form.buttonStyle}
          options={['arrondi', 'carré doux', 'premium']}
          onChange={(value) => updateField('buttonStyle', value)}
        />
        <SelectField
          label="Police simulée"
          value={form.fontStyle}
          options={['classique', 'moderne', 'luxe', 'institutionnelle']}
          onChange={(value) => updateField('fontStyle', value)}
        />
        <button className="primary-button" type="submit">
          Enregistrer
        </button>
      </form>
      <div className="actions">
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/public`)}>
          Prévisualiser site public
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
          Retour agence
        </button>
      </div>
    </section>
  )
}

function AgencyAccessView({
  agencyId,
  onNavigate,
  setFlash,
}: {
  agencyId: string
  onNavigate: Navigate
  setFlash: FlashSetter
}) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  const firstProperty = getAgencyProperties(agencyId)[0]
  const tokens = getAgencyAccessTokens(agencyId)
  const invitations = getAgencyInvitations(agencyId)
  const links = [
    { label: 'Lien public', route: `/demo/immobilier/agence/${agencyId}/public` },
    { label: 'Lien patron', route: `/demo/immobilier/agence/${agencyId}/patron` },
    { label: 'Lien agent', route: `/demo/immobilier/agence/${agencyId}/agent` },
    {
      label: 'Lien vendeur',
      route: firstProperty
        ? `/demo/immobilier/agence/${agencyId}/vendeur/${firstProperty.id}`
        : `/admin/agences/${agencyId}/annonces/new`,
    },
  ]

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Accès</h1>
        <p className="subtitle">{agency.name}</p>
      </div>
      <div className="list-grid">
        {links.map((link) => (
          <article className="list-card" key={link.label}>
            <div>
              <p className="eyebrow">{link.label}</p>
              <h2>{link.route}</h2>
            </div>
            <div className="inline-actions">
              <button className="secondary-button compact" type="button" onClick={() => copyLocalText(`${window.location.origin}${link.route}`, setFlash, 'Lien copié')}>
                Copier
              </button>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(link.route)}>
                Ouvrir
              </button>
            </div>
          </article>
        ))}
        {tokens.map((token) => (
          <article className="list-card" key={token.id}>
            <div>
              <p className="eyebrow">Token simulé · {token.status}</p>
              <h2>{token.type}</h2>
              <p>/access/{token.token}</p>
            </div>
            <div className="inline-actions">
              <button className="secondary-button compact" type="button" onClick={() => copyLocalText(`${window.location.origin}/access/${token.token}`, setFlash, 'Token copié')}>
                Copier lien
              </button>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/access/${token.token}`)}>
                Ouvrir lien
              </button>
              <button className="secondary-button compact" type="button" onClick={() => { updateAccessToken(token.id, 'revoked'); setFlash('Accès révoqué localement') }}>
                Révoquer accès
              </button>
            </div>
          </article>
        ))}
        {invitations.map((invitation) => (
          <InfoBlock key={invitation.id} title={`Invitation ${invitation.type}`} text={`${invitation.email} · ${invitation.status}`} />
        ))}
      </div>
      <div className="actions">
        <button className="primary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}/invitations`)}>
          Gérer invitations
        </button>
        <button className="secondary-button" type="button" onClick={() => { createAccessToken({ agencyId, type: 'agent', targetUrl: `/demo/immobilier/agence/${agencyId}/agent` }); setFlash('Accès régénéré localement') }}>
          Régénérer accès agent
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
          Retour agence
        </button>
      </div>
    </section>
  )
}

function AgencyTeamView({ agencyId, onNavigate, onSaved }: { agencyId: string; onNavigate: Navigate; onSaved: FlashSetter }) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  const properties = getAgencyProperties(agencyId)
  const members = getAgencyTeamMembers(agencyId)
  const [form, setForm] = useState({ name: '', email: '', type: 'agent' as InvitationRole, propertyId: properties[0]?.id ?? '' })

  function submit(event: FormEvent) {
    event.preventDefault()
    addTeamMember({ agencyId, name: form.name || 'Membre local', email: form.email || 'local@signature.test', type: form.type, propertyId: form.type === 'vendeur' ? form.propertyId : undefined })
    onSaved(`${form.type} ajouté localement`)
  }

  function remove(member: TeamMember) {
    const warning = member.type === 'patron' ? 'Cette agence n’aura plus de patron assigné. Continuer ?' : `Retirer ${member.name} ?`
    if (!window.confirm(warning)) return
    removeTeamMember(member.id)
    onSaved(`${member.type} retiré localement`)
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Équipe</h1>
        <p className="subtitle">{agency.name} · Fonctionnel localement</p>
      </div>
      <form className="edit-panel form-grid" onSubmit={submit}>
        <TextField label="Nom" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
        <TextField label="Email" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} />
        <SelectField label="Rôle" value={form.type} options={['patron', 'agent', 'vendeur']} onChange={(value) => setForm((current) => ({ ...current, type: value as InvitationRole }))} />
        <SelectField label="Annonce vendeur" value={form.propertyId} options={properties.map((property) => property.id)} onChange={(value) => setForm((current) => ({ ...current, propertyId: value }))} />
        <button className="primary-button" type="submit">Ajouter {form.type}</button>
      </form>
      <div className="list-grid">
        {members.map((member) => (
          <article className="list-card" key={member.id}>
            <div>
              <p className="eyebrow">{member.type} · {member.status}</p>
              <h2>{member.name}</h2>
              <p>{member.email}</p>
            </div>
            <button className="secondary-button compact" type="button" onClick={() => remove(member)}>
              Retirer {member.type}
            </button>
          </article>
        ))}
      </div>
      <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>Retour agence</button>
    </section>
  )
}

function AgencyInvitationsView({ agencyId, onNavigate, onSaved, setFlash }: { agencyId: string; onNavigate: Navigate; onSaved: FlashSetter; setFlash: FlashSetter }) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  const properties = getAgencyProperties(agencyId)
  const invitations = getAgencyInvitations(agencyId)
  const [forms, setForms] = useState<Record<InvitationRole, { name: string; email: string; propertyId: string }>>({
    patron: { name: agency.ownerName, email: agency.ownerEmail, propertyId: '' },
    agent: { name: agency.agentName, email: agency.agentEmail, propertyId: '' },
    vendeur: { name: 'Vendeur', email: 'vendeur@signature.test', propertyId: properties[0]?.id ?? '' },
  })

  function update(role: InvitationRole, key: 'name' | 'email' | 'propertyId', value: string) {
    setForms((current) => ({ ...current, [role]: { ...current[role], [key]: value } }))
  }

  function create(role: InvitationRole) {
    generateInvitation({ agencyId, type: role, name: forms[role].name, email: forms[role].email, propertyId: role === 'vendeur' ? forms[role].propertyId : undefined })
    onSaved(`Invitation ${role} générée localement`)
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Invitations</h1>
        <p className="subtitle">Emails simulés · aucun envoi réel</p>
      </div>
      <div className="list-grid">
        {(['patron', 'agent', 'vendeur'] as InvitationRole[]).map((role) => {
          const latest = [...invitations].reverse().find((item) => item.type === role)
          return (
            <article className="list-card" key={role}>
              <div>
                <p className="eyebrow">{role} · {latest?.status ?? 'draft'}</p>
                <h2>Invitation {role}</h2>
                <TextField label="Nom" value={forms[role].name} onChange={(value) => update(role, 'name', value)} />
                <TextField label="Email" value={forms[role].email} onChange={(value) => update(role, 'email', value)} />
                {role === 'vendeur' && <SelectField label="Annonce" value={forms[role].propertyId} options={properties.map((property) => property.id)} onChange={(value) => update(role, 'propertyId', value)} />}
                {latest && <p>{latest.emailPreview}</p>}
              </div>
              <div className="inline-actions">
                <button className="primary-button compact" type="button" onClick={() => create(role)}>Générer invitation</button>
                <button className="secondary-button compact" type="button" onClick={() => setFlash(latest?.emailPreview ?? 'Prévisualisation prête à générer')}>Prévisualiser email</button>
                <button className="secondary-button compact" type="button" onClick={() => latest && (copyLocalText(`${window.location.origin}${latest.targetUrl}`, setFlash, 'Lien copié'), updateInvitationStatus(latest.id, 'copied'))}>Copier lien</button>
                <button className="secondary-button compact" type="button" onClick={() => latest && (updateInvitationStatus(latest.id, 'revoked'), onSaved('Invitation révoquée localement'))}>Révoquer</button>
              </div>
            </article>
          )
        })}
      </div>
      <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>Retour agence</button>
    </section>
  )
}

function AgencyEmailsView({ agencyId, onNavigate, onSaved, setFlash }: { agencyId: string; onNavigate: Navigate; onSaved: FlashSetter; setFlash: FlashSetter }) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  const emails = getAgencySimulatedEmails(agencyId)
  const templates = emails.length > 0 ? emails : (['patron', 'agent', 'vendeur'] as InvitationRole[]).map((role) => ({
    id: `template-${role}`,
    agencyId,
    type: role,
    status: 'draft' as const,
    subject: `Votre accès ${agency.name}`,
    body: `Bonjour, votre accès ${role} sera généré depuis la page invitations.`,
    accessUrl: `${window.location.origin}/admin/agences/${agencyId}/invitations`,
    createdAt: '',
    updatedAt: '',
  }))

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Emails simulés</h1>
        <p className="subtitle">Aucun email réel n’est envoyé · {branchableBadge}</p>
      </div>
      <div className="list-grid">
        {templates.map((email) => (
          <article className="list-card" key={email.id}>
            <div>
              <p className="eyebrow">{email.type} · {email.status}</p>
              <h2>{email.subject}</h2>
              <p>{email.body}</p>
              <p>{email.accessUrl}</p>
            </div>
            <div className="inline-actions">
              <button className="secondary-button compact" type="button" onClick={() => copyLocalText(`${email.subject}\n\n${email.body}`, setFlash, 'Email copié')}>Copier email</button>
              <button className="secondary-button compact" type="button" onClick={() => copyLocalText(email.accessUrl, setFlash, 'Lien copié')}>Copier lien</button>
              <button className="primary-button compact" type="button" onClick={() => email.id.startsWith('template-') ? setFlash('Générez d’abord une invitation') : (updateSimulatedEmailStatus(email.id, 'sent_simulated'), onSaved('Envoi simulé enregistré'))}>Marquer envoyé simulé</button>
            </div>
          </article>
        ))}
      </div>
      <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>Retour agence</button>
    </section>
  )
}

function AgencyPaymentView({ agencyId, onNavigate, onSaved, setFlash }: { agencyId: string; onNavigate: Navigate; onSaved: FlashSetter; setFlash: FlashSetter }) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  const payment = getAgencyPaymentLink(agencyId)
  const paymentUrl = `${window.location.origin}/payment/${agencyId}`

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Paiement simulé</h1>
        <p className="subtitle">Pas de Stripe réel · {branchableBadge}</p>
      </div>
      <div className="card-grid">
        <InfoBlock title="Offre" text={payment.offerName} />
        <InfoBlock title="Installation" text={payment.setupPrice} />
        <InfoBlock title="Mensualité" text={payment.monthlyPrice} />
        <InfoBlock title="Statut" text={payment.status} />
      </div>
      <div className="actions">
        <button className="primary-button" type="button" onClick={() => { upsertPaymentLink(agencyId, 'link_ready'); onSaved('Lien paiement généré localement') }}>Générer lien paiement</button>
        <button className="secondary-button" type="button" onClick={() => copyLocalText(paymentUrl, setFlash, 'Lien paiement copié')}>Copier lien paiement</button>
        <button className="secondary-button" type="button" onClick={() => { upsertPaymentLink(agencyId, 'paid_simulated'); onSaved('Paiement marqué payé') }}>Marquer comme payé</button>
        <button className="secondary-button" type="button" onClick={() => { upsertPaymentLink(agencyId, 'cancelled_simulated'); onSaved('Paiement annulé localement') }}>Annuler paiement</button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/payment/${agencyId}`)}>Ouvrir page paiement</button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>Retour agence</button>
      </div>
    </section>
  )
}

function AgencyTrackingView({ agencyId, onNavigate, onSaved }: { agencyId: string; onNavigate: Navigate; onSaved: FlashSetter }) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  const properties = getAgencyProperties(agencyId)
  const activity = getAgencyActivity(agencyId)

  function addDocument(property: Property) {
    updateProperty(property.id, { visibleDocuments: [...property.visibleDocuments, 'Document ajouté localement'] })
    onSaved('Document ajouté au suivi vendeur')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Suivi vendeur</h1>
        <p className="subtitle">Agent met à jour · vendeur rassuré · patron garde le contrôle</p>
      </div>
      <div className="list-grid">
        {properties.map((property) => (
          <article className="list-card" key={property.id}>
            <div>
              <p className="eyebrow">Suivi vendeur actif · {property.status}</p>
              <h2>{property.title}</h2>
              <p>Étape actuelle : {property.currentStep}</p>
              <p>Prochaine visite : {property.nextVisit}</p>
              <p>Dernier compte rendu : {property.visitReport}</p>
              <p>Documents : {property.visibleDocuments.join(', ') || 'Aucun document visible'}</p>
              <p>Dernière mise à jour : {new Date(property.updatedAt).toLocaleDateString('fr-FR')}</p>
            </div>
            <div className="inline-actions">
              <button className="secondary-button compact" type="button" onClick={() => { const next = saleSteps[(saleSteps.indexOf(property.currentStep) + 1) % saleSteps.length]; updateProperty(property.id, { currentStep: next }); onSaved('Étape changée localement') }}>Changer étape</button>
              <button className="secondary-button compact" type="button" onClick={() => { updateProperty(property.id, { nextVisit: 'Samedi 22 juin à 14h30' }); onSaved('Visite programmée') }}>Programmer visite</button>
              <button className="secondary-button compact" type="button" onClick={() => { updateProperty(property.id, { visitReport: 'Compte rendu partagé au vendeur depuis le Studio Admin.' }); onSaved('Compte rendu ajouté') }}>Ajouter compte rendu</button>
              <button className="secondary-button compact" type="button" onClick={() => addDocument(property)}>Ajouter document</button>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/vendeur/${property.id}`)}>Ouvrir espace vendeur</button>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/agent`)}>Voir côté agent</button>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/patron`)}>Voir côté patron</button>
            </div>
          </article>
        ))}
      </div>
      {activity.slice(-3).map((entry) => <InfoBlock key={entry.id} title={entry.type} text={`${entry.label} · ${entry.status}`} />)}
      <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>Retour agence</button>
    </section>
  )
}

function AgencyDangerView({ agencyId, onNavigate, onSaved }: { agencyId: string; onNavigate: Navigate; onSaved: FlashSetter }) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  const properties = getAgencyProperties(agencyId)

  function confirmRun(message: string, action: () => void) {
    if (!window.confirm(message)) return
    action()
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Danger zone</h1>
        <p className="subtitle">Actions locales avec confirmation obligatoire</p>
      </div>
      <div className="list-grid">
        <InfoBlock title="Agence" text={`${agency.name} · ${agency.status}`} />
        <InfoBlock title="Annonces" text={`${properties.length} annonce(s) liées`} />
      </div>
      <div className="actions">
        <button className="secondary-button" type="button" onClick={() => confirmRun('Désactiver cette agence ?', () => { updateAgency(agencyId, { status: 'inactive' }); onSaved('Agence désactivée localement') })}>Désactiver agence</button>
        <button className="secondary-button" type="button" onClick={() => confirmRun('Réactiver cette agence ?', () => { updateAgency(agencyId, { status: 'Démo active' }); onSaved('Agence réactivée localement') })}>Réactiver agence</button>
        <button className="secondary-button" type="button" onClick={() => confirmRun('Supprimer toutes les annonces ?', () => { properties.forEach((property) => deleteProperty(property.id)); onSaved('Annonces supprimées localement') })}>Supprimer toutes les annonces</button>
        <button className="secondary-button" type="button" onClick={() => confirmRun('Réinitialiser la démo de cette agence ?', () => { resetAgencyDemo(agencyId); onSaved('Démo agence réinitialisée') })}>Réinitialiser démo de cette agence</button>
        <button className="secondary-button danger-button" type="button" onClick={() => confirmRun('Supprimer cette agence et ses données locales liées ?', () => { deleteAgency(agencyId); onNavigate('/admin/agences') })}>Supprimer agence</button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>Retour agence</button>
      </div>
    </section>
  )
}

function AccessTokenView({ token, onNavigate }: { token: string; onNavigate: Navigate }) {
  const { accessToken, invitation } = getAccessByToken(token)
  const item = accessToken ?? invitation
  const status = accessToken?.status ?? invitation?.status
  const isValid = Boolean(item && status !== 'revoked' && status !== 'expired')

  if (!isValid || !item) {
    return (
      <section className="page-view">
        <div className="page-heading">
          <h1>Lien invalide ou expiré</h1>
          <p className="subtitle">Aucune connexion réelle n’a été lancée.</p>
        </div>
        <div className="actions">
          <button className="primary-button" type="button" onClick={() => onNavigate('/')}>Retour accueil</button>
          <button className="secondary-button" type="button" onClick={() => onNavigate('/admin')}>Retour admin</button>
        </div>
      </section>
    )
  }

  const validInvitation = invitation!
  const targetUrl = accessToken ? accessToken.targetUrl : validInvitation.targetUrl
  const role = accessToken ? accessToken.type : validInvitation.type
  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Accès détecté</h1>
        <p className="subtitle">Rôle : {role} · simulation locale</p>
      </div>
      <InfoBlock title="Statut" text="Pas d’auth réelle. Fonction prête à connecter." />
      <button className="primary-button" type="button" onClick={() => onNavigate(targetUrl)}>Continuer vers mon espace</button>
    </section>
  )
}

function PaymentSimulationView({ agencyId, onNavigate }: { agencyId: string; onNavigate: Navigate }) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  const payment = getAgencyPaymentLink(agencyId)
  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Paiement simulé</h1>
        <p className="subtitle">{agency.name} · aucun Stripe réel</p>
      </div>
      <div className="card-grid">
        <InfoBlock title="Offre" text={payment.offerName} />
        <InfoBlock title="Installation" text={payment.setupPrice} />
        <InfoBlock title="Mensualité" text={payment.monthlyPrice} />
      </div>
      <div className="actions">
        <button className="primary-button" type="button" onClick={() => { upsertPaymentLink(agencyId, 'paid_simulated'); onNavigate(`/payment/${agencyId}/success`) }}>Payer maintenant</button>
        <button className="secondary-button" type="button" onClick={() => { upsertPaymentLink(agencyId, 'cancelled_simulated'); onNavigate(`/payment/${agencyId}/cancel`) }}>Annuler</button>
      </div>
    </section>
  )
}

function PaymentResultView({ agencyId, status, onNavigate }: { agencyId: string; status: 'success' | 'cancel'; onNavigate: Navigate }) {
  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>{status === 'success' ? 'Paiement simulé réussi' : 'Paiement simulé annulé'}</h1>
        <p className="subtitle">Statut enregistré localement.</p>
      </div>
      <div className="actions">
        <button className="primary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}/paiement`)}>Retour paiement</button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>Retour agence</button>
      </div>
    </section>
  )
}

function AgencyPropertiesView({ agencyId, onNavigate }: { agencyId: string; onNavigate: Navigate }) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  const properties = getAgencyProperties(agencyId)

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Annonces</h1>
        <p className="subtitle">{agency.name}</p>
      </div>
      <button className="primary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}/annonces/new`)}>
        Créer une annonce
      </button>
      <div className="list-grid">
        {properties.length === 0 && <InfoBlock title="Aucune annonce" text="Créez une annonce pour générer le parcours vendeur." />}
        {properties.map((property) => (
          <article className="list-card" key={property.id}>
            <div>
              <p className="eyebrow">{property.status}</p>
              <h2>{property.title}</h2>
              <p>{property.city} · {property.price} · {property.surface}</p>
            </div>
            <div className="inline-actions">
              <button className="primary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}/annonces/${property.id}`)}>
                Gérer
              </button>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/public/${property.id}`)}>
                Voir annonce
              </button>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/vendeur/${property.id}`)}>
                Ouvrir vendeur
              </button>
            </div>
          </article>
        ))}
      </div>
      <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
        Retour agence
      </button>
    </section>
  )
}

function AgencyModulesView({
  agencyId,
  onNavigate,
  onSaved,
}: {
  agencyId: string
  onNavigate: Navigate
  onSaved: FlashSetter
}) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  const moduleLabels = [
    ['publicSite', 'Site public', 'Affiche la vitrine publique de l’agence.'],
    ['ownerSpace', 'Espace patron', 'Active le tableau de bord dirigeant.'],
    ['agentSpace', 'Espace agent', 'Active la gestion des annonces cété agent.'],
    ['sellerSpace', 'Espace vendeur'],
    ['listings', 'Annonces', 'Permet de créer et publier des biens.'],
    ['documents', 'Documents'],
    ['visits', 'Visites'],
    ['reports', 'Comptes rendus'],
    ['customPages', 'Pages personnalisées'],
    ['customButtons', 'Boutons personnalisés'],
    ['sellerEstimate', 'Estimation vendeur'],
    ['agencyContact', 'Formulaire contact'],
    ['aiAnalysis', 'Analyse IA', 'Simulation d’analyse de site.'],
    ['importListings', 'Import annonces', 'Simulation d’import annonces.'],
    ['importBranding', 'Import logo/couleurs', 'Simulation import branding.'],
  ] as const
  const [modules, setModules] = useState<Record<string, boolean>>(() => agency?.modules ?? {})
  const [detailMode, setDetailMode] = useState<'simple' | 'advanced'>('simple')
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  const visibleModuleLabels = detailMode === 'simple' ? moduleLabels.slice(0, 6) : moduleLabels

  function toggleModule(key: string) {
    setModules((current) => {
      const nextValue = !(current[key] ?? true)
      onSaved(nextValue ? 'Module activé localement' : 'Module désactivé localement')
      return { ...current, [key]: nextValue }
    })
  }

  function saveModules() {
    updateAgency(agencyId, { modules })
    onSaved('Modules enregistrès localement')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Modules</h1>
        <p className="subtitle">{agency.name}</p>
      </div>
      <div className="filter-row">
        <button className={detailMode === 'simple' ? 'active' : ''} type="button" onClick={() => setDetailMode('simple')}>
          Mode simple
        </button>
        <button className={detailMode === 'advanced' ? 'active' : ''} type="button" onClick={() => setDetailMode('advanced')}>
          Mode avance
        </button>
      </div>
      <p className="microcopy">Les modules restent locaux. Tu peux activer le detail quand tu en as besoin.</p>
      <div className="list-grid">
        {visibleModuleLabels.map(([key, label, description]) => (
          <article className="list-card" key={key}>
            <div>
              <p className="eyebrow">{modules[key] ?? true ? 'ON' : 'OFF'}</p>
              <h2>{label}</h2>
              <p>{description ?? 'Module activable localement.'}</p>
            </div>
            <button className="secondary-button compact" type="button" onClick={() => toggleModule(key)}>
              {modules[key] ?? true ? 'Désactiver' : 'Activer'}
            </button>
          </article>
        ))}
      </div>
      <div className="actions">
        <button className="primary-button" type="button" onClick={saveModules}>
          Enregistrer modules
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
          Retour agence
        </button>
      </div>
    </section>
  )
}

function AgencyDemoView({ agencyId, onNavigate }: { agencyId: string; onNavigate: Navigate }) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  const firstProperty = getAgencyProperties(agencyId)[0]

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Démo agence</h1>
        <p className="subtitle">{agency.name}</p>
      </div>
      <div className="demo-buttons">
        <button type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/public`)}>
          Site public
        </button>
        <button type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/patron`)}>
          Espace patron
        </button>
        <button type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/agent`)}>
          Espace agent
        </button>
        <button
          type="button"
          onClick={() =>
            firstProperty
              ? onNavigate(`/demo/immobilier/agence/${agencyId}/vendeur/${firstProperty.id}`)
              : onNavigate(`/admin/agences/${agencyId}/annonces/new`)
          }
        >
          Espace vendeur
        </button>
      </div>
      <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
        Retour agence
      </button>
    </section>
  )
}

function AgencyAnalysisView({
  agencyId,
  onNavigate,
  onSaved,
}: {
  agencyId: string
  onNavigate: Navigate
  onSaved: FlashSetter
}) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  const [form, setForm] = useState({
    siteUrl: agency?.currentSite ?? 'https://signature-immobilier.example',
    sector: agency?.sector ?? 'Immobilier',
    city: agency?.city ?? 'Tarbes',
  })
  const [analysis, setAnalysis] = useState<AgencyAnalysis | undefined>(agency?.analysis)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  const currentAgency = agency

  function relaunchAnalysis() {
    const nextAnalysis = makeSimulatedAnalysis(form.siteUrl, form.sector, form.city)
    setAnalysis(nextAnalysis)
    updateAgency(agencyId, { analysis: nextAnalysis })
    onSaved('Analyse simulée enregistrée localement')
  }

  function applyColors() {
    if (!analysis) return
    updateAgency(agencyId, { colors: analysis.colors })
    onSaved('Couleurs appliquées localement')
  }

  function applyTexts() {
    if (!analysis) return
    updateAgency(agencyId, {
      mood: {
        ...(currentAgency.mood ?? defaultMood(currentAgency.name)),
        homeTitle: analysis.detectedName,
        promise: analysis.promise,
        tone: analysis.tone,
      },
    })
    onSaved('Textes appliqués localement')
  }

  function importListings() {
    if (!analysis) return
    analysis.detectedListings.forEach((title) => {
      createProperty({
        ...formToPropertyInput(agencyId, defaultPropertyForm()),
        title,
        city: form.city,
      })
    })
    onSaved('Annonces détectées importées localement')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Analyse du site actuel</h1>
        <p className="subtitle">{agency.name}</p>
      </div>
      <article className="edit-panel">
        <TextField label="URL du site actuel" value={form.siteUrl} onChange={(value) => setForm((current) => ({ ...current, siteUrl: value }))} />
        <TextField label="Secteur" value={form.sector} onChange={(value) => setForm((current) => ({ ...current, sector: value }))} />
        <TextField label="Ville" value={form.city} onChange={(value) => setForm((current) => ({ ...current, city: value }))} />
        <button className="primary-button compact" type="button" onClick={relaunchAnalysis}>
          Relancer l?analyse
        </button>
      </article>
      {analysis && <AnalysisCard analysis={analysis} />}
      <div className="actions">
        <button className="secondary-button" type="button" onClick={applyColors}>
          Appliquer couleurs
        </button>
        <button className="secondary-button" type="button" onClick={applyTexts}>
          Appliquer textes
        </button>
        <button className="secondary-button" type="button" onClick={importListings}>
          Importer annonces détectées
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
          Retour agence
        </button>
      </div>
    </section>
  )
}

function AgencyMoodView({
  agencyId,
  onNavigate,
  onSaved,
}: {
  agencyId: string
  onNavigate: Navigate
  onSaved: FlashSetter
}) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  const [mood, setMood] = useState<AgencyMood>(() => agency?.mood ?? defaultMood(agency?.name ?? 'Agence'))
  const [detailMode, setDetailMode] = useState<'simple' | 'advanced'>('simple')
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />

  function updateField(field: keyof AgencyMood, value: string) {
    setMood((current) => ({ ...current, [field]: value }))
  }

  function applyMood() {
    updateAgencyMood(agencyId, mood)
    onSaved('Ambiance appliquée localement')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Ambiance visuelle</h1>
        <p className="subtitle">{agency.name}</p>
      </div>
      <div className="filter-row">
        <button className={detailMode === 'simple' ? 'active' : ''} type="button" onClick={() => setDetailMode('simple')}>
          Mode simple
        </button>
        <button className={detailMode === 'advanced' ? 'active' : ''} type="button" onClick={() => setDetailMode('advanced')}>
          Mode avance
        </button>
      </div>
      <article className={`edit-panel form-grid mood-form ${detailMode === 'simple' ? 'simple-mode' : 'advanced-mode'}`}>
        <div className="form-section-title">
          <p className="eyebrow">Essentiel</p>
          <h2>Ambiance</h2>
          <p>Modification locale uniquement.</p>
        </div>
        <SelectField
          label="Ambiance"
          value={mood.moodName}
          options={['Premium sobre', 'Luxe discret', 'Familial rassurant', 'Moderne dynamique', 'Institutionnel', 'Apple / Airbnb']}
          onChange={(value) => updateField('moodName', value)}
        />
        <TextField label="Titre d’accueil" value={mood.homeTitle} onChange={(value) => updateField('homeTitle', value)} />
        <TextField label="Sous-titre" value={mood.subtitle} onChange={(value) => updateField('subtitle', value)} />
        <TextField label="Promesse principale" value={mood.promise} onChange={(value) => updateField('promise', value)} />
        <TextField label="Ton rrédactionnel" value={mood.tone} onChange={(value) => updateField('tone', value)} />
        <TextField label="Style des cartes" value={mood.cardStyle} onChange={(value) => updateField('cardStyle', value)} />
        <TextField label="Niveau de contraste" value={mood.contrast} onChange={(value) => updateField('contrast', value)} />
        <TextField label="Arrondis" value={mood.radius} onChange={(value) => updateField('radius', value)} />
        <SelectField
          label="Densité d’information"
          value={mood.density}
          options={['minimal', 'normal', 'détaillé']}
          onChange={(value) => updateField('density', value)}
        />
        <button className="primary-button" type="button" onClick={applyMood}>
          Appliquer l’ambiance
        </button>
      </article>
      <div className="actions">
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/public`)}>
          Voir site public
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
          Retour agence
        </button>
      </div>
    </section>
  )
}

function AgencyExportView({
  agencyId,
  onNavigate,
  setFlash,
}: {
  agencyId: string
  onNavigate: Navigate
  setFlash: FlashSetter
}) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  const properties = getAgencyProperties(agencyId)
  const pages = getAgencyPages(agencyId)
  const buttons = getAgencyButtons(agencyId)

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Export démo</h1>
        <p className="subtitle">{agency.name}</p>
      </div>
      <div className="card-grid">
        <InfoBlock title="Résumé démo" text={`${properties.length} annonces · ${pages.length} pages · ${buttons.length} boutons`} />
        <InfoBlock title="Liens à envoyer" text={`/demo/immobilier/agence/${agencyId}/public · /patron · /agent`} />
        <InfoBlock title="Checklist" text="Branding, annonce publiée, vendeur, documents, pages et boutons à relire." />
        <InfoBlock title="Simulé aujourd’hui" text="localStorage, fichiers, comptes, emails, paiements et analyse IA." />
        <InfoBlock title="À compléter plus tard" text="Ce bloc reste une simulation locale jusqu'à validation." />
      </div>
      <div className="actions">
        <button className="primary-button" type="button" onClick={() => setFlash('Résumé copié')}>
          Copier résumé démo
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
          Retour agence
        </button>
      </div>
    </section>
  )
}

function NewPropertyView({
  agencyId,
  onNavigate,
  onCreated,
}: {
  agencyId: string
  onNavigate: Navigate
  onCreated: FlashSetter
}) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  const [form, setForm] = useState(defaultPropertyForm())
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />

  function updateField(field: keyof ReturnType<typeof defaultPropertyForm>, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const property = createProperty(formToPropertyInput(agencyId, form))
    onCreated('Annonce créée localement.')
    onNavigate(`/admin/agences/${agencyId}/annonces/${property.id}`)
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Créer une annonce</h1>
        <p className="subtitle">{agency.name}</p>
      </div>

      <PropertyForm form={form} onChange={updateField} onSubmit={submit} submitLabel="Créer l’annonce" />

      <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
        Retour agence
      </button>
    </section>
  )
}

function EditPropertyView({
  agencyId,
  propertyId,
  onNavigate,
  onSaved,
}: {
  agencyId: string
  propertyId: string
  onNavigate: Navigate
  onSaved: FlashSetter
}) {
  const property = getProperty(propertyId)
  const [form, setForm] = useState(() => propertyToForm(property))
  const [photoUrl, setPhotoUrl] = useState(property?.mainPhotoUrl ?? '')
  const [documentForm, setDocumentForm] = useState({
    name: 'Bon de visite',
    type: 'PDF',
    url: '',
    visibleToSeller: 'oui',
  })
  const [visitForm, setVisitForm] = useState({
    dateTime: property?.nextVisit ?? 'Samedi 22 juin à 14h30',
    comment: 'Visite programmée depuis le Studio Admin.',
  })
  const [reportText, setReportText] = useState(property?.visitReport ?? '')
  const [actionMessage, setActionMessage] = useState('')
  if (!property || property.agencyId !== agencyId) {
    return <MissingView title="Annonce introuvable" onNavigate={onNavigate} backRoute={`/admin/agences/${agencyId}`} backLabel="Retour fiche agence" />
  }
  const currentProperty = property

  function updateField(field: keyof ReturnType<typeof defaultPropertyForm>, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    updateProperty(propertyId, formToPropertyInput(agencyId, form))
    onSaved('Modifications enregistrées')
  }

  function addPhoto() {
    const nextUrl = photoUrl.trim()
    if (!nextUrl) {
      setActionMessage('Ajoutez une URL de photo pour afficher un aperçu.')
      return
    }

    updateProperty(propertyId, {
      mainPhotoUrl: nextUrl,
      photos: [...(currentProperty.photos ?? []), nextUrl],
    })
    setActionMessage('Photo ajoutée localement')
    onSaved('Photo ajoutée localement')
  }

  function addDocument() {
    const document: PropertyDocument = {
      id: `doc-${Date.now()}`,
      name: documentForm.name,
      type: documentForm.type,
      url: documentForm.url,
      visibleToSeller: documentForm.visibleToSeller === 'oui',
    }
    const nextDocuments = [...(currentProperty.documents ?? []), document]
    const nextVisibleDocuments = document.visibleToSeller
      ? [...currentProperty.visibleDocuments, document.name]
      : currentProperty.visibleDocuments

    updateProperty(propertyId, {
      documents: nextDocuments,
      visibleDocuments: nextVisibleDocuments,
    })
    setActionMessage('Document ajouté localement')
    onSaved('Document ajouté localement')
  }

  function addVisit() {
    const visit: PropertyVisit = {
      id: `visit-${Date.now()}`,
      dateTime: visitForm.dateTime,
      comment: visitForm.comment,
    }

    updateProperty(propertyId, {
      visits: [...(currentProperty.visits ?? []), visit],
      nextVisit: visit.dateTime,
    })
    setActionMessage('Visite programmée localement')
    onSaved('Visite programmée localement')
  }

  function addReport() {
    updateProperty(propertyId, {
      visitReport: reportText,
    })
    setActionMessage('Compte rendu ajouté localement')
    onSaved('Compte rendu ajouté localement')
  }

  function removeProperty() {
    const confirmed = window.confirm('Supprimer cette annonce locale ?')
    if (!confirmed) return

    deleteProperty(propertyId)
    onSaved('Annonce supprimée localement')
    onNavigate(`/admin/agences/${agencyId}/annonces`)
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Gestion annonce</h1>
        <p className="subtitle">{property.title}</p>
      </div>

      <PropertyForm form={form} onChange={updateField} onSubmit={submit} submitLabel="Enregistrer" />

      <article className="edit-panel">
        <h2>Actions simulées</h2>
        {actionMessage && <p className="save-message">{actionMessage}</p>}

        <div className="edit-preview">
          <p className="eyebrow">Ajouter photo</p>
          <TextField label="URL photo" value={photoUrl} onChange={setPhotoUrl} />
          <button className="secondary-button compact" type="button" onClick={addPhoto}>
            Ajouter photo
          </button>
          {photoUrl && <PropertyPhoto property={{ ...property, mainPhotoUrl: photoUrl }} />}
        </div>

        <div className="edit-preview">
          <p className="eyebrow">Ajouter document</p>
          <TextField label="Nom" value={documentForm.name} onChange={(value) => setDocumentForm((current) => ({ ...current, name: value }))} />
          <TextField label="Type" value={documentForm.type} onChange={(value) => setDocumentForm((current) => ({ ...current, type: value }))} />
          <TextField label="Document ou URL" value={documentForm.url} onChange={(value) => setDocumentForm((current) => ({ ...current, url: value }))} />
          <SelectField
            label="Visible vendeur"
            value={documentForm.visibleToSeller}
            options={['oui', 'non']}
            onChange={(value) => setDocumentForm((current) => ({ ...current, visibleToSeller: value }))}
          />
          <button className="secondary-button compact" type="button" onClick={addDocument}>
            Ajouter document
          </button>
          <div className="document-list">
            {(property.documents ?? []).map((document) => (
              <span key={document.id}>{document.name}</span>
            ))}
          </div>
        </div>

        <div className="edit-preview">
          <p className="eyebrow">Programmer visite</p>
          <TextField label="Date / heure" value={visitForm.dateTime} onChange={(value) => setVisitForm((current) => ({ ...current, dateTime: value }))} />
          <TextAreaField label="Commentaire" value={visitForm.comment} onChange={(value) => setVisitForm((current) => ({ ...current, comment: value }))} />
          <button className="secondary-button compact" type="button" onClick={addVisit}>
            Programmer visite
          </button>
          <div className="document-list">
            {(property.visits ?? []).map((visit) => (
              <span key={visit.id}>{visit.dateTime}</span>
            ))}
          </div>
        </div>

        <div className="edit-preview">
          <p className="eyebrow">Ajouter compte rendu</p>
          <TextAreaField label="Compte rendu" value={reportText} onChange={setReportText} />
          <button className="secondary-button compact" type="button" onClick={addReport}>
            Ajouter compte rendu
          </button>
        </div>
      </article>

      <div className="actions">
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/public/${propertyId}`)}>
          Visualiser l’annonce
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/agent`)}>
          Ouvrir espace agent
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/vendeur/${propertyId}`)}>
          Ouvrir espace vendeur
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
          Retour agence
        </button>
        <button className="secondary-button danger-button" type="button" onClick={removeProperty}>
          Supprimer annonce
        </button>
      </div>
    </section>
  )
}

function AgencyPagesView({
  agencyId,
  onNavigate,
  onCreated,
}: {
  agencyId: string
  onNavigate: Navigate
  onCreated: FlashSetter
}) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  const pages = getAgencyPages(agencyId)
  const [form, setForm] = useState({
    title: 'Guide vendeur',
    content: 'Une page locale pour expliquer le suivi vendeur.',
    placement: 'public',
    slug: 'guide-vendeur',
    status: 'publié',
    ctaLabel: 'Contacter l’agence',
    ctaDestination: `/demo/immobilier/agence/${agencyId}/preparation`,
  })
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />

  function submit(event: FormEvent) {
    event.preventDefault()
    const page = createCustomPage({
      agencyId,
      title: form.title,
      content: form.content,
      placement: form.placement as 'public' | 'patron' | 'agent' | 'vendeur',
      slug: form.slug,
      status: form.status as 'brouillon' | 'publié',
      ctaLabel: form.ctaLabel,
      ctaDestination: form.ctaDestination,
    })
    onCreated('Page personnalisée créée localement.')
    onNavigate(`/demo/immobilier/agence/${agencyId}/page/${page.slug}`)
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Pages personnalisées</h1>
        <p className="subtitle">{agency.name}</p>
      </div>

      <form className="edit-panel form-grid" onSubmit={submit}>
        <TextField label="Titre" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} />
        <TextField label="Slug" value={form.slug} onChange={(value) => setForm((current) => ({ ...current, slug: value }))} />
        <SelectField
          label="Statut"
          value={form.status}
          options={['brouillon', 'publié']}
          onChange={(value) => setForm((current) => ({ ...current, status: value }))}
        />
        <SelectField
          label="Emplacement"
          value={form.placement}
          options={['public', 'patron', 'agent', 'vendeur']}
          onChange={(value) => setForm((current) => ({ ...current, placement: value }))}
        />
        <TextAreaField label="Contenu" value={form.content} onChange={(value) => setForm((current) => ({ ...current, content: value }))} />
        <TextField label="Bouton CTA optionnel" value={form.ctaLabel} onChange={(value) => setForm((current) => ({ ...current, ctaLabel: value }))} />
        <TextField label="Destination CTA" value={form.ctaDestination} onChange={(value) => setForm((current) => ({ ...current, ctaDestination: value }))} />
        <button className="primary-button" type="submit">
          Créer la page
        </button>
      </form>

      <div className="list-grid">
        {pages.map((page) => (
          <article className="list-card" key={page.id}>
            <div>
              <p className="eyebrow">{page.placement}</p>
              <h2>{page.title}</h2>
              <p>/page/{page.slug}</p>
            </div>
            <div className="inline-actions">
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/page/${page.slug}`)}>
                Voir page
              </button>
              <button className="secondary-button compact" type="button" onClick={() => onCreated('Mode modification prêt à connecter localement.')}>
                Modifier
              </button>
              <button className="secondary-button compact danger-button" type="button" onClick={() => { deletePage(page.id); onCreated('Page supprimée localement.') }}>
                Supprimer
              </button>
            </div>
          </article>
        ))}
      </div>

      <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
        Retour agence
      </button>
    </section>
  )
}

function AgencyButtonsView({
  agencyId,
  onNavigate,
  onCreated,
}: {
  agencyId: string
  onNavigate: Navigate
  onCreated: FlashSetter
}) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  const pages = getAgencyPages(agencyId)
  const buttons = getAgencyButtons(agencyId)
  const firstPageDestination = pages[0] ? `/demo/immobilier/agence/${agencyId}/page/${pages[0].slug}` : `/demo/immobilier/agence/${agencyId}/preparation`
  const [form, setForm] = useState({
    label: 'Lire le guide vendeur',
    placement: 'public',
    destination: firstPageDestination,
    destinationType: 'route interne',
    style: 'secondaire',
    status: 'actif',
  })
  const [detailMode, setDetailMode] = useState<'simple' | 'advanced'>('simple')
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />

  function submit(event: FormEvent) {
    event.preventDefault()
    createCustomButton({
      agencyId,
      label: form.label,
      placement: form.placement as CustomButton['placement'],
      destination: form.destination,
      destinationType: form.destinationType as CustomButton['destinationType'],
      style: form.style as CustomButton['style'],
      status: form.status as CustomButton['status'],
    })
    onCreated('Bouton personnalisé créé localement.')
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Boutons personnalisés</h1>
        <p className="subtitle">{agency.name}</p>
      </div>

      <div className="filter-row">
        <button className={detailMode === 'simple' ? 'active' : ''} type="button" onClick={() => setDetailMode('simple')}>
          Mode simple
        </button>
        <button className={detailMode === 'advanced' ? 'active' : ''} type="button" onClick={() => setDetailMode('advanced')}>
          Mode avance
        </button>
      </div>

      <form className={`edit-panel form-grid button-form ${detailMode === 'simple' ? 'simple-mode' : 'advanced-mode'}`} onSubmit={submit}>
        <div className="form-section-title">
          <p className="eyebrow">Essentiel</p>
          <h2>Nouveau bouton</h2>
          <p>Choisis le texte et la destination. Le style peut rester automatique.</p>
        </div>
        <TextField label="Texte du bouton" value={form.label} onChange={(value) => setForm((current) => ({ ...current, label: value }))} />
        <SelectField
          label="Emplacement"
          value={form.placement}
          options={['public', 'patron', 'agent', 'vendeur', 'fiche agence']}
          onChange={(value) => setForm((current) => ({ ...current, placement: value }))}
        />
        <SelectField
          label="Type destination"
          value={form.destinationType}
          options={['route interne', 'page personnalisée', 'téléphone', 'mail', 'formulaire simulé']}
          onChange={(value) => setForm((current) => ({ ...current, destinationType: value }))}
        />
        <SelectField
          label="Style"
          value={form.style}
          options={['principal', 'secondaire', 'discret']}
          onChange={(value) => setForm((current) => ({ ...current, style: value }))}
        />
        <SelectField
          label="Statut"
          value={form.status}
          options={['actif', 'inactif']}
          onChange={(value) => setForm((current) => ({ ...current, status: value }))}
        />
        <TextField label="Destination" value={form.destination} onChange={(value) => setForm((current) => ({ ...current, destination: value }))} />
        <button className="primary-button" type="submit">
          Créer le bouton
        </button>
      </form>

      <div className="list-grid">
        {buttons.map((button) => (
          <article className="list-card" key={button.id}>
            <div>
              <p className="eyebrow">{button.placement}</p>
              <h2>{button.label}</h2>
              <p>{button.destination}</p>
            </div>
            <div className="inline-actions">
              <button className="secondary-button compact" type="button" onClick={() => openCustomDestination(button, agencyId, onNavigate)}>
                Tester bouton
              </button>
              <button className="secondary-button compact danger-button" type="button" onClick={() => { deleteButton(button.id); onCreated('Bouton supprimé localement.') }}>
                Supprimer
              </button>
            </div>
          </article>
        ))}
      </div>

      <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
        Retour agence
      </button>
    </section>
  )
}

function DemoIndexView({ onNavigate }: { onNavigate: Navigate }) {
  const demoButtons = getGlobalButtonsByPlacement('démo immobilier')
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
        <p>{immobilierSector.moduleName} est le premier module métier de Signature Digital Core.</p>
        <div className="inline-actions">
          <button className="primary-button compact" type="button" onClick={() => onNavigate('/demo/immobilier')}>
            Ouvrir le hub immobilier
          </button>
        </div>
      </article>
      {demoButtons.length > 0 && (
        <article className="demo-panel">
          <p className="eyebrow">Boutons globaux</p>
          <div className="inline-actions">
            {demoButtons.map((button) => (
              <button className="secondary-button compact" key={button.id} type="button" onClick={() => openGlobalDestination(button, onNavigate)}>
                {button.label}
              </button>
            ))}
          </div>
        </article>
      )}
    </section>
  )
}

function ImmobilierHubView({ agencies, onNavigate }: { agencies: Agency[]; onNavigate: Navigate }) {
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
          <button type="button" onClick={() => onNavigate('/admin/agences')}>
            Gérer les agences locales
          </button>
        </div>
      </div>

      {agencies.length > 0 && (
        <section className="list-grid">
          {agencies.map((agency) => (
            <article className="list-card" key={agency.id}>
              <div>
                <p className="eyebrow">Agence locale</p>
                <h2>{agency.name}</h2>
                <p>{agency.city} · {agency.status}</p>
              </div>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agency.id}/public`)}>
                Ouvrir
              </button>
            </article>
          ))}
        </section>
      )}
    </section>
  )
}

function ImmobilierPublicView({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <section className="page-view">
      <div className="page-heading">
        <p className="eyebrow">{immobilierAgency.name}</p>
        <h1>Site public immobilier</h1>
        <p className="subtitle">Vendez votre bien sans rester dans le flou</p>
        <p className="intro">Une expérience claire pour suivre chaque étape de votre vente.</p>
      </div>

      <StaticPropertyCard showManageButton={false} onNavigate={onNavigate} />

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

function ImmobilierPatronView({ onNavigate }: { onNavigate: Navigate }) {
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

      <StaticPropertyCard showManageButton={false} onNavigate={onNavigate} />

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

function ImmobilierAgentView({ onNavigate }: { onNavigate: Navigate }) {
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

      <StaticPropertyCard onNavigate={onNavigate} />

      <div className="actions">
        <button className="primary-button" type="button" onClick={() => onNavigate('/demo/immobilier/bien')}>
          Gérer le bien
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier/public')}>
          Voir annonce
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

function ImmobilierVendeurView({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <section className="page-view seller-view">
      <div className="page-heading">
        <h1>Espace vendeur</h1>
        <p className="subtitle">Un suivi simple, premium et transparent.</p>
      </div>

      <article className="seller-panel">
        <StaticPropertyPhoto />
        <div>
          <p className="eyebrow">{demoProperty.title}</p>
          <h2>Progression de vente</h2>
          <StepProgress currentStep={sellerTracking.currentStep} />
        </div>
      </article>

      <TrackingCards property={staticPropertyToGenerated()} onNavigate={onNavigate} backRoute="/demo/immobilier" backLabel="Retour démo" />
    </section>
  )
}

function ImmobilierBienView({ onNavigate }: { onNavigate: Navigate }) {
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
        <TextField label="Titre" value={title} onChange={setTitle} />
        <TextField label="Ville" value={city} onChange={setCity} />
        <TextField label="Prix" value={price} onChange={setPrice} />
        <TextField label="Surface" value={surface} onChange={setSurface} />
        <TextField label="Pièces" value={rooms} onChange={setRooms} />
        <TextField label="Statut" value={status} onChange={setStatus} />
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
          Retour ? l?agent
        </button>
      </div>
    </section>
  )
}

function GeneratedPublicView({ agencyId, propertyId, onNavigate }: { agencyId: string; propertyId?: string; onNavigate: Navigate }) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  const [showEstimate, setShowEstimate] = useState(false)
  const [publicMessage, setPublicMessage] = useState('')
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  if (agency.status === 'inactive') return <InactiveAgencyView onNavigate={onNavigate} />
  const publishedProperties = getAgencyProperties(agencyId).filter((property) => property.status === 'publié')
  const visibleProperties = propertyId
    ? publishedProperties.filter((property) => property.id === propertyId)
    : publishedProperties

  return (
    <section className="page-view">
      <div className="page-heading">
        <p className="eyebrow">{agency.name}</p>
        <h1>Vendez votre bien sans rester dans le flou</h1>
        <p className="subtitle">Une expérience claire pour suivre chaque étape de votre vente.</p>
      </div>

      {visibleProperties.length === 0 && <InfoBlock title="Aucun bien publié" text="Publiez une annonce depuis l’admin pour alimenter ce site." />}
      {visibleProperties.map((property) => (
        <GeneratedPropertyCard key={property.id} agencyId={agencyId} property={property} onNavigate={onNavigate} />
      ))}
      <PublishedPages agencyId={agencyId} placement="public" onNavigate={onNavigate} />
      <CustomButtons agencyId={agencyId} placement="public" onNavigate={onNavigate} />
      {publicMessage && <p className="flash-message">{publicMessage}</p>}
      {showEstimate && (
        <article className="edit-panel">
          <h2>Estimation vendeur</h2>
          <TextField label="Adresse du bien" value="Tarbes centre" onChange={() => undefined} />
          <TextField label="Surface estimée" value="82 m²" onChange={() => undefined} />
          <button className="primary-button compact" type="button" onClick={() => setPublicMessage('Demande dd’estimation enregistrée localement')}>
            Envoyer la demande
          </button>
        </article>
      )}

      <div className="actions">
        <button
          className="primary-button"
          type="button"
          onClick={() =>
            visibleProperties[0]
              ? onNavigate(`/demo/immobilier/agence/${agencyId}/public/${visibleProperties[0].id}`)
              : setPublicMessage('Créez une annonce publiée pour ouvrir une annonce.')
          }
        >
          Voir annonce
        </button>
        <button className="secondary-button" type="button" onClick={() => setShowEstimate((value) => !value)}>
          Estimer mon bien
        </button>
        <button className="secondary-button" type="button" onClick={() => setPublicMessage('Demande envoyée localement')}>
          Contacter l’agence
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
          Retour admin
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier')}>
          Retour démo
        </button>
      </div>
    </section>
  )
}

function GeneratedPatronView({ agencyId, onNavigate }: { agencyId: string; onNavigate: Navigate }) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  if (agency.status === 'inactive') return <InactiveAgencyView onNavigate={onNavigate} />
  const properties = getAgencyProperties(agencyId)
  const agents = getAgencyUsers(agencyId).filter((user) => user.role === 'agent')
  const firstProperty = properties[0]
  const alerts = properties.flatMap((property) => getPropertyAlerts(property))

  return (
    <section className="page-view patron-space">
      <div className="page-heading role-heading">
        <h1>Espace patron</h1>
        <p className="subtitle">Controler la qualite du suivi vendeur.</p>
        <p className="intro">{agency.name} · {agency.city} · {agency.status}</p>
      </div>

      <div className="metric-grid">
        <MetricCard label="Biens suivis" value={String(properties.length)} />
        <MetricCard label="Agents" value={String(agents.length)} />
        <MetricCard label="Vendeurs" value={String(properties.length)} />
      </div>

      <article className="role-panel">
        <p className="eyebrow">Boucle de suivi</p>
        <h2>Agent met a jour, vendeur rassure, patron garde le controle</h2>
        <p>Chaque mise a jour visible vendeur permet de verifier la qualite du suivi.</p>
      </article>

      <section className="role-section">
        <p className="eyebrow">Dernieres mises a jour</p>
        <div className="list-grid">
          {properties.length === 0 && <InfoBlock title="Aucun bien suivi" text="Creez une annonce pour lancer le suivi vendeur." />}
          {properties.map((property) => (
            <article className="list-card" key={property.id}>
              <div>
                <p className="eyebrow">Suivi vendeur actif</p>
                <h2>{property.title}</h2>
                <p>Etape actuelle : {property.currentStep}</p>
                <p>Derniere mise a jour visible vendeur : {property.visitReport || 'A completer'}</p>
              </div>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/vendeur/${property.id}`)}>
                Voir vendeur
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="role-section">
        <p className="eyebrow">Biens a surveiller</p>
        {alerts.length === 0 ? (
          <article className="quiet-card success-card">
            <h2>Tous les suivis vendeurs sont a jour.</h2>
            <p>Les comptes rendus, visites et documents essentiels sont visibles.</p>
          </article>
        ) : (
          <div className="list-grid">
            {alerts.map((alert) => (
              <article className="quiet-card alert-card" key={`${alert.propertyId}-${alert.text}`}>
                <p className="eyebrow">{alert.propertyTitle}</p>
                <h2>{alert.text}</h2>
                <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}/annonces/${alert.propertyId}`)}>
                  Corriger
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <PublishedPages agencyId={agencyId} placement="patron" onNavigate={onNavigate} />
      <CustomButtons agencyId={agencyId} placement="patron" onNavigate={onNavigate} />

      <div className="actions">
        <button className="primary-button" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/agent`)}>
          Voir espace agent
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/public`)}>
          Voir site public
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={() => firstProperty ? onNavigate(`/demo/immobilier/agence/${agencyId}/vendeur/${firstProperty.id}`) : onNavigate(`/admin/agences/${agencyId}/annonces/new`)}
        >
          Voir espace vendeur
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
          Gérer agence
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier')}>
          Retour démo
        </button>
      </div>
    </section>
  )
}

function GeneratedAgentView({ agencyId, onNavigate }: { agencyId: string; onNavigate: Navigate }) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  if (agency.status === 'inactive') return <InactiveAgencyView onNavigate={onNavigate} />
  const properties = getAgencyProperties(agencyId)

  return (
    <section className="page-view agent-space">
      <div className="page-heading role-heading">
        <h1>Espace agent</h1>
        <p className="subtitle">Mettre a jour le vendeur en moins d’une minute.</p>
        <p className="intro">{agency.name}</p>
      </div>

      <div className="filter-row" aria-label="Filtre biens">
        <span className="active">Tous les biens</span>
        <span>Mes biens</span>
      </div>

      <div className="list-grid agent-list">
        {properties.length === 0 && <InfoBlock title="Aucune annonce" text="Créez une annonce depuis la fiche agence." />}
        {properties.map((property) => (
          <article className="agent-property-card" key={property.id}>
            <PropertyPhoto property={property} />
            <div>
              <p className="eyebrow">{property.status}</p>
              <h2>{property.title}</h2>
              <div className="property-stats">
                <span>Statut actuel : {property.currentStep}</span>
                <span>Derniere mise a jour visible vendeur</span>
              </div>
              <p>{property.visitReport || 'Compte rendu a completer.'}</p>
              <p className="microcopy">Compte rendu partage au vendeur.</p>
            </div>
            <div className="quick-actions">
              <button className="primary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}/annonces/${property.id}`)}>
                Gerer le bien
              </button>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}/annonces/${property.id}`)}>
                Programmer visite
              </button>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}/annonces/${property.id}`)}>
                Ajouter compte rendu
              </button>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}/annonces/${property.id}`)}>
                Ajouter document
              </button>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/vendeur/${property.id}`)}>
                Ouvrir espace vendeur
              </button>
              <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/public/${property.id}`)}>
                Voir annonce
              </button>
            </div>
          </article>
        ))}
      </div>
      <PublishedPages agencyId={agencyId} placement="agent" onNavigate={onNavigate} />
      <CustomButtons agencyId={agencyId} placement="agent" onNavigate={onNavigate} />

      <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
        Retour agence
      </button>
      <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}/annonces/new`)}>
        Créer annonce
      </button>
      <button className="secondary-button" type="button" onClick={() => onNavigate('/demo/immobilier')}>
        Retour démo
      </button>
    </section>
  )
}

function GeneratedSellerView({ agencyId, propertyId, onNavigate }: { agencyId: string; propertyId: string; onNavigate: Navigate }) {
  const property = getProperty(propertyId)
  if (!property || property.agencyId !== agencyId) {
    return <MissingView title="Annonce introuvable" onNavigate={onNavigate} backRoute={`/admin/agences/${agencyId}`} backLabel="Retour fiche agence" />
  }
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)

  return (
    <section className="page-view seller-view reassuring-seller">
      <PropertyPhoto property={property} />

      <div className="page-heading role-heading">
        <h1>{property.title}</h1>
        <p className="subtitle">Votre vente avance. Voici ou nous en sommes.</p>
      </div>

      <article className="quiet-card status-card">
        <p className="eyebrow">Suivi vendeur actif</p>
        <h2>Etape actuelle : {property.currentStep}</h2>
        <StepProgress currentStep={property.currentStep} />
      </article>

      <article className="quiet-card">
        <p className="eyebrow">Prochaine etape</p>
        <h2>{property.nextVisit || 'Retour attendu prochainement'}</h2>
        <p>Votre agent vous tiendra informe apres chaque action importante.</p>
      </article>

      <article className="quiet-card">
        <p className="eyebrow">Dernier compte rendu</p>
        <h2>Compte rendu partage au vendeur</h2>
        <p>{property.visitReport || 'Aucun compte rendu partage pour le moment.'}</p>
      </article>

      <article className="quiet-card">
        <p className="eyebrow">Documents visibles</p>
        <div className="document-list">
          {property.visibleDocuments.length > 0
            ? property.visibleDocuments.map((document) => <span key={document}>{document}</span>)
            : <span>Aucun document visible</span>}
        </div>
      </article>

      <PublishedPages agencyId={agencyId} placement="vendeur" onNavigate={onNavigate} />
      <CustomButtons agencyId={agencyId} placement="vendeur" onNavigate={onNavigate} />

      <div className="actions">
        <button className="primary-button" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/public/${propertyId}`)}>
          Retour annonce
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/public`)}>
          Contact agence
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/agent`)}>
          Espace agent
        </button>
        {agency && (
          <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}`)}>
            Gerer agence
          </button>
        )}
      </div>
    </section>
  )
}

function GeneratedPropertyView({ agencyId, propertyId, onNavigate }: { agencyId: string; propertyId: string; onNavigate: Navigate }) {
  const property = getProperty(propertyId)
  if (!property || property.agencyId !== agencyId) {
    return <MissingView title="Annonce introuvable" onNavigate={onNavigate} backRoute={`/admin/agences/${agencyId}`} backLabel="Retour fiche agence" />
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Bien</h1>
        <p className="subtitle">{property.title}</p>
      </div>

      <GeneratedPropertyCard agencyId={agencyId} property={property} onNavigate={onNavigate} />

      <div className="actions">
        <button className="primary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}/annonces/${propertyId}`)}>
          Modifier dans l’admin
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/public`)}>
          Voir annonce
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/agent`)}>
          Retour agent
        </button>
      </div>
    </section>
  )
}

function GeneratedCustomPageView({ agencyId, slug, onNavigate }: { agencyId: string; slug: string; onNavigate: Navigate }) {
  const agency = getLocalState().agencies.find((item) => item.id === agencyId)
  if (!agency) return <MissingView title="Agence introuvable" onNavigate={onNavigate} />
  if (agency.status === 'inactive') return <InactiveAgencyView onNavigate={onNavigate} />
  if (agency.status === 'inactive') return <InactiveAgencyView onNavigate={onNavigate} />
  const page = getAgencyPageBySlug(agencyId, slug)
  if (!page) return <PreparationView agencyId={agencyId} onNavigate={onNavigate} />

  return (
    <section className="page-view">
      <div className="page-heading">
        <p className="eyebrow">{agency.name} · {page.placement}</p>
        <h1>{page.title}</h1>
        <p className="subtitle">{page.content}</p>
      </div>
      <div className="actions">
        {page.ctaLabel && (
          <button className="primary-button" type="button" onClick={() => onNavigate(page.ctaDestination || `/demo/immobilier/agence/${agencyId}/preparation`)}>
            {page.ctaLabel}
          </button>
        )}
        <button className="secondary-button" type="button" onClick={() => onNavigate(getPlacementRoute(agencyId, page.placement))}>
          Retour espace
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(`/admin/agences/${agencyId}/pages`)}>
          Modifier les pages
        </button>
      </div>
    </section>
  )
}

function PreparationView({ agencyId, onNavigate }: { agencyId: string; onNavigate: Navigate }) {
  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Page en préparation</h1>
        <p className="subtitle">Cette destination existe comme action locale, mais son contenu n’est pas encore créé.</p>
      </div>
      <div className="actions">
        <button className="primary-button" type="button" onClick={() => onNavigate(agencyId ? `/admin/agences/${agencyId}/pages` : '/admin')}>
          Créer une page
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate(agencyId ? `/admin/agences/${agencyId}` : '/admin')}>
          Retour
        </button>
      </div>
    </section>
  )
}

function CustomButtons({
  agencyId,
  placement,
  onNavigate,
}: {
  agencyId: string
  placement: CustomButton['placement']
  onNavigate: Navigate
}) {
  const buttons = getAgencyButtonsByPlacement(agencyId, placement).filter((button) => button.status !== 'inactif')
  if (buttons.length === 0) return null

  return (
    <article className="demo-panel">
      <p className="eyebrow">Actions personnalisées</p>
      <div className="inline-actions">
        {buttons.map((button) => (
          <button className="secondary-button compact" key={button.id} type="button" onClick={() => openCustomDestination(button, agencyId, onNavigate)}>
            {button.label}
          </button>
        ))}
      </div>
    </article>
  )
}

function openCustomDestination(button: CustomButton, agencyId: string, onNavigate: Navigate) {
  const destination = button.destination.trim()
  if (button.destinationType === 'téléphone' || button.destinationType === 'mail' || button.destinationType === 'formulaire simulé') {
    onNavigate(`/demo/immobilier/agence/${agencyId}/preparation`)
    return
  }
  const localPagePrefix = `/demo/immobilier/agence/${agencyId}/page/`
  const allowedPrefixes = [
    `/admin/agences/${agencyId}`,
    `/demo/immobilier/agence/${agencyId}/public`,
    `/demo/immobilier/agence/${agencyId}/patron`,
    `/demo/immobilier/agence/${agencyId}/agent`,
    `/demo/immobilier/agence/${agencyId}/vendeur`,
    `/demo/immobilier/agence/${agencyId}/bien`,
    localPagePrefix,
  ]

  if (allowedPrefixes.some((prefix) => destination.startsWith(prefix))) {
    onNavigate(destination)
    return
  }

  onNavigate(`/demo/immobilier/agence/${agencyId}/preparation`)
}

function PublishedPages({
  agencyId,
  placement,
  onNavigate,
}: {
  agencyId: string
  placement: 'public' | 'patron' | 'agent' | 'vendeur'
  onNavigate: Navigate
}) {
  const pages = getAgencyPages(agencyId).filter((page) => page.placement === placement && page.status !== 'brouillon')
  if (pages.length === 0) return null

  return (
    <article className="demo-panel">
      <p className="eyebrow">Pages personnalisées</p>
      <div className="inline-actions">
        {pages.map((page) => (
          <button className="secondary-button compact" key={page.id} type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/page/${page.slug}`)}>
            {page.title}
          </button>
        ))}
      </div>
    </article>
  )
}

function openGlobalDestination(button: GlobalButton, onNavigate: Navigate) {
  const destination = button.destination.trim()
  if (destination.startsWith('/')) {
    onNavigate(destination)
    return
  }
  onNavigate('/admin/preview')
}

function GlobalPageView({ slug, onNavigate }: { slug: string; onNavigate: Navigate }) {
  const page = getGlobalPageBySlug(slug)
  if (!page || page.status !== 'publié') {
    return (
      <section className="page-view">
        <div className="page-heading">
          <h1>Page en préparation</h1>
          <p className="subtitle">Cette page globale n’existe pas encore ou n’est pas publiée.</p>
        </div>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/admin/pages')}>
          Gérer les pages
        </button>
      </section>
    )
  }

  const pageButtons = getGlobalButtonsByPlacement('page globale')

  return (
    <section className="page-view">
      <div className="page-heading">
        <p className="eyebrow">{page.placement}</p>
        <h1>{page.title}</h1>
        <p className="subtitle">{page.content}</p>
      </div>
      <div className="actions">
        {page.ctaLabel && (
          <button className="primary-button" type="button" onClick={() => onNavigate(page.ctaDestination || '/')}>
            {page.ctaLabel}
          </button>
        )}
        {pageButtons.map((button) => (
          <button className="secondary-button" key={button.id} type="button" onClick={() => openGlobalDestination(button, onNavigate)}>
            {button.label}
          </button>
        ))}
        <button className="secondary-button" type="button" onClick={() => onNavigate('/')}>
          Retour accueil
        </button>
      </div>
    </section>
  )
}

function getPlacementRoute(agencyId: string, placement: CustomButton['placement']) {
  if (placement === 'vendeur') {
    const firstProperty = getAgencyProperties(agencyId)[0]
    return firstProperty
      ? `/demo/immobilier/agence/${agencyId}/vendeur/${firstProperty.id}`
      : `/demo/immobilier/agence/${agencyId}/preparation`
  }

  return `/demo/immobilier/agence/${agencyId}/${placement}`
}

function PropertyForm({
  form,
  onChange,
  onSubmit,
  submitLabel,
}: {
  form: ReturnType<typeof defaultPropertyForm>
  onChange: (field: keyof ReturnType<typeof defaultPropertyForm>, value: string) => void
  onSubmit: (event: FormEvent) => void
  submitLabel: string
}) {
  const [detailMode, setDetailMode] = useState<'simple' | 'advanced'>('simple')

  return (
    <form className={`edit-panel form-grid property-form ${detailMode === 'simple' ? 'simple-mode' : 'advanced-mode'}`} onSubmit={onSubmit}>
      <div className="form-section-title">
        <p className="eyebrow">Mode de saisie</p>
        <h2>Annonce</h2>
        <p>Commence par les champs essentiels. Le detail reste modifiable ensuite.</p>
        <div className="filter-row">
          <button className={detailMode === 'simple' ? 'active' : ''} type="button" onClick={() => setDetailMode('simple')}>
            Simple
          </button>
          <button className={detailMode === 'advanced' ? 'active' : ''} type="button" onClick={() => setDetailMode('advanced')}>
            Avance
          </button>
        </div>
      </div>
      <TextField label="Titre du bien" value={form.title} onChange={(value) => onChange('title', value)} />
      <TextField label="Ville" value={form.city} onChange={(value) => onChange('city', value)} />
      <TextField label="Prix" value={form.price} onChange={(value) => onChange('price', value)} />
      <TextField label="Surface" value={form.surface} onChange={(value) => onChange('surface', value)} />
      <TextField label="Nombre de pièces" value={form.rooms} onChange={(value) => onChange('rooms', value)} />
      <SelectField label="Statut" value={form.status} options={['brouillon', 'publié']} onChange={(value) => onChange('status', value)} />
      <TextAreaField label="Description courte" value={form.shortDescription} onChange={(value) => onChange('shortDescription', value)} />
      <TextAreaField label="Description longue" value={form.longDescription} onChange={(value) => onChange('longDescription', value)} />
      <TextField label="Adresse approximative" value={form.approximateAddress} onChange={(value) => onChange('approximateAddress', value)} />
      <TextField label="Photo principale en URL texte" value={form.mainPhotoUrl} onChange={(value) => onChange('mainPhotoUrl', value)} />
      <TextField label="Photos secondaires en URL texte" value={form.secondaryPhotos} onChange={(value) => onChange('secondaryPhotos', value)} />
      <SelectField label="Étape actuelle" value={form.currentStep} options={saleSteps} onChange={(value) => onChange('currentStep', value)} />
      <TextField label="Prochaine visite" value={form.nextVisit} onChange={(value) => onChange('nextVisit', value)} />
      <TextAreaField label="Compte rendu de visite" value={form.visitReport} onChange={(value) => onChange('visitReport', value)} />
      <TextField label="Documents visibles vendeur" value={form.visibleDocuments} onChange={(value) => onChange('visibleDocuments', value)} />
      <button className="primary-button" type="submit">
        {submitLabel}
      </button>
    </form>
  )
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function makeSimulatedAnalysis(siteUrl: string, sector: string, city: string): AgencyAnalysis {
  const detectedName = siteUrl
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('.')[0]
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Agence Locale'

  return {
    siteUrl,
    detectedName,
    logoUrl: 'https://placehold.co/320x140/0d1f36/fbf3e6?text=Logo',
    colors: {
      primary: 'bleu nuit',
      secondary: 'crème',
      accent: 'doré doux',
    },
    mood: 'Premium sobre',
    tone: `local, rassurant et expert ${sector}`,
    promise: `Une expérience ${sector.toLowerCase()} claire à ${city}.`,
    detectedListings: [`Appartement lumineux à ${city}`, `Maison familiale proche ${city}`],
    weaknesses: ['Navigation peu claire', 'Peu de suivi vendeur visible', 'Appels à action dispersés'],
    premiumSuggestion: 'Créer un parcours vendeur transparent avec espaces dédiés, documents et visites.',
    confidenceScore: '87%',
    recommendations: ['Moderniser la page publique', 'Créer un espace vendeur', 'Mettre en avant les comptes rendus'],
  }
}

function defaultMood(name: string): AgencyMood {
  return {
    moodName: 'Apple / Airbnb',
    homeTitle: name,
    subtitle: 'Une expérience immobilière claire et premium.',
    promise: 'Vendez votre bien sans rester dans le flou.',
    tone: 'clair, rassurant et premium',
    cardStyle: 'cartes arrondies',
    contrast: 'normal',
    radius: 'large',
    density: 'normal',
  }
}

function AnalysisCard({ analysis }: { analysis: AgencyAnalysis }) {
  return (
    <article className="demo-panel">
      <p className="eyebrow">Analyse détectée</p>
      <h2>{analysis.detectedName}</h2>
      <p>{analysis.promise}</p>
      <div className="document-list">
        <span>{analysis.colors.primary}</span>
        <span>{analysis.colors.secondary}</span>
        <span>{analysis.colors.accent}</span>
        <span>Score {analysis.confidenceScore}</span>
      </div>
      <p>{analysis.premiumSuggestion}</p>
      <div className="list-grid compact-list">
        <InfoBlock title="Annonces détectées" text={analysis.detectedListings.join(' · ')} />
        <InfoBlock title="Points faibles" text={analysis.weaknesses.join(' · ')} />
        <InfoBlock title="Recommandations" text={analysis.recommendations.join(' · ')} />
      </div>
    </article>
  )
}

function defaultPropertyForm() {
  return {
    title: 'Appartement lumineux à Tarbes',
    city: 'Tarbes',
    price: '189 000 €',
    surface: '82 m²',
    rooms: '4',
    status: 'publié',
    shortDescription: 'Appartement lumineux, calme et proche du centre-ville.',
    longDescription:
      'Un bien prêt à présenter avec une pièce de vie lumineuse, une circulation fluide et un suivi vendeur clair.',
    approximateAddress: 'Centre-ville de Tarbes',
    mainPhotoUrl: '',
    secondaryPhotos: '',
    currentStep: 'Visites',
    nextVisit: 'Samedi 22 juin à 14h30',
    visitReport: 'Visite positive, acheteurs intéressés, retour attendu sous 48h.',
    visibleDocuments: 'Mandat signé, Diagnostics, Offre reçue',
  }
}

function propertyToForm(property?: Property) {
  if (!property) return defaultPropertyForm()

  return {
    title: property.title,
    city: property.city,
    price: property.price,
    surface: property.surface,
    rooms: property.rooms,
    status: property.status,
    shortDescription: property.shortDescription,
    longDescription: property.longDescription,
    approximateAddress: property.approximateAddress,
    mainPhotoUrl: property.mainPhotoUrl,
    secondaryPhotos: property.photos.join(', '),
    currentStep: property.currentStep,
    nextVisit: property.nextVisit,
    visitReport: property.visitReport,
    visibleDocuments: property.visibleDocuments.join(', '),
  }
}

function formToPropertyInput(agencyId: string, form: ReturnType<typeof defaultPropertyForm>): CreatePropertyInput {
  return {
    agencyId,
    title: form.title,
    city: form.city,
    price: form.price,
    surface: form.surface,
    rooms: form.rooms,
    status: form.status === 'brouillon' ? 'brouillon' : 'publié',
    shortDescription: form.shortDescription,
    longDescription: form.longDescription,
    approximateAddress: form.approximateAddress,
    mainPhotoUrl: form.mainPhotoUrl,
    photos: form.secondaryPhotos
      .split(',')
      .map((photo) => photo.trim())
      .filter(Boolean),
    currentStep: form.currentStep,
    nextVisit: form.nextVisit,
    visitReport: form.visitReport,
    visibleDocuments: form.visibleDocuments
      .split(',')
      .map((document) => document.trim())
      .filter(Boolean),
  }
}

function getPropertyAlerts(property: Property) {
  const alerts: { propertyId: string; propertyTitle: string; text: string }[] = []

  if (!property.visitReport.trim()) {
    alerts.push({
      propertyId: property.id,
      propertyTitle: property.title,
      text: 'Compte rendu manquant',
    })
  }

  if (!property.nextVisit.trim()) {
    alerts.push({
      propertyId: property.id,
      propertyTitle: property.title,
      text: 'Aucune visite programmee',
    })
  }

  if (!property.visitReport.trim() && !property.nextVisit.trim()) {
    alerts.push({
      propertyId: property.id,
      propertyTitle: property.title,
      text: 'Vendeur sans mise a jour recente',
    })
  }

  if (property.visibleDocuments.length === 0) {
    alerts.push({
      propertyId: property.id,
      propertyTitle: property.title,
      text: 'Document absent',
    })
  }

  return alerts
}

function StaticPropertyCard({
  onNavigate,
  showManageButton = true,
}: {
  onNavigate: Navigate
  showManageButton?: boolean
}) {
  return (
    <article className="property-card">
      <StaticPropertyPhoto />
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

function GeneratedPropertyCard({
  agencyId,
  property,
  onNavigate,
}: {
  agencyId: string
  property: Property
  onNavigate: Navigate
}) {
  return (
    <article className="property-card">
      <PropertyPhoto property={property} />
      <div className="property-content">
        <p className="eyebrow">{property.status}</p>
        <h2>{property.title}</h2>
        <p>{property.shortDescription}</p>
        <div className="property-stats">
          <span>{property.price}</span>
          <span>{property.surface}</span>
          <span>{property.rooms} pièces</span>
          <span>{property.currentStep}</span>
        </div>
        <button className="secondary-button compact" type="button" onClick={() => onNavigate(`/demo/immobilier/agence/${agencyId}/bien/${property.id}`)}>
          Gérer le bien
        </button>
      </div>
    </article>
  )
}

function StaticPropertyPhoto() {
  return (
    <div className="property-photo" role="img" aria-label={demoProperty.mainPhotoPlaceholder}>
      <span>{demoProperty.mainPhotoPlaceholder}</span>
    </div>
  )
}

function PropertyPhoto({ property }: { property: Property }) {
  if (property.mainPhotoUrl) {
    return (
      <div
        className="property-photo has-image"
        role="img"
        aria-label={property.title}
        style={{ backgroundImage: `linear-gradient(145deg, rgba(13, 31, 54, 0.18), rgba(217, 188, 125, 0.18)), url(${property.mainPhotoUrl})` }}
      >
        <span>{property.city}</span>
      </div>
    )
  }

  return (
    <div className="property-photo" role="img" aria-label={property.title}>
      <span>{property.city}</span>
    </div>
  )
}

function StepProgress({ currentStep }: { currentStep: string }) {
  return (
    <div className="step-list" aria-label="Progression de vente">
      {saleSteps.map((step) => (
        <span className={step === currentStep ? 'current' : ''} key={step}>
          {step}
        </span>
      ))}
    </div>
  )
}

function TrackingCards({
  property,
  onNavigate,
  backRoute,
  backLabel = 'Retour',
}: {
  property: Pick<Property, 'nextVisit' | 'visitReport' | 'visibleDocuments'> &
    Partial<Pick<Property, 'longDescription' | 'documents'>>
  onNavigate: Navigate
  backRoute: string
  backLabel?: string
}) {
  const [visibleSection, setVisibleSection] = useState<'description' | 'report' | 'documents'>('report')
  const [documentMessage, setDocumentMessage] = useState('')
  const sellerDocuments = property.documents?.length
    ? property.documents.filter((document) => document.visibleToSeller)
    : property.visibleDocuments.map((name) => ({
        id: name,
        name,
        type: 'Démo',
        url: '',
        visibleToSeller: true,
      }))

  function openDocument(document: PropertyDocument) {
    if (document.url) {
      window.open(document.url, '_blank')
      return
    }

    setDocumentMessage('Document de démonstration')
  }

  function downloadDocument(document: PropertyDocument) {
    if (document.url) {
      window.open(document.url, '_blank')
      return
    }

    setDocumentMessage('Téléchargement simulé')
  }

  return (
    <>
      <div className="card-grid">
        <article className="info-card">
          <h2>Prochaine visite</h2>
          <p>{property.nextVisit}</p>
        </article>
        <article className="info-card">
          <h2>Compte rendu</h2>
          <p>{property.visitReport}</p>
        </article>
      </div>

      <article className="demo-panel">
        <p className="eyebrow">Documents visibles</p>
        <div className="inline-actions">
          <button className="secondary-button compact" type="button" onClick={() => setVisibleSection('description')}>
            Voir description du bien
          </button>
          <button className="secondary-button compact" type="button" onClick={() => setVisibleSection('report')}>
            Voir compte rendu
          </button>
          <button className="secondary-button compact" type="button" onClick={() => setVisibleSection('documents')}>
            Voir documents
          </button>
        </div>
        {visibleSection === 'description' && (
          <p>{property.longDescription ?? 'Description détaillée du bien disponible dans l’annonce publique.'}</p>
        )}
        {visibleSection === 'report' && <p>{property.visitReport}</p>}
        <div className="document-list">
          {sellerDocuments.map((document) => (
            <span key={document.id}>{document.name}</span>
          ))}
        </div>
        {visibleSection === 'documents' && (
          <div className="list-grid compact-list">
            {sellerDocuments.map((document) => (
              <article className="list-card" key={document.id}>
                <div>
                  <p className="eyebrow">{document.type}</p>
                  <h2>{document.name}</h2>
                </div>
                <div className="inline-actions">
                  <button className="secondary-button compact" type="button" onClick={() => openDocument(document)}>
                    Ouvrir document
                  </button>
                  <button className="secondary-button compact" type="button" onClick={() => downloadDocument(document)}>
                    T?l?charger document
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
        {documentMessage && <p className="save-message">{documentMessage}</p>}
        <div className="inline-actions">
          <button className="secondary-button compact" type="button" onClick={() => onNavigate(backRoute)}>
            {backLabel}
          </button>
        </div>
      </article>
    </>
  )
}

function staticPropertyToGenerated(): Pick<Property, 'nextVisit' | 'visitReport' | 'visibleDocuments'> {
  return {
    nextVisit: sellerTracking.nextVisit,
    visitReport: sellerTracking.shortReport,
    visibleDocuments: sellerTracking.visibleDocuments,
  }
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric-card">
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  )
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <article className="info-card">
      <h2>{title}</h2>
      <p>{text}</p>
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

function MissingView({
  title,
  onNavigate,
  backRoute = '/admin/agences',
  backLabel = 'Retour aux agences',
}: {
  title: string
  onNavigate: Navigate
  backRoute?: string
  backLabel?: string
}) {
  function resetLocalDemo() {
    resetDemoData()
    onNavigate('/admin')
    window.location.reload()
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>{title}</h1>
        <p className="subtitle">La donnée locale demandée n’existe pas ou a été réinitialisée.</p>
      </div>
      <div className="actions">
        <button className="secondary-button" type="button" onClick={() => onNavigate(backRoute)}>
          {backLabel}
        </button>
        <button className="secondary-button" type="button" onClick={() => onNavigate('/admin/agences/new')}>
          Créer une agence
        </button>
        <button className="secondary-button" type="button" onClick={resetLocalDemo}>
          Réinitialiser les données locales
        </button>
      </div>
    </section>
  )
}

function InactiveAgencyView({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Agence désactivée</h1>
        <p className="subtitle">Cet espace local est désactivé pour le moment.</p>
      </div>
      <button className="secondary-button" type="button" onClick={() => onNavigate('/admin/agences')}>
        Retour admin
      </button>
    </section>
  )
}

function NotFoundView({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Page introuvable</h1>
        <p className="subtitle">Cette route locale n’est pas encore déclarée.</p>
      </div>
      <button className="secondary-button" type="button" onClick={() => onNavigate('/admin')}>
        Retour au Studio
      </button>
    </section>
  )
}

export default App
