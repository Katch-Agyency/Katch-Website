import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { freezeScrollPosition, readScrollPosition, saveScrollPosition } from '../utils/scrollStore';

export function PageFrame({ children, className = '' }) {
  const rootRef = useRef(null);
  const location = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    const key = location.key;
    let secondFrame;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        if (location.hash) {
          document.getElementById(location.hash.slice(1))?.scrollIntoView();
          return;
        }
        const top = navigationType === 'POP' ? readScrollPosition(key) : 0;
        window.scrollTo({ top, left: 0, behavior: 'auto' });
      });
    });

    const savePosition = () => {
      const locked = document.body.dataset.lockedScroll;
      saveScrollPosition(key, locked ? Number(locked) : window.scrollY);
    };
    const freezeBeforeNavigation = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target.closest?.('a[href]');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (destination.pathname === location.pathname && destination.search === location.search) return;
      const locked = document.body.dataset.lockedScroll;
      freezeScrollPosition(key, locked ? Number(locked) : window.scrollY);
    };

    savePosition();
    window.addEventListener('scroll', savePosition, { passive: true });
    document.addEventListener('click', freezeBeforeNavigation, true);

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
      window.removeEventListener('scroll', savePosition);
      document.removeEventListener('click', freezeBeforeNavigation, true);
    };
  }, [location.hash, location.key, location.pathname, location.search, navigationType]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const elements = Array.from(root.querySelectorAll('.reveal'));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.06 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className={`page-frame ${className}`.trim()}>
      {children}
    </div>
  );
}
