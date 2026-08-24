export function StatusBadge({ status }) {
  const slug = status.toLowerCase().replaceAll(' ', '-');
  return <span className={`status-badge status-badge--${slug}`}>{status}</span>;
}
