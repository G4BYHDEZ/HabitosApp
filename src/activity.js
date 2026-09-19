import { Accelerometer, Pedometer } from 'expo-sensors';
import * as store from './storage';

export const LEVELS = {
  resting: 'Reposo',
  light: 'Actividad ligera',
  moderate: 'Actividad moderada',
  vigorous: 'Actividad intensa',
};

export const LEVEL_COLORS = {
  resting: '#9E9E9E',
  light: '#66BB6A',
  moderate: '#F4B942',
  vigorous: '#E05B5B',
};

const ACTIVE_SET = ['light', 'moderate', 'vigorous'];
const ACCEL_INTERVAL_MS = 100;
const SAVE_INTERVAL_MS = 4000;
const SAMPLE_DT_FALLBACK = 0.1;

let emaDev = 0;
let lastMs = 0;
let lastEmit = 0;

export function classify({ x, y, z }) {
  const mag = Math.sqrt(x * x + y * y + z * z);
  const dev = Math.abs(mag - 1);
  if (emaDev <= 0) emaDev = dev;
  else emaDev = emaDev * 0.85 + dev * 0.15;
  if (emaDev < 0.1) return 'resting';
  if (emaDev < 0.3) return 'light';
  if (emaDev < 0.8) return 'moderate';
  return 'vigorous';
}

let accSub = null;
let pedSub = null;
let cb = null;
let started = false;
let currentLevel = 'resting';
let state = null;
let saveTimer = null;
let dirty = false;
let serial = Promise.resolve();
let sensorStatus = { accel: 'ok', pedometer: 'ok' };

function enqueue(fn) {
  serial = serial.then(fn).catch(() => {});
  return serial;
}

function cloneSeconds(sec) {
  return {
    resting: sec.resting || 0,
    light: sec.light || 0,
    moderate: sec.moderate || 0,
    vigorous: sec.vigorous || 0,
  };
}

async function ensureToday() {
  if (state && state.date === store.isoDate()) return;
  const day = await store.getDay(store.isoDate());
  state = {
    date: store.isoDate(),
    steps: day.steps,
    seconds: cloneSeconds(day.seconds),
    activeSeconds: day.activeSeconds || 0,
  };
}

function emit() {
  if (!cb || !state) return;
  lastEmit = Date.now();
  cb({
    level: currentLevel,
    seconds: { ...state.seconds },
    activeSeconds: state.activeSeconds,
    activeMinutes: Math.round(state.activeSeconds / 60),
    steps: state.steps,
    date: state.date,
    sensor: { ...sensorStatus },
  });
}

function maybeEmit() {
  if (!cb || !state) return;
  const now = Date.now();
  if (now - lastEmit >= 1000) emit();
}

async function doPersist() {
  if (!dirty || !state) return;
  dirty = false;
  try {
    await store.updateDay(state.date, {
      steps: state.steps,
      seconds: { ...state.seconds },
      activeSeconds: state.activeSeconds,
    });
  } catch (e) {
    dirty = true;
  }
}

function requestPersist() {
  dirty = true;
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    enqueue(doPersist);
  }, SAVE_INTERVAL_MS);
}

async function flushPersist() {
  dirty = true;
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  enqueue(doPersist);
  await serial;
}

async function handleSteps(steps) {
  await ensureToday();
  const today = store.isoDate();
  const base = (await store.getBaseline()) || { date: today, count: null, steps: state.steps };
  if (base.date !== today) {
    base.date = today;
    base.count = null;
    base.steps = state.steps;
  }
  if (base.count === null) {
    base.count = steps;
  } else if (steps >= base.count) {
    base.steps += steps - base.count;
    base.count = steps;
  } else {
    base.steps += steps;
    base.count = steps;
  }
  state.steps = base.steps;
  await store.setBaseline(base);
  dirty = true;
  await doPersist();
  emit();
}

async function startAccelerometer() {
  sensorStatus.accel = 'ok';
  lastMs = 0;
  let available = false;
  try {
    available = await Accelerometer.isAvailableAsync();
  } catch (e) {
    available = false;
  }
  if (!available) {
    sensorStatus.accel = 'unavailable';
    return;
  }
  try {
    Accelerometer.setUpdateInterval(ACCEL_INTERVAL_MS);
  } catch (e) {
    sensorStatus.accel = 'error';
    return;
  }
  try {
    accSub = Accelerometer.addListener(async (data) => {
      currentLevel = classify(data);
      const now = Date.now();
      const dt = lastMs ? Math.min(2, Math.max(0.02, (now - lastMs) / 1000)) : SAMPLE_DT_FALLBACK;
      lastMs = now;
      await ensureToday();
      state.seconds[currentLevel] += dt;
      if (ACTIVE_SET.includes(currentLevel)) state.activeSeconds += dt;
      requestPersist();
      maybeEmit();
    });
  } catch (e) {
    sensorStatus.accel = 'error';
    accSub = null;
  }
}

async function startPedometer() {
  sensorStatus.pedometer = 'ok';
  let available = false;
  try {
    available = await Pedometer.isAvailableAsync();
  } catch (e) {
    available = false;
  }
  if (!available) {
    sensorStatus.pedometer = 'unavailable';
    return;
  }
  let perm = null;
  try {
    perm = await Pedometer.getPermissionsAsync();
    if (!perm.granted) perm = await Pedometer.requestPermissionsAsync();
  } catch (e) {
    perm = null;
  }
  if (!perm || !perm.granted) {
    sensorStatus.pedometer = 'denied';
    return;
  }

  await ensureToday();
  const today = store.isoDate();
  let base = await store.getBaseline();
  if (!base || base.date !== today) {
    let seed = 0;
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const r = await Pedometer.getStepCountAsync(start, new Date());
      if (r && typeof r.steps === 'number') seed = r.steps;
    } catch (e) {
      seed = 0;
    }
    base = { date: today, count: null, steps: seed };
    await store.setBaseline(base);
  }
  if (state.steps < base.steps) state.steps = base.steps;
  try {
    pedSub = Pedometer.watchStepCount(({ steps }) => enqueue(() => handleSteps(steps)));
  } catch (e) {
    sensorStatus.pedometer = 'error';
    pedSub = null;
  }
  emit();
}

export async function startTracking(onData) {
  if (started) return;
  started = true;
  cb = onData;
  lastEmit = 0;
  await ensureToday();
  emit();
  await startAccelerometer();
  await startPedometer();
}

export async function stopTracking() {
  if (!started) return;
  started = false;
  lastMs = 0;
  emaDev = 0;
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (accSub) {
    try {
      accSub.remove();
    } catch (e) {}
    accSub = null;
  }
  if (pedSub) {
    try {
      pedSub.remove();
    } catch (e) {}
    pedSub = null;
  }
  currentLevel = 'resting';
  await flushPersist();
  cb = null;
}