import { useState } from 'react';
import { ArrowUpRight, LockKeyhole } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../auth/adminAuthContext';
import { AdminLoadingScreen } from '../components/AdminStates';

export default function AdminLoginPage() {
  const { loading, user, isAdmin, login, configurationError } = useAdminAuth();
  const location = useLocation();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  if (loading) return <AdminLoadingScreen label="Loading secure sign in…" />;
  if (user && isAdmin) return <Navigate to="/admin" replace />;

  const configMissing = configurationError || location.state?.configurationError;

  const submit = async (event) => {
    event.preventDefault();
    if (submitting || configMissing) return;
    setMessage('');
    setSubmitting(true);
    try {
      await login(credentials.email.trim(), credentials.password);
    } catch (error) {
      setMessage(error instanceof Error && error.message === 'not_authorized'
        ? 'This account is not authorized for Katch Admin.'
        : 'We couldn’t sign you in. Check your email and password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-card" aria-labelledby="admin-login-title">
        <div className="admin-login-brand">
          <img src="/katch-logo-sm.webp" alt="Katch" width="262" height="66" />
          <span>Admin</span>
        </div>
        <LockKeyhole aria-hidden="true" className="admin-login-icon" />
        <p className="admin-eyebrow">Secure access</p>
        <h1 id="admin-login-title">Sign in to Katch.</h1>
        <p>Manage incoming project requests, lead status, and internal notes.</p>

        {configMissing ? (
          <div className="admin-message admin-message--error" role="alert">
            Admin services are not configured. Add the Firebase environment variables before signing in.
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <label htmlFor="admin-email">Email</label>
            <input id="admin-email" type="email" value={credentials.email} onChange={(event) => setCredentials((current) => ({ ...current, email: event.target.value }))} autoComplete="username" required />
            <label htmlFor="admin-password">Password</label>
            <input id="admin-password" type="password" value={credentials.password} onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))} autoComplete="current-password" required />
            {message && <div className="admin-message admin-message--error" role="alert">{message}</div>}
            <button type="submit" disabled={submitting || !credentials.email || !credentials.password}>
              {submitting ? 'Signing in…' : 'Sign In'}
              <ArrowUpRight aria-hidden="true" />
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
