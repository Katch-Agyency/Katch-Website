import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminEmptyState, AdminErrorState, AdminLoadingScreen } from '../components/AdminStates';
import { StatusBadge } from '../components/StatusBadge';
import { PROJECT_STATUSES, PROJECT_TYPES, subscribeToProjects } from '../services/projectService';
import { formatDate } from '../utils/formatters';

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [projectType, setProjectType] = useState('All');
  const [sort, setSort] = useState('newest');

  useEffect(() => subscribeToProjects((items) => {
    setProjects(items);
    setLoading(false);
    setError(false);
  }, () => {
    setError(true);
    setLoading(false);
  }), [retryKey]);

  const filteredProjects = useMemo(() => {
    const term = search.trim().toLowerCase();
    return projects
      .filter((project) => !term || [project.name, project.company, project.email].some((value) => value.toLowerCase().includes(term)))
      .filter((project) => status === 'All' || project.status === status)
      .filter((project) => projectType === 'All' || project.projectType === projectType)
      .sort((a, b) => {
        const left = a.createdAt?.valueOf?.() || 0;
        const right = b.createdAt?.valueOf?.() || 0;
        return sort === 'oldest' ? left - right : right - left;
      });
  }, [projectType, projects, search, sort, status]);

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div><p className="admin-eyebrow">Lead management</p><h1>Projects</h1></div>
        <span className="admin-result-count">{loading ? 'Loading…' : `${filteredProjects.length} shown`}</span>
      </header>

      <section className="admin-filters" aria-label="Project filters">
        <label className="admin-search">
          <span className="sr-only">Search projects</span>
          <Search aria-hidden="true" />
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, company, or email" />
        </label>
        <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All</option>{PROJECT_STATUSES.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Project type</span><select value={projectType} onChange={(event) => setProjectType(event.target.value)}><option>All</option>{PROJECT_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest</option><option value="oldest">Oldest</option></select></label>
      </section>

      <section className="admin-panel admin-projects-panel" aria-label="Incoming project requests">
        {loading ? <AdminLoadingScreen compact label="Loading project requests…" />
          : error ? <AdminErrorState onRetry={() => setRetryKey((value) => value + 1)} />
            : !filteredProjects.length ? <AdminEmptyState filtered={projects.length > 0} /> : (
              <>
                <div className="admin-projects-table-wrap">
                  <table className="admin-projects-table">
                    <thead><tr><th>Client</th><th>Company</th><th>Project Type</th><th>Status</th><th>Date</th><th><span className="sr-only">Actions</span></th></tr></thead>
                    <tbody>
                      {filteredProjects.map((project) => (
                        <tr key={project.id}>
                          <td><strong>{project.name}</strong><span>{project.email}</span></td>
                          <td>{project.company}</td>
                          <td>{project.projectType}</td>
                          <td><StatusBadge status={project.status} /></td>
                          <td><time dateTime={project.createdAt?.toISOString?.()}>{formatDate(project.createdAt)}</time></td>
                          <td><Link to={`/admin/projects/${project.id}`} aria-label={`Open ${project.name}'s project`}><ArrowUpRight aria-hidden="true" /></Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="admin-project-cards">
                  {filteredProjects.map((project) => (
                    <article key={project.id}>
                      <div><strong>{project.name}</strong><StatusBadge status={project.status} /></div>
                      <p>{project.company}</p>
                      <dl><div><dt>Project</dt><dd>{project.projectType}</dd></div><div><dt>Date</dt><dd>{formatDate(project.createdAt)}</dd></div></dl>
                      <Link to={`/admin/projects/${project.id}`}>View Project <ArrowUpRight aria-hidden="true" /></Link>
                    </article>
                  ))}
                </div>
                {projects.length >= 100 && <p className="admin-limit-note">Showing the latest 100 project requests. Use filters to narrow the list.</p>}
              </>
            )}
      </section>
    </div>
  );
}
