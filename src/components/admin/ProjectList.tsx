import { useMemo, useState } from 'react'
import type { Project, ProjectStatus } from '../../data/projectStore'
import { formatDate, projectStatusLabels } from '../../data/projectStore'
import { Card, SectionTitle, StatusBadge } from '../shared/DesignSystem'

type Navigate = (route: string) => void
type ProjectFilter = ProjectStatus | 'all'

const filters: ProjectFilter[] = [
  'all',
  'request_received',
  'analysis_to_do',
  'lovable_demo_ready',
  'demo_sent',
  'demo_validated',
  'live_demo_to_prepare',
  'active',
]

export function ProjectList({ projects, onNavigate }: { projects: Project[]; onNavigate: Navigate }) {
  const [filter, setFilter] = useState<ProjectFilter>('all')
  const visibleProjects = useMemo(() => projects.filter((project) => (
    filter === 'all' || project.status === filter
  )), [filter, projects])

  return (
    <div className="admin-view">
      <SectionTitle eyebrow="Projets" title="Demandes Signature Digital." text="Chaque fiche suit le workflow simple jusqu’à la démo vivante." />
      <div className="filter-row">
        {filters.map((item) => (
          <button className={filter === item ? 'active' : ''} key={item} type="button" onClick={() => setFilter(item)}>
            {item === 'all' ? 'Tous' : projectStatusLabels[item]}
          </button>
        ))}
      </div>
      <div className="project-list">
        {visibleProjects.map((project) => (
          <Card className="project-card" key={project.id}>
            <div>
              <h2>{project.companyName}</h2>
              <p>{project.sector} · {project.city}</p>
              <small>{project.nextAction || project.pain}</small>
            </div>
            <div className="project-card-meta">
              <StatusBadge status={project.status} />
              <span>{formatDate(project.createdAt)}</span>
              <button type="button" onClick={() => onNavigate(`/admin/projects/${project.id}`)}>Ouvrir</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
