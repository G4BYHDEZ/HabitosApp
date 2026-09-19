const DAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function fmt(n) {
  return Number(n || 0).toLocaleString('es-MX');
}

export function shortDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAYS[dt.getDay()]} ${d} ${MONTHS[dt.getMonth()]}`;
}

export function todayLabel() {
  const dt = new Date();
  return `${DAYS[dt.getDay()]} ${dt.getDate()} ${MONTHS[dt.getMonth()]}`;
}

export function distanceKm(steps, heightCm = 170) {
  const strideM = (heightCm * 0.415) / 100;
  return ((steps || 0) * strideM) / 1000;
}

export function formatDistance(kmNumber, unit) {
  const km = Number(kmNumber || 0);
  if (unit === 'm') {
    const m = Math.round(km * 1000);
    return `${fmt(m)} m`;
  }
  return `${km.toFixed(2)} km`;
}

export function dominantLevel(seconds) {
  let best = 'resting';
  let bestV = -1;
  for (const k of ['resting', 'light', 'moderate', 'vigorous']) {
    if ((seconds[k] || 0) > bestV) {
      bestV = seconds[k];
      best = k;
    }
  }
  return best;
}