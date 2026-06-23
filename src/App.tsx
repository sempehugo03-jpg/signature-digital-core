import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { AdminCockpit } from './components/admin/AdminCockpit'
import { AdminLogin } from './components/admin/AdminLogin'
import { ProjectDetail } from './components/admin/ProjectDetail'
import { ProjectList } from './components/admin/ProjectList'
import { AnalysisFunnel, ConfirmationPage } from './components/funnel/AnalysisFunnel'
import { PublicHome } from './components/public/PublicHome'
import { AdminLayout, PublicLayout } from './components/shared/Layouts'
import { getProject, readProjects, updateProject } from './data/projectStore'
import type { Project } from './data/projectStore'

function getRoute() {
  return window.location.pathname
}

function isAdminLoggedIn() {
  return window.sessionStorage.getItem('signature-digital-admin') === 'connected'
}

function App() {
  const [route, setRoute] = useState(getRoute)
  const [projectsVersion, setProjectsVersion] = useState(0)
  const [adminLoggedIn, setAdminLoggedIn] = useState(isAdminLoggedIn)
  const projects = useMemo(() => readProjects(), [projectsVersion])
  const selectedProjectId = route.match(/^\/admin\/projets\/([^/]+)$/)?.[1]
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
    window.sessionStorage.setItem('signature-digital-admin', 'connected')
    setAdminLoggedIn(true)
  }

  function logout() {
    window.sessionStorage.removeItem('signature-digital-admin')
    setAdminLoggedIn(false)
    navigate('/')
  }

  function updateSelectedProject(updates: Partial<Project>) {
    if (!selectedProjectId) return
    updateProject(selectedProjectId, updates)
    refreshProjects()
  }

  if (route.startsWith('/admin')) {
    if (!adminLoggedIn) {
      return <AdminLogin onLogin={login} onNavigate={navigate} />
    }

    return (
      <AdminLayout onNavigate={navigate} onLogout={logout}>
        {route === '/admin' && <AdminCockpit projects={projects} onNavigate={navigate} />}
        {route === '/admin/projets' && <ProjectList projects={projects} onNavigate={navigate} />}
        {selectedProjectId && selectedProject && (
          <ProjectDetail project={selectedProject} onNavigate={navigate} onUpdate={updateSelectedProject} />
        )}
        {selectedProjectId && !selectedProject && (
          <div className="admin-view">
            <h1>Projet introuvable</h1>
            <button className="sd-button sd-button-secondary" type="button" onClick={() => navigate('/admin/projets')}>
              Retour aux projets
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

export default App
