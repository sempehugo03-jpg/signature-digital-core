import { useMemo, useState } from 'react'
import type { Project, ProjectStatus } from '../../data/projectStore'
import { formatDate } from '../../data/projectStore'
import { Card, SectionTitle, StatusBadge } from '../shared/DesignSystem'

type Navigate = (route: string) => void
type ProjectFilter = ProjectStatus | 'Tous' | 'Démo prête'

const filters: ProjectFilter[] = [
  'Tous',
  'Demande reçue',
  'À analyser',
  'Démo à créer',
  'Démo prête',
  'Paiement envoyé',
  'Paiement reçu',
  'Activé',
]

export function ProjectList({ projects, onNavigate }: { projects: Project[]; onNavigate: Navigate }) {
  const [filter, setFilter] = useState<ProjectFilter>('Tous')
  const visibleProjects = useMemo(() => projects.filter((project) => (
    filter === 'Tous' ||
    project.status === filter ||
    (filter === 'Démo prête' && (project.status === 'Démo visuelle prête' || project.status === 'Démo vivante prête'))
  )), [filter, projects])

  return (
    <div className="admin-view">
      <SectionTitle eyebrow="Projets" title="Toutes les demandes Signature Digital." text="Filtrez les projets par statut et ouvrez la fiche complète." />
      <div className="filter-row">
        {filters.map((item) => (
          <button className={filter === item ? 'active' : ''} key={item} type="button" onClick={() => setFilter(item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="project-list">
        {visibleProjects.map((project) => (
          <Card className="project-card" key={project.id}>
            <div>
              <h2>{project.companyName}</h2>
              <p>{project.sector} · {project.city}</p>
              <small>{project.pain}</small>
            </div>
            <div className="project-card-meta">
              <StatusBadge status={project.status} />
              <span>{formatDate(project.createdAt)}</span>
              <button type="button" onClick={() => onNavigate(`/admin/projets/${project.id}`)}>Ouvrir</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
