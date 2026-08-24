import { useEffect, useState } from 'react';
import { Archive, ArrowLeft, Check, Clipboard, ExternalLink, Mail } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { AdminErrorState, AdminLoadingScreen } from '../components/AdminStates';
import { StatusBadge } from '../components/StatusBadge';
import { PROJECT_STATUSES, subscribeToProject, updateProjectNotes, updateProjectStatus } from '../services/projectService';
import { formatDateTime } from '../utils/formatters';

export default function AdminProjectDetailPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => subscribeToProject(projectId, (item) => {
    setProject(item);
    setNotes(item?.notes || '');
    setLoading(false);
    setError(false);
  }, () => {
    setError(true);
    setLoading(false);
  }), [projectId]);

  const changeStatus = async (nextStatus) => {
    if (!project || statusUpdating) return;
    setStatusUpdating(true);
    setMessage('');
    try {
      await updateProjectStatus(project.id, nextStatus);
      setMessage('Status updated.');
    } catch {
      setMessage('The status could not be updated. Please try again.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const saveNotes = async () => {
    if (!project || notesSaving) return;
    setNotesSaving(true);
    setMessage('');
    try {
      await updateProjectNotes(project.id, notes);
      setMessage('Internal notes saved.');
    } catch {
      setMessage('Notes could not be saved. Please try again.');
    } finally {
      setNotesSaving(false);
    }
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(project.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setMessage('The email could not be copied.');
    }
  };

  const archive = async () => {
    if (!window.confirm('Archive this project request? You can restore it later by changing its status.')) return;
    await changeStatus('Archived');
  };

  if (loading) return <AdminLoadingScreen label="Loading project details…" />;
  if (error) return <div className="admin-page"><AdminErrorState /></div>;
  if (!project) return <div className="admin-page"><AdminErrorState title="Project not found." message="This request may have been archived outside the dashboard or no longer exists." /></div>;

  return (
    <div className="admin-page admin-project-detail">
      <Link className="admin-back-link" to="/admin/projects"><ArrowLeft aria-hidden="true" />Back to Projects</Link>
      <header className="admin-detail-header">
        <div>
          <p className="admin-eyebrow">Project request</p>
          <h1>{project.name}</h1>
          <p>{project.company}</p>
        </div>
        <StatusBadge status={project.status} />
      </header>

      <div className="admin-detail-actions">
        <a href={`mailto:${project.email}`}><Mail aria-hidden="true" />Email Client</a>
        <button type="button" onClick={copyEmail}>{copied ? <Check aria-hidden="true" /> : <Clipboard aria-hidden="true" />}{copied ? 'Copied' : 'Copy Email'}</button>
        {project.currentWebsite && <a href={project.currentWebsite} target="_blank" rel="noopener noreferrer"><ExternalLink aria-hidden="true" />Open Website</a>}
        <button className="admin-archive-action" type="button" onClick={archive} disabled={statusUpdating || project.status === 'Archived'}><Archive aria-hidden="true" />Archive</button>
      </div>

      {message && <div className="admin-message" role="status">{message}</div>}

      <div className="admin-detail-grid">
        <section className="admin-panel" aria-labelledby="client-info-title">
          <div className="admin-panel-header"><div><p className="admin-eyebrow">Contact</p><h2 id="client-info-title">Client Information</h2></div></div>
          <dl className="admin-detail-list">
            <div><dt>Name</dt><dd>{project.name}</dd></div>
            <div><dt>Email</dt><dd><a href={`mailto:${project.email}`}>{project.email}</a></dd></div>
            <div><dt>Company</dt><dd>{project.company}</dd></div>
            <div><dt>Current Website</dt><dd>{project.currentWebsite ? <a href={project.currentWebsite} target="_blank" rel="noopener noreferrer">{project.currentWebsite}<ExternalLink aria-hidden="true" /></a> : 'Not provided'}</dd></div>
          </dl>
        </section>

        <section className="admin-panel" aria-labelledby="lead-info-title">
          <div className="admin-panel-header"><div><p className="admin-eyebrow">Lead</p><h2 id="lead-info-title">Lead Information</h2></div></div>
          <dl className="admin-detail-list">
            <div><dt>Status</dt><dd><select value={project.status} disabled={statusUpdating} onChange={(event) => changeStatus(event.target.value)}>{PROJECT_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></dd></div>
            <div><dt>Created</dt><dd>{formatDateTime(project.createdAt)}</dd></div>
            <div><dt>Last Updated</dt><dd>{formatDateTime(project.updatedAt)}</dd></div>
          </dl>
        </section>

        <section className="admin-panel admin-detail-project" aria-labelledby="project-info-title">
          <div className="admin-panel-header"><div><p className="admin-eyebrow">Scope</p><h2 id="project-info-title">Project</h2></div></div>
          <dl className="admin-detail-list">
            <div><dt>Project Type</dt><dd>{project.projectType}</dd></div>
            <div className="admin-detail-description"><dt>Project Details</dt><dd>{project.projectDetails}</dd></div>
          </dl>
        </section>

        <section className="admin-panel admin-detail-notes" aria-labelledby="internal-notes-title">
          <div className="admin-panel-header"><div><p className="admin-eyebrow">Private</p><h2 id="internal-notes-title">Internal Notes</h2></div></div>
          <p className="admin-private-note">Only authorized Katch admins can read these notes.</p>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength="10000" rows="8" placeholder="Add follow-up details, next steps, or context for this lead." />
          <div className="admin-notes-footer"><span>{notes.length.toLocaleString()} / 10,000</span><button type="button" onClick={saveNotes} disabled={notesSaving}>{notesSaving ? 'Saving…' : 'Save Note'}</button></div>
        </section>
      </div>
    </div>
  );
}
