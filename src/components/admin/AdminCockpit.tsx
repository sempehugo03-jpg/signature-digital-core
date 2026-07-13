import type { Project, ProjectStatus } from '../../data/projectStore'
import { countsAsPayingClient, getProjectKindLabel, normalizeProjectKind, projectStatusLabels } from '../../data/projectStore'
import { Card, SectionTitle, StatusBadge } from '../shared/DesignSystem'

type Navigate = (route: string) => void

const cockpitMetrics: Array<[string, ProjectStatus]> = [
  ['Demandes reçues', 'request_received'],
  ['Analyses à faire', 'analysis_to_do'],
  ['Démos prêtes', 'lovable_demo_ready'],
  ['Démos envoyées', 'demo_sent'],
  ['Démos validées', 'demo_validated'],
  ['Démos vivantes à préparer', 'live_demo_to_prepare'],
  ['Projets actifs', 'active'],
]

export function AdminCockpit({ projects, onNavigate }: { projects: Project[]; onNavigate: Navigate }) {
  const sortedProjects = [...projects].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const commercialProjects = projects.filter((project) => normalizeProjectKind(project.projectKind) !== 'internal-test')
  const internalTestProjects = projects.filter((project) => normalizeProjectKind(project.projectKind) === 'internal-test')
  const pilotProjects = projects.filter((project) => normalizeProjectKind(project.projectKind) === 'pilot')
  const payingActiveClients = projects.filter((project) => countsAsPayingClient(project) && (project.status === 'activated' || project.status === 'active')).length
  const waitingPayments = projects.filter((project) => countsAsPayingClient(project) && (project.paymentSimpleStatus === 'en attente' || project.paymentSimpleStatus === 'acompte reçu')).length

  return (
    <div className="admin-view">
      <SectionTitle
        eyebrow="Cockpit admin"
        title="Suivre les demandes et avancer chaque démo simplement."
        text="Demande client, prompt Lovable, démo Lovable, mail, validation, puis préparation vivante."
      />

      <div className="metric-grid">
        {cockpitMetrics.map(([label, status]) => (
          <Card className="metric-card" key={status}>
            <span>{label}</span>
            <strong>{commercialProjects.filter((project) => project.status === status).length}</strong>
          </Card>
        ))}
        <Card className="metric-card">
          <span>Clients payants actifs</span>
          <strong>{payingActiveClients}</strong>
        </Card>
        <Card className="metric-card">
          <span>Agences pilotes</span>
          <strong>{pilotProjects.length}</strong>
        </Card>
        <Card className="metric-card">
          <span>Tests internes</span>
          <strong>{internalTestProjects.length}</strong>
        </Card>
        <Card className="metric-card">
          <span>Paiements en attente</span>
          <strong>{waitingPayments}</strong>
        </Card>
      </div>

      <section className="next-actions">
        <div className="inline-title">
          <SectionTitle title="Prochaines actions" text="Ouvrir une fiche, copier le résumé ou avancer le statut." />
          <button type="button" onClick={() => onNavigate('/admin/projects')}>Voir tous les projets</button>
        </div>
        <Card className="action-list">
          {sortedProjects.slice(0, 8).map((project) => (
            <button key={project.id} type="button" onClick={() => onNavigate(`/admin/projects/${project.id}`)}>
              <span>
                <strong>{project.companyName}</strong>
                <small>{project.sector} · {project.city} · {getProjectKindLabel(project.projectKind)}</small>
                <small>{project.nextAction || projectStatusLabels[project.status]}</small>
              </span>
              <StatusBadge status={project.status} />
            </button>
          ))}
        </Card>
      </section>
    </div>
  )
}
