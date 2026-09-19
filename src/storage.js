import AsyncStorage from '@react-native-async-storage/async-storage';

const K_PROFILE = '@habitos/perfil';
const K_GOAL = '@habitos/meta';
const K_LOG = '@habitos/registro';
const K_BASELINE = '@habitos/pasos';
const K_UNIT = '@habitos/unidadDistancia';

let goalCache = null;
let profileCache = null;
let logCache = null;
let unitCache = null;

export function isoDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function emptyDay() {
  return {
    steps: 0,
    seconds: { resting: 0, light: 0, moderate: 0, vigorous: 0 },
    activeSeconds: 0,
    met: false,
    goalType: null,
    goalValue: null,
  };
}

const clone = (o) => JSON.parse(JSON.stringify(o));

async function getItemSafe(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

export async function getProfile() {
  if (!profileCache) profileCache = await getItemSafe(K_PROFILE, null);
  return profileCache;
}

export async function saveProfile(p) {
  profileCache = p;
  await AsyncStorage.setItem(K_PROFILE, JSON.stringify(p));
}

export async function getGoal() {
  if (!goalCache) goalCache = await getItemSafe(K_GOAL, null);
  return goalCache;
}

export async function saveGoal(g) {
  goalCache = g;
  await AsyncStorage.setItem(K_GOAL, JSON.stringify(g));
}

async function loadLog() {
  if (!logCache) logCache = await getItemSafe(K_LOG, {});
  return logCache;
}

export async function getLog() {
  return loadLog();
}

export function computeMet(entry, goal, profile) {
  if (!goal) return false;
  if (goal.type === 'pasos') return entry.steps >= goal.value;
  if (goal.type !== 'distancia') return false;
  let height = 170;
  if (profile && profile.alturacm !== undefined && profile.alturacm !== null) {
    const h = Number(profile.alturacm);
    if (Number.isFinite(h) && h > 0) height = h;
  }
  const strideM = (height * 0.415) / 100;
  const km = ((entry.steps || 0) * strideM) / 1000;
  return km >= goal.value;
}

export async function getDay(dateStr) {
  const log = await loadLog();
  const day = log[dateStr];
  if (day) {
    return {
      ...emptyDay(),
      ...day,
      seconds: { ...emptyDay().seconds, ...(day.seconds || {}) },
    };
  }
  return emptyDay();
}

export async function updateDay(dateStr, patch) {
  const log = await loadLog();
  const prev = log[dateStr] || emptyDay();
  const entry = {
    ...prev,
    ...patch,
    seconds: { ...emptyDay().seconds, ...(prev.seconds || {}), ...(patch.seconds || {}) },
  };
  const [goal, profile] = await Promise.all([getGoal(), getProfile()]);
  entry.met = computeMet(entry, goal, profile);
  if (goal) {
    entry.goalType = goal.type;
    entry.goalValue = goal.value;
  }
  log[dateStr] = entry;
  logCache = log;
  await AsyncStorage.setItem(K_LOG, JSON.stringify(log));
  return entry;
}

export async function refreshTodayMet() {
  const today = isoDate();
  const day = await getDay(today);
  return updateDay(today, {
    steps: day.steps,
    seconds: day.seconds,
    activeSeconds: day.activeSeconds,
  });
}

export function computeStreak(log) {
  const now = new Date();
  const days = [];
  for (let i = 0; i < 366; i++) {
    days.push(isoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)));
  }
  const metAt = (s) => {
    const e = log[s];
    return !!(e && e.met);
  };
  let start = 0;
  if (!metAt(days[0])) start = 1;
  let streak = 0;
  for (let i = start; i < days.length; i++) {
    if (metAt(days[i])) streak += 1;
    else break;
  }
  return streak;
}

export function last7(log) {
  const now = new Date();
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const date = isoDate(d);
    const e = log[date];
    out.push({ date, entry: e ? { ...emptyDay(), ...e, seconds: { ...emptyDay().seconds, ...(e.seconds || {}) } } : emptyDay(), isToday: i === 0 });
  }
  return out;
}

let baselineCache = null;

export async function getBaseline() {
  if (!baselineCache) baselineCache = await getItemSafe(K_BASELINE, null);
  return baselineCache;
}

export async function setBaseline(b) {
  baselineCache = b;
  await AsyncStorage.setItem(K_BASELINE, JSON.stringify(b));
}

export async function getDistanceUnit() {
  if (unitCache === null) unitCache = await getItemSafe(K_UNIT, 'km');
  return unitCache === 'm' ? 'm' : 'km';
}

export async function saveDistanceUnit(u) {
  unitCache = u === 'm' ? 'm' : 'km';
  await AsyncStorage.setItem(K_UNIT, JSON.stringify(unitCache));
}