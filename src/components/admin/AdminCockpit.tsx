import type { Project } from '../../data/projectStore'
import { Card, SectionTitle, StatusBadge } from '../shared/DesignSystem'

type Navigate = (route: string) => void

export function AdminCockpit({ projects, onNavigate }: { projects: Project[]; onNavigate: Navigate }) {
  const latest = [...projects].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  const metrics = [
    ['Demandes reçues', projects.filter((project) => project.status === 'Demande reçue').length],
    ['Démos à créer', projects.filter((project) => project.status.includes('créer') || project.status === 'À analyser').length],
    ['Démos prêtes', projects.filter((project) => project.status.includes('prête') || project.status.includes('validé')).length],
    ['Paiements en attente', projects.filter((project) => project.paymentStatus !== 'reçu').length],
    ['Projets activés', projects.filter((project) => project.status === 'Activé').length],
  ]

  return (
    <div className="admin-view">
      <SectionTitle
        eyebrow="Cockpit admin"
        title="Piloter les demandes, les démos, les paiements et les activations."
        text="Un espace privé pour suivre chaque projet sans exposer l’admin au parcours prospect."
      />

      {latest && (
        <Card className="latest-card">
          <p className="sd-eyebrow">Dernière demande reçue</p>
          <h2>{latest.companyName}</h2>
          <p>{latest.sector} · {latest.city}</p>
          <div className="diagnostic-lines">
            <span>Douleur principale</span>
            <strong>{latest.pain}</strong>
            <span>Objectif principal</span>
            <strong>{latest.goal}</strong>
          </div>
          <button className="sd-button sd-button-primary" type="button" onClick={() => onNavigate(`/admin/projets/${latest.id}`)}>
            Préparer la démo →
          </button>
        </Card>
      )}

      <div className="metric-grid">
        {metrics.map(([label, value]) => (
          <Card className="metric-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </Card>
        ))}
      </div>

      <section className="next-actions">
        <div className="inline-title">
          <SectionTitle title="Prochaines actions" text="Les projets à faire avancer." />
          <button type="button" onClick={() => onNavigate('/admin/projets')}>Voir tous les projets</button>
        </div>
        <Card className="action-list">
          {projects.slice(0, 5).map((project) => (
            <button key={project.id} type="button" onClick={() => onNavigate(`/admin/projets/${project.id}`)}>
              <span>
                <strong>{project.companyName}</strong>
                <small>{project.sector} · {project.city}</small>
              </span>
              <StatusBadge status={project.status} />
            </button>
          ))}
        </Card>
      </section>
    </div>
  )
}
