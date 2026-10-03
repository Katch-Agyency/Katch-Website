import { useEffect, useRef, useState } from 'react';
import { FolderKanban, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../auth/adminAuthContext';

const links = [
  { to: '/admin', label: 'Dashboard', end: true, Icon: LayoutDashboard },
  { to: '/admin/projects', label: 'Projects', end: false, Icon: FolderKanban },
];

function AdminNavigation({ onNavigate }) {
  const { user, logout } = useAdminAuth();
  return (
    <>
      <div className="admin-brand">
        <img src="/katch-logo-sm.webp" alt="Katch" width="262" height="66" />
        <span>Admin</span>
      </div>
      <nav className="admin-nav" aria-label="Admin navigation">
        {links.map(({ to, label, end, Icon }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate} className={({ isActive }) => isActive ? 'is-active' : undefined}>
            <Icon aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="admin-account">
        <span>Signed in as</span>
        <strong>{user?.email}</strong>
        <button type="button" onClick={logout}><LogOut aria-hidden="true" />Log out</button>
      </div>
    </>
  );
}

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const menuButton = menuButtonRef.current;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 40);
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focusable = Array.from(drawerRef.current.querySelectorAll('a[href], button:not([disabled])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      window.setTimeout(() => menuButton?.focus(), 0);
    };
  }, [mobileOpen]);

  return (
    <div className="admin-app">
      <aside className="admin-sidebar"><AdminNavigation /></aside>

      <header className="admin-mobile-header">
        <div className="admin-brand">
          <img src="/katch-logo-sm.webp" alt="Katch" width="262" height="66" />
          <span>Admin</span>
        </div>
        <button ref={menuButtonRef} type="button" aria-label="Open admin navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}>
          <Menu aria-hidden="true" />
        </button>
      </header>

      <div
        className={`admin-drawer-layer ${mobileOpen ? 'admin-drawer-layer--open' : ''}`}
        aria-hidden={!mobileOpen}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) setMobileOpen(false);
        }}
      >
        <aside ref={drawerRef} className="admin-drawer" role="dialog" aria-modal={mobileOpen ? 'true' : undefined} aria-label="Mobile admin navigation">
          <button ref={closeButtonRef} className="admin-drawer-close" type="button" aria-label="Close admin navigation" onClick={() => setMobileOpen(false)}>
            <X aria-hidden="true" />
          </button>
          <AdminNavigation onNavigate={() => setMobileOpen(false)} />
        </aside>
      </div>

      <main className="admin-main"><Outlet /></main>
    </div>
  );
}
