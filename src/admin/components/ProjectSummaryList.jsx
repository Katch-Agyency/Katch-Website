import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { formatDate } from '../utils/formatters';

export function ProjectSummaryList({ projects }) {
  return (
    <div className="admin-project-summary-list">
      {projects.map((project) => (
        <Link to={`/admin/projects/${project.id}`} key={project.id}>
          <div className="admin-project-person">
            <strong>{project.name}</strong>
            <span>{project.company}</span>
          </div>
          <span className="admin-project-type">{project.projectType}</span>
          <StatusBadge status={project.status} />
          <time dateTime={project.createdAt?.toISOString?.()}>{formatDate(project.createdAt)}</time>
          <ArrowUpRight aria-hidden="true" />
        </Link>
      ))}
    </div>
  );
}
