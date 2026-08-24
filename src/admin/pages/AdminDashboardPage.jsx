import { useEffect, useState } from 'react';
import { ArrowDownRight, CircleCheckBig, FolderKanban, MessageCircleMore, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminEmptyState, AdminErrorState, AdminLoadingScreen } from '../components/AdminStates';
import { ProjectSummaryList } from '../components/ProjectSummaryList';
import { loadDashboardCounts, subscribeToRecentProjects } from '../services/projectService';

const initialCounts = { total: 0, new: 0, inDiscussion: 0, won: 0 };

export default function AdminDashboardPage() {
  const [recent, setRecent] = useState([]);
  const [counts, setCounts] = useState(initialCounts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    const refreshCounts = async () => {
      try {
        const nextCounts = await loadDashboardCounts();
        if (active) setCounts(nextCounts);
      } catch {
        if (active) setError(true);
      }
    };
    const unsubscribe = subscribeToRecentProjects((projects) => {
      if (!active) return;
      setRecent(projects);
      setLoading(false);
      setError(false);
      refreshCounts();
    }, () => {
      if (!active) return;
      setError(true);
      setLoading(false);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [retryKey]);

  const stats = [
    ['Total Projects', counts.total, FolderKanban],
    ['New', counts.new, Sparkles],
    ['In Discussion', counts.inDiscussion, MessageCircleMore],
    ['Won', counts.won, CircleCheckBig],
  ];

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div><p className="admin-eyebrow">Katch Admin</p><h1>Dashboard</h1></div>
        <Link to="/admin/projects">View Projects <ArrowDownRight aria-hidden="true" /></Link>
      </header>

      <section className="admin-stats" aria-label="Project request summary">
        {stats.map(([label, value, Icon]) => (
          <article key={label}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
            <strong>{loading ? '—' : value}</strong>
          </article>
        ))}
      </section>

      <section className="admin-panel" aria-labelledby="recent-projects-title">
        <div className="admin-panel-header">
          <div><p className="admin-eyebrow">Live inquiries</p><h2 id="recent-projects-title">Recent Projects</h2></div>
          <Link to="/admin/projects">View all</Link>
        </div>
        {loading ? <AdminLoadingScreen compact label="Loading recent projects…" />
          : error ? <AdminErrorState onRetry={() => setRetryKey((value) => value + 1)} />
            : recent.length ? <ProjectSummaryList projects={recent} /> : <AdminEmptyState />}
      </section>
    </div>
  );
}
