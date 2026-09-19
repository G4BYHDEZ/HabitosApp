import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as store from './src/storage';
import { startTracking, stopTracking } from './src/activity';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import StatsScreen from './src/screens/StatsScreen';
import BiometricGate from './src/screens/BiometricGate';
import { COLORS } from './src/theme';

const STREAK_THROTTLE_MS = 30000;

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState(null);
  const [goal, setGoal] = useState(null);
  const [screen, setScreen] = useState('home');
  const [locked, setLocked] = useState(false);
  const [lockReason, setLockReason] = useState('Desbloquea la app.');
  const [pendingScreen, setPendingScreen] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [streak, setStreak] = useState(0);
  const [distanceUnit, setDistanceUnit] = useState('km');

  const profileRef = useRef(null);
  profileRef.current = profile;
  const appStateRef = useRef(AppState.currentState);
  const lastStreakCalc = useRef(0);

  const recomputeStreak = useCallback(async () => {
    try {
      const log = await store.getLog();
      setStreak(store.computeStreak(log));
    } catch (e) {}
  }, []);

  useEffect(() => {
    (async () => {
      let p = null;
      let g = null;
      let u = 'km';
      try {
        const [pp, gg, uu] = await Promise.all([store.getProfile(), store.getGoal(), store.getDistanceUnit()]);
        p = pp;
        g = gg;
        u = uu;
        setProfile(p);
        setGoal(g);
        setDistanceUnit(u);
        await store.refreshTodayMet();
      } catch (e) {
      }
      await recomputeStreak();
      if (p) {
        setLocked(true);
        setLockReason('Verifica tu identidad para abrir tus datos.');
        setScreen('home');
      } else {
        setScreen('profile');
      }
      setLoaded(true);
    })();
  }, [recomputeStreak]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      const cameFromBackground = !prev || /inactive|background/.test(prev);
      if (cameFromBackground && next === 'active' && profileRef.current) {
        setLocked(true);
        setLockReason('La app estaba en segundo plano. Verifica de nuevo.');
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!profile) return;
    let alive = true;
    startTracking((s) => {
      if (!alive) return;
      setSnapshot(s);
      const now = Date.now();
      if (now - lastStreakCalc.current > STREAK_THROTTLE_MS) {
        lastStreakCalc.current = now;
        recomputeStreak();
      }
    });
    return () => {
      alive = false;
      stopTracking();
    };
  }, [profile, recomputeStreak]);

  const unlock = () => {
    setLocked(false);
    if (pendingScreen) {
      setScreen(pendingScreen);
      setPendingScreen(null);
    }
    lastStreakCalc.current = 0;
    recomputeStreak();
  };

  const gate = (target) => {
    setPendingScreen(target);
    setLocked(true);
  };

  const openGoals = () => {
    setLockReason('Verifica tu identidad para editar tu meta.');
    gate('goals');
  };

  const openStats = () => {
    setLockReason('Verifica tu identidad para ver tus estadísticas.');
    gate('stats');
  };

  const openEditProfile = () => {
    setLockReason('Verifica tu identidad para editar tus datos.');
    gate('profile');
  };

  const handleSaveProfile = async (p) => {
    const isNew = !profile;
    try {
      await store.saveProfile(p);
      setSnapshot(null);
      setProfile(p);
      await store.refreshTodayMet();
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el perfil. Intenta de nuevo.');
      return;
    }
    if (isNew) {
      setPendingScreen(null);
      setScreen('home');
      setLocked(true);
      setLockReason('Verifica tu identidad para proteger tus datos.');
      recomputeStreak();
    } else {
      setScreen('home');
      recomputeStreak();
    }
  };

  const handleToggleDistanceUnit = async () => {
    const next = distanceUnit === 'km' ? 'm' : 'km';
    setDistanceUnit(next);
    try {
      await store.saveDistanceUnit(next);
    } catch (e) {}
  };

  const handleSaveGoal = async (g) => {
    try {
      await store.saveGoal(g);
      setGoal(g);
      await store.refreshTodayMet();
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar la meta. Intenta de nuevo.');
      return;
    }
    setScreen('home');
    recomputeStreak();
  };

  if (!loaded) {
    return (
      <View style={styles.loading}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      {screen === 'home' && profile && (
        <HomeScreen
          profile={profile}
          goal={goal}
          snapshot={snapshot}
          streak={streak}
          distanceUnit={distanceUnit}
          onToggleDistanceUnit={handleToggleDistanceUnit}
          onGoals={openGoals}
          onStats={openStats}
          onEditProfile={openEditProfile}
        />
      )}
      {screen === 'profile' && (
        <ProfileScreen
          profile={profile}
          onSave={handleSaveProfile}
          onBack={profile ? () => setScreen('home') : null}
        />
      )}
      {screen === 'goals' && <GoalsScreen goal={goal} onSave={handleSaveGoal} onBack={() => setScreen('home')} />}
      {screen === 'stats' && <StatsScreen profile={profile} distanceUnit={distanceUnit} onBack={() => setScreen('home')} />}
      {locked && <BiometricGate onUnlock={unlock} reason={lockReason} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  loading: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});