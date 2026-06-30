import type { Project, ProjectStatus } from '../../data/projectStore'
import { projectStatusLabels } from '../../data/projectStore'
import { Card, SectionTitle, StatusBadge } from '../shared/DesignSystem'

type Navigate = (route: string) => void

const cockpitMetrics: Array<[string, ProjectStatus]> = [
  ['Demandes reçues', 'request_received'],
  ['Analyses à faire', 'analysis_to_do'],
  ['Démos prêtes', 'lovable_demo_ready'],
  ['Démos envoyées', 'demo_sent'],
  ['Démos validées', 'demo_validated'],
  ['Démos vivantes à préparer', 'live_demo_to_prepare'],
  ['Clients actifs', 'active'],
]

export function AdminCockpit({ projects, onNavigate }: { projects: Project[]; onNavigate: Navigate }) {
  const sortedProjects = [...projects].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const waitingPayments = projects.filter((project) => project.paymentSimpleStatus === 'en attente' || project.paymentSimpleStatus === 'acompte reçu').length

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
            <strong>{projects.filter((project) => project.status === status).length}</strong>
          </Card>
        ))}
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
                <small>{project.sector} · {project.city}</small>
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
