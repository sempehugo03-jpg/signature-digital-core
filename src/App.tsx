import { useEffect, useState } from 'react'
import './App.css'
import { AdminCockpit } from './components/admin/AdminCockpit'
import { AdminEmails } from './components/admin/AdminEmails'
import { AdminLogin } from './components/admin/AdminLogin'
import { AdminTemplates } from './components/admin/AdminTemplates'
import { ModuleEngineAdmin } from './components/admin/ModuleEngineAdmin'
import { ProjectDetail } from './components/admin/ProjectDetail'
import { ProjectList } from './components/admin/ProjectList'
import { AnalysisFunnel, ConfirmationPage } from './components/funnel/AnalysisFunnel'
import { ActivationPage } from './components/public/ActivationPage'
import { ClientTrackingPage } from './components/public/ClientTrackingPage'
import { DemoReadyPage } from './components/public/DemoReadyPage'
import { InviteAccessPage } from './components/public/InviteAccessPage'
import { PublicHome } from './components/public/PublicHome'
import { OpusDomusTemplate } from './components/demo-template-immobilier/OpusDomusTemplate'
import { AdminLayout, PublicLayout } from './components/shared/Layouts'
import { loginClientSpace } from './auth/clientAuth'
import { isAdminAuthenticated, logoutAdmin } from './auth/adminAuth'
import { createProject, getProject, getProjectByTrackingToken, readProjects, updateProject, updateProjectByTrackingToken } from './data/projectStore'
import type { Project } from './data/projectStore'
import {
  getRealEstateAgencyRuntimeByHostname,
  getRealEstateAgencyRuntimeBySlug,
  getRequiredModuleForRealEstateView,
  isModuleEnabled,
  realEstateModuleUnavailableMessage,
} from './data/realEstateAgencyConfig'
import { enqueueAndSendEmailEvent } from './lib/emailEventSystem'

function getRoute() {
  return window.location.pathname
}

function App() {
  const [route, setRoute] = useState(getRoute)
  const [, setProjectsVersion] = useState(0)
  const [adminLoggedIn, setAdminLoggedIn] = useState(isAdminAuthenticated)
  const projects = readProjects()
  const normalizedAdminRoute = normalizeAdminRoute(route)
  const selectedProjectId = normalizedAdminRoute.match(/^\/admin\/projects\/([^/]+)$/)?.[1]
  const selectedProject = selectedProjectId ? getProject(selectedProjectId) : undefined
  const trackingToken = route.match(/^\/suivi\/([^/]+)$/)?.[1]
  const trackingProject = trackingToken ? getProjectByTrackingToken(trackingToken) : undefined
  const demoReadyToken = route.match(/^\/demo-ready\/([^/]+)$/)?.[1]
  const demoReadyProject = demoReadyToken ? getProjectByTrackingToken(demoReadyToken) : undefined
  const activationToken = route.match(/^\/activation\/([^/]+)$/)?.[1]
  const activationProject = activationToken
    ? getProjectByTrackingToken(activationToken) ?? projects.find((project) => project.generatedAgencyId === activationToken)
    : undefined
  const paymentSuccess = route === '/paiement/succes'
  const paymentCancel = route === '/paiement/annule'
  const paymentProjectId = paymentSuccess || paymentCancel
    ? new URLSearchParams(window.location.search).get('projectId') ?? ''
    : ''
  const paymentProject = paymentProjectId ? getProject(paymentProjectId) : undefined
  const inviteToken = route.match(/^\/creer-acces\/([^/]+)$/)?.[1]
  const realEstateDemoMatch = route.match(/^\/demo\/([^/]+)(?:\/(estimation|connexion|vendeur|agent|patron|biens|invitation|bien\/([^/]+)))?$/)
  const realEstateAgencySlug = realEstateDemoMatch?.[1]
  const hostnameAgencyRuntime = !realEstateAgencySlug && typeof window !== 'undefined'
    ? getRealEstateAgencyRuntimeByHostname(window.location.hostname)
    : undefined
  const hostnameRouteMatch = hostnameAgencyRuntime
    ? route.match(/^\/(?:((?:estimation|connexion|vendeur|agent|patron|biens|invitation)|bien\/([^/]+)))?$/)
    : undefined
  const hasHostnameAgencyRoute = Boolean(hostnameAgencyRuntime && hostnameRouteMatch)
  const realEstateRoutePart = realEstateDemoMatch?.[2] ?? hostnameRouteMatch?.[1] ?? 'public'
  const realEstateView = (realEstateRoutePart.startsWith('bien/') ? 'bien' : realEstateRoutePart) as 'public' | 'estimation' | 'connexion' | 'vendeur' | 'agent' | 'patron' | 'biens' | 'bien' | 'invitation'
  const realEstatePropertyId = realEstateDemoMatch?.[3] ?? hostnameRouteMatch?.[2]
  const resolvedRealEstateAgencySlug = realEstateAgencySlug ?? hostnameAgencyRuntime?.modelConfig.agencySlug
  const realEstateProject = resolvedRealEstateAgencySlug
    ? projects.find((project) => project.generatedAgencyId === resolvedRealEstateAgencySlug)
    : undefined
  const [lastSubmittedProjectId, setLastSubmittedProjectId] = useState(() => (
    window.sessionStorage.getItem('signature-digital-last-project') ?? ''
  ))
  const lastSubmittedProject = lastSubmittedProjectId ? getProject(lastSubmittedProjectId) : undefined

  useEffect(() => {
    const handlePopState = () => setRoute(getRoute())
    window.addEventListener('popstate', handlePopState)

    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (!paymentProject) return
    if (paymentSuccess && paymentProject.stripeCheckout.status !== 'confirmation-required') {
      updateProject(paymentProject.id, {
        stripeCheckout: {
          ...paymentProject.stripeCheckout,
          status: 'confirmation-required',
        },
        paymentSimpleStatus: 'en attente',
        lastClientAction: 'Retour Stripe succes consulte',
        nextAction: 'Attendre le webhook Stripe avant toute activation.',
      })
      refreshProjects()
    }
    if (paymentCancel && paymentProject.stripeCheckout.status !== 'cancelled') {
      updateProject(paymentProject.id, {
        stripeCheckout: {
          ...paymentProject.stripeCheckout,
          status: 'cancelled',
        },
        lastClientAction: 'Paiement Stripe annule',
        nextAction: 'Reprendre le paiement depuis la page activation.',
      })
      refreshProjects()
    }
  }, [paymentCancel, paymentProject, paymentSuccess])

  function navigate(nextRoute: string) {
    if (nextRoute.includes('#')) {
      const [path, hash] = nextRoute.split('#')
      window.history.pushState({}, '', nextRoute)
      setRoute(path || '/')
      requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }))
      return
    }

    window.history.pushState({}, '', nextRoute)
    setRoute(nextRoute)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function refreshProjects() {
    setProjectsVersion((version) => version + 1)
  }

  function login() {
    setAdminLoggedIn(true)
    navigate('/admin')
  }

  function logout() {
    logoutAdmin()
    setAdminLoggedIn(false)
    navigate('/connexion')
  }

  function updateSelectedProject(updates: Partial<Project>) {
    if (!selectedProjectId) return
    updateProject(selectedProjectId, updates)
    refreshProjects()
  }

  function updateTrackingProject(updates: Partial<Project>) {
    if (!trackingToken) return
    updateProjectByTrackingToken(trackingToken, updates)
    refreshProjects()
  }

  function updateDemoReadyProject(updates: Partial<Project>) {
    if (!demoReadyToken) return
    updateProjectByTrackingToken(demoReadyToken, updates)
    refreshProjects()
  }

  function updateActivationProject(updates: Partial<Project>) {
    if (!activationToken) return
    if (activationProject) {
      updateProject(activationProject.id, updates)
    } else {
      updateProjectByTrackingToken(activationToken, updates)
    }
    refreshProjects()
  }

  function completeFunnel(projectId: string) {
    window.sessionStorage.setItem('signature-digital-last-project', projectId)
    setLastSubmittedProjectId(projectId)
    refreshProjects()
  }

  function createAdminProject() {
    const project = createProject({
      companyName: 'Nouveau projet',
      sector: 'Immobilier',
      city: '',
      hasWebsite: false,
      currentWebsite: '',
      businessDescription: '',
      pain: '',
      pains: [],
      goal: '',
      goals: [],
      diagnosticPriority: '',
      diagnosticBlocker: '',
      desiredFeeling: '',
      diagnosticGoal: '',
      targetClient: '',
      freeText: '',
      features: [],
      style: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      message: '',
    })

    updateProject(project.id, {
      status: 'draft',
      internalNotes: [
        'Projet cree depuis Admin / Projets.',
        'Aucune agence n est creee avant le clic Creer la demo moteur.',
      ].join('\n'),
      nextAction: 'Completer le brief client puis preparer le prompt Lovable.',
      lastClientAction: 'Projet cree depuis admin',
    })
    refreshProjects()
    navigate(`/admin/projects/${project.id}`)
  }

  function createClientSpace(projectId: string, email: string) {
    const updatedProject = updateProject(projectId, {
      email,
      clientSpaceCreated: true,
      emailLog: {
        ...(getProject(projectId)?.emailLog ?? {}),
      } as Project['emailLog'],
      lastClientAction: 'Espace de suivi créé',
    })

    if (updatedProject) {
      enqueueAndSendEmailEvent({ event: 'project-request-received', project: updatedProject })
    }

    refreshProjects()
  }

  if (route.startsWith('/admin')) {
    if (!adminLoggedIn) {
      window.history.replaceState({}, '', '/connexion')
      return <AdminLogin onLogin={login} onNavigate={navigate} />
    }

    const adminRouteHandled = normalizedAdminRoute === '/admin' ||
      normalizedAdminRoute === '/admin/cockpit' ||
      normalizedAdminRoute === '/admin/projects' ||
      normalizedAdminRoute === '/admin/emails' ||
      normalizedAdminRoute === '/admin/modules' ||
      normalizedAdminRoute === '/admin/templates' ||
      Boolean(selectedProjectId)

    return (
      <AdminLayout onNavigate={navigate} onLogout={logout}>
        {(normalizedAdminRoute === '/admin' || normalizedAdminRoute === '/admin/cockpit') && (
          <AdminCockpit projects={projects} onNavigate={navigate} />
        )}
        {normalizedAdminRoute === '/admin/projects' && <ProjectList projects={projects} onNavigate={navigate} onCreateProject={createAdminProject} />}
        {normalizedAdminRoute === '/admin/emails' && <AdminEmails />}
        {normalizedAdminRoute === '/admin/modules' && <ModuleEngineAdmin />}
        {normalizedAdminRoute === '/admin/templates' && <AdminTemplates />}
        {selectedProjectId && selectedProject && (
          <ProjectDetail project={selectedProject} onNavigate={navigate} onUpdate={updateSelectedProject} />
        )}
        {selectedProjectId && !selectedProject && (
          <div className="admin-view">
            <h1>Projet introuvable</h1>
            <button className="sd-button sd-button-secondary" type="button" onClick={() => navigate('/admin/projects')}>
              Retour aux projets
            </button>
          </div>
        )}
        {!adminRouteHandled && (
          <div className="admin-view">
            <h1>Page admin introuvable</h1>
            <button className="sd-button sd-button-secondary" type="button" onClick={() => navigate('/admin/cockpit')}>
              Retour cockpit
            </button>
          </div>
        )}
      </AdminLayout>
    )
  }

  if (route === '/connexion') {
    return <AdminLogin onLogin={login} onNavigate={navigate} />
  }

  if (realEstateAgencySlug || hasHostnameAgencyRoute) {
    const agencyRuntime = hasHostnameAgencyRoute ? hostnameAgencyRuntime : getRealEstateAgencyRuntimeBySlug(realEstateAgencySlug ?? '')

    if (agencyRuntime) {
      if (agencyRuntime.modelConfig.status === 'paused') {
        return <RealEstateAgencyStatusPage title="Cette agence est temporairement indisponible." onNavigate={navigate} />
      }

      if (agencyRuntime.modelConfig.status === 'archived') {
        return <RealEstateAgencyStatusPage title="Cette agence n'est plus disponible." onNavigate={navigate} />
      }

      const requiredModule = getRequiredModuleForRealEstateView(realEstateView)
      if (requiredModule && !isModuleEnabled(agencyRuntime.modelConfig, requiredModule)) {
        return <RealEstateAgencyStatusPage title={realEstateModuleUnavailableMessage} onNavigate={navigate} />
      }

      return (
        <OpusDomusTemplate
          key={agencyRuntime.agencyConfig.agencySlug}
          agencyConfig={agencyRuntime.agencyConfig}
          view={realEstateView}
          propertyId={realEstatePropertyId}
          activationHref={realEstateProject ? `/activation/${realEstateProject.trackingToken}` : `/activation/${agencyRuntime.modelConfig.agencySlug}`}
          onNavigate={navigate}
        />
      )
    }

    return <RealEstateAgencyStatusPage title="Agence immobiliere introuvable." onNavigate={navigate} />
  }

  return (
    <PublicLayout onNavigate={navigate}>
      {route === '/' && <PublicHome onNavigate={navigate} />}
      {route === '/analyser-mon-site' && <AnalysisFunnel onNavigate={navigate} onCompleted={completeFunnel} />}
      {route === '/confirmation' && (
        <ConfirmationPage
          project={lastSubmittedProject}
          onNavigate={navigate}
          onCreateSpace={createClientSpace}
          onOpenSpace={(projectId, email) => {
            loginClientSpace(projectId, email)
            navigate(`/suivi/${projectId}`)
          }}
        />
      )}
      {trackingToken && trackingProject && (
        <ClientTrackingPage project={trackingProject} onUpdate={updateTrackingProject} />
      )}
      {demoReadyToken && demoReadyProject && (
        <DemoReadyPage project={demoReadyProject} onUpdate={updateDemoReadyProject} />
      )}
      {activationToken && activationProject && (
        <ActivationPage project={activationProject} onUpdate={updateActivationProject} />
      )}
      {paymentSuccess && (
        <PaymentReturnPage
          title="Paiement reçu par Stripe. Activation en cours de confirmation."
          text="Le webhook Stripe confirmera le paiement avant toute activation technique."
          actionLabel="Retour au suivi"
          onAction={() => navigate(paymentProject ? `/suivi/${paymentProject.trackingToken || paymentProject.id}` : '/')}
        />
      )}
      {paymentCancel && (
        <PaymentReturnPage
          title="Paiement annule"
          text="Aucune donnee n'a ete perdue. Vous pouvez reprendre le paiement depuis la page d'activation."
          actionLabel="Reprendre l'activation"
          onAction={() => navigate(paymentProject ? `/activation/${paymentProject.trackingToken || paymentProject.id}` : '/')}
        />
      )}
      {inviteToken && (
        <InviteAccessPage token={inviteToken} onNavigate={navigate} />
      )}
      {trackingToken && !trackingProject && (
        <main className="not-found">
          <h1>Suivi introuvable</h1>
          <button className="sd-button sd-button-primary" type="button" onClick={() => navigate('/')}>
            Retour à l’accueil
          </button>
        </main>
      )}
      {demoReadyToken && !demoReadyProject && (
        <main className="not-found">
          <h1>Démo introuvable</h1>
          <button className="sd-button sd-button-primary" type="button" onClick={() => navigate('/')}>
            Retour à l’accueil
          </button>
        </main>
      )}
      {activationToken && !activationProject && (
        <main className="not-found">
          <h1>Activation introuvable</h1>
          <button className="sd-button sd-button-primary" type="button" onClick={() => navigate('/')}>
            Retour à l’accueil
          </button>
        </main>
      )}
      {!['/', '/connexion', '/analyser-mon-site', '/confirmation', '/paiement/succes', '/paiement/annule'].includes(route) && !realEstateAgencySlug && !hasHostnameAgencyRoute && !trackingToken && !demoReadyToken && !activationToken && !inviteToken && (
        <main className="not-found">
          <h1>Page introuvable</h1>
          <button className="sd-button sd-button-primary" type="button" onClick={() => navigate('/')}>
            Retour à l’accueil
          </button>
        </main>
      )}
    </PublicLayout>
  )
}

function PaymentReturnPage({ title, text, actionLabel, onAction }: { title: string; text: string; actionLabel: string; onAction: () => void }) {
  return (
    <main className="activation-page">
      <section className="tracking-hero">
        <div>
          <p className="sd-eyebrow">Stripe Checkout</p>
          <h1>{title}</h1>
          <p>{text}</p>
          <button className="sd-button sd-button-primary" type="button" onClick={onAction}>
            {actionLabel}
          </button>
        </div>
      </section>
    </main>
  )
}

function RealEstateAgencyStatusPage({ title, onNavigate }: { title: string; onNavigate: (route: string) => void }) {
  return (
    <main className="not-found">
      <h1>{title}</h1>
      <button className="sd-button sd-button-primary" type="button" onClick={() => onNavigate('/')}>
        Retour a l'accueil
      </button>
    </main>
  )
}

function normalizeAdminRoute(route: string) {
  if (route === '/admin/projets') return '/admin/projects'
  if (route.startsWith('/admin/projets/')) return route.replace('/admin/projets/', '/admin/projects/')

  return route
}

export default App
