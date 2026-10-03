import { useEffect } from 'react';

const SITE_URL = 'https://katch.agency';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

function setMeta(selector, attribute, value) {
  const element = document.head.querySelector(selector);
  if (element) element.setAttribute(attribute, value);
}

export function PageMeta({ title, description, path = '/', image = DEFAULT_IMAGE, imageAlt = title, type = 'website', noIndex = false }) {
  useEffect(() => {
    const canonical = `${SITE_URL}${path === '/' ? '/' : path}`;
    document.title = title;
    setMeta('meta[name="description"]', 'content', description);
    setMeta('link[rel="canonical"]', 'href', canonical);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', canonical);
    setMeta('meta[property="og:image"]', 'content', image);
    setMeta('meta[property="og:image:alt"]', 'content', imageAlt);
    setMeta('meta[property="og:type"]', 'content', type);
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('meta[name="twitter:image"]', 'content', image);
    setMeta('meta[name="robots"]', 'content', noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
  }, [description, image, imageAlt, noIndex, path, title, type]);

  return null;
}
