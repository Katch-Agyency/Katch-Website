import { Inbox } from 'lucide-react';

export function AdminLoadingScreen({ label = 'Loading…', compact = false }) {
  return (
    <div className={`admin-loading ${compact ? 'admin-loading--compact' : ''}`} role="status" aria-live="polite">
      <span className="admin-spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function AdminErrorState({ title = 'Something went wrong.', message = 'Please check your connection and try again.', onRetry }) {
  return (
    <div className="admin-state admin-state--error" role="alert">
      <h2>{title}</h2>
      <p>{message}</p>
      {onRetry && <button type="button" onClick={onRetry}>Try Again</button>}
    </div>
  );
}

export function AdminEmptyState({ filtered = false }) {
  return (
    <div className="admin-state admin-state--empty">
      <Inbox aria-hidden="true" />
      <h2>{filtered ? 'No matching project requests.' : 'No project requests yet.'}</h2>
      <p>{filtered ? 'Try changing your search or filters.' : 'When potential clients submit the project form, their requests will appear here.'}</p>
    </div>
  );
}
