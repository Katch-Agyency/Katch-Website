const dateFormatter = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function formatDate(value) {
  return value instanceof Date && !Number.isNaN(value.valueOf()) ? dateFormatter.format(value) : 'Pending';
}

export function formatDateTime(value) {
  return value instanceof Date && !Number.isNaN(value.valueOf()) ? dateTimeFormatter.format(value) : 'Pending';
}
