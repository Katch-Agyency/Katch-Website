import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDownRight, Menu, X } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { freezeScrollPosition } from '../utils/scrollStore';

const navItems = [
  ['Demos', '/demos'],
  ['Services', '/services'],
  ['Process', '/process'],
  ['About', '/about'],
];

function navClass({ isActive }) {
  return isActive ? 'is-active' : undefined;
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const panelRef = useRef(null);
  const scrollPositionRef = useRef(0);
  const returnFocusRef = useRef(false);
  const restoreScrollRef = useRef(true);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const closeOnHistoryNavigation = () => {
      returnFocusRef.current = false;
      restoreScrollRef.current = false;
      setMenuOpen(false);
    };
    window.addEventListener('popstate', closeOnHistoryNavigation);
    return () => window.removeEventListener('popstate', closeOnHistoryNavigation);
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const body = document.body;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    scrollPositionRef.current = window.scrollY;
    body.dataset.lockedScroll = String(scrollPositionRef.current);
    body.style.position = 'fixed';
    body.style.top = `-${scrollPositionRef.current}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';

    const menuButton = menuButtonRef.current;
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 40);

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        returnFocusRef.current = true;
        setMenuOpen(false);
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      );
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
      document.removeEventListener('keydown', onKeyDown);
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.left = previous.left;
      body.style.right = previous.right;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;
      if (restoreScrollRef.current) {
        delete body.dataset.lockedScroll;
        const top = scrollPositionRef.current;
        window.requestAnimationFrame(() => window.scrollTo({ top, left: 0, behavior: 'auto' }));
      } else {
        window.requestAnimationFrame(() => delete body.dataset.lockedScroll);
      }
      if (returnFocusRef.current) {
        window.setTimeout(() => menuButton?.focus(), 0);
        returnFocusRef.current = false;
      }
    };
  }, [menuOpen]);

  const closeMenu = (restoreFocus = false, restoreScroll = true) => {
    returnFocusRef.current = restoreFocus;
    restoreScrollRef.current = restoreScroll;
    setMenuOpen(false);
  };

  const navigateFromMenu = () => {
    freezeScrollPosition(location.key, scrollPositionRef.current);
    closeMenu(false, false);
  };

  const toggleMenu = () => {
    if (menuOpen) {
      closeMenu(true);
    } else {
      returnFocusRef.current = false;
      restoreScrollRef.current = true;
      setMenuOpen(true);
    }
  };

  const mobileMenu = createPortal(
    <div
      className={`mobile-nav-layer ${menuOpen ? 'mobile-nav-layer--open' : ''}`}
      aria-hidden={!menuOpen}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeMenu(true);
      }}
    >
      <div
        id="mobile-navigation"
        ref={panelRef}
        className="mobile-nav-panel"
        role="dialog"
        aria-modal={menuOpen ? 'true' : undefined}
        aria-label="Navigation menu"
      >
        <div className="mobile-nav-head">
          <Link to="/" className="mobile-nav-brand" aria-label="Katch home" tabIndex={menuOpen ? 0 : -1} onClick={navigateFromMenu}>
            <img src="/katch-logo-sm.webp" srcSet="/katch-logo-sm.webp 262w, /katch-logo.webp 1310w" sizes="112px" alt="Katch" width="1310" height="328" />
          </Link>
          <button
            ref={closeButtonRef}
            className="mobile-nav-close"
            type="button"
            aria-label="Close navigation menu"
            tabIndex={menuOpen ? 0 : -1}
            onClick={() => closeMenu(true)}
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <nav className="mobile-nav-links" aria-label="Mobile navigation">
          {navItems.map(([label, to], index) => (
            <NavLink key={label} to={to} className={navClass} tabIndex={menuOpen ? 0 : -1} onClick={navigateFromMenu}>
              <span>0{index + 1}</span>
              <strong>{label}</strong>
              <ArrowDownRight aria-hidden="true" />
            </NavLink>
          ))}
        </nav>

        <div className="mobile-nav-bottom">
          <NavLink className="mobile-nav-cta" to="/contact" tabIndex={menuOpen ? 0 : -1} onClick={navigateFromMenu}>
            Start a Project
            <ArrowDownRight aria-hidden="true" />
          </NavLink>
          <p>Available for select projects · 2026</p>
        </div>
      </div>
    </div>,
    document.body,
  );

  return (
    <>
      <header className={`site-header ${scrolled ? 'site-header--scrolled' : ''}`}>
        <div className="header-inner shell">
          <Link className="brand" to="/" aria-label="Katch home">
            <img className="brand-logo" src="/katch-logo-sm.webp" srcSet="/katch-logo-sm.webp 262w, /katch-logo.webp 1310w" sizes="122px" alt="Katch" width="1310" height="328" fetchPriority="high" />
          </Link>

          <nav className="desktop-nav" aria-label="Primary navigation">
            {navItems.map(([label, to]) => (
              <NavLink key={label} to={to} className={navClass}>{label}</NavLink>
            ))}
          </nav>

          <NavLink className="nav-cta" to="/contact">
            <span>Start a Project</span>
            <ArrowDownRight aria-hidden="true" size={16} />
          </NavLink>

          <button
            ref={menuButtonRef}
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={toggleMenu}
          >
            <Menu aria-hidden="true" />
          </button>
        </div>
      </header>
      {mobileMenu}
    </>
  );
}
