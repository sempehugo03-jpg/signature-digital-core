import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { AdminCockpit } from './components/admin/AdminCockpit'
import { AdminLogin } from './components/admin/AdminLogin'
import { ProjectDetail } from './components/admin/ProjectDetail'
import { ProjectList } from './components/admin/ProjectList'
import { AnalysisFunnel, ConfirmationPage } from './components/funnel/AnalysisFunnel'
import { PublicHome } from './components/public/PublicHome'
import { AdminLayout, PublicLayout } from './components/shared/Layouts'
import { isAdminAuthenticated, logoutAdmin } from './auth/adminAuth'
import { getProject, readProjects, updateProject } from './data/projectStore'
import type { Project } from './data/projectStore'

function getRoute() {
  return window.location.pathname
}

function App() {
  const [route, setRoute] = useState(getRoute)
  const [projectsVersion, setProjectsVersion] = useState(0)
  const [adminLoggedIn, setAdminLoggedIn] = useState(isAdminAuthenticated)
  const projects = useMemo(() => readProjects(), [projectsVersion])
  const normalizedAdminRoute = normalizeAdminRoute(route)
  const selectedProjectId = normalizedAdminRoute.match(/^\/admin\/projects\/([^/]+)$/)?.[1]
  const selectedProject = selectedProjectId ? getProject(selectedProjectId) : undefined

  useEffect(() => {
    const handlePopState = () => setRoute(getRoute())
    window.addEventListener('popstate', handlePopState)

    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

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
    navigate('/admin/cockpit')
  }

  function logout() {
    logoutAdmin()
    setAdminLoggedIn(false)
    navigate('/admin')
  }

  function updateSelectedProject(updates: Partial<Project>) {
    if (!selectedProjectId) return
    updateProject(selectedProjectId, updates)
    refreshProjects()
  }

  if (route.startsWith('/admin')) {
    if (!adminLoggedIn) {
      if (route !== '/admin') {
        window.history.replaceState({}, '', '/admin')
      }

      return <AdminLogin onLogin={login} onNavigate={navigate} />
    }

    const adminRouteHandled = normalizedAdminRoute === '/admin' ||
      normalizedAdminRoute === '/admin/cockpit' ||
      normalizedAdminRoute === '/admin/projects' ||
      Boolean(selectedProjectId)

    return (
      <AdminLayout onNavigate={navigate} onLogout={logout}>
        {(normalizedAdminRoute === '/admin' || normalizedAdminRoute === '/admin/cockpit') && (
          <AdminCockpit projects={projects} onNavigate={navigate} />
        )}
        {normalizedAdminRoute === '/admin/projects' && <ProjectList projects={projects} onNavigate={navigate} />}
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

  return (
    <PublicLayout onNavigate={navigate}>
      {route === '/' && <PublicHome onNavigate={navigate} />}
      {route === '/analyser-mon-site' && <AnalysisFunnel onNavigate={navigate} onCompleted={refreshProjects} />}
      {route === '/confirmation' && <ConfirmationPage />}
      {!['/', '/analyser-mon-site', '/confirmation'].includes(route) && (
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

function normalizeAdminRoute(route: string) {
  if (route === '/admin/projets') return '/admin/projects'
  if (route.startsWith('/admin/projets/')) return route.replace('/admin/projets/', '/admin/projects/')

  return route
}

export default App
