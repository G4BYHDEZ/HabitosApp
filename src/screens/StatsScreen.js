import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../theme';
import { Btn, Card } from '../components';
import { LEVELS, LEVEL_COLORS } from '../activity';
import { computeStreak, getLog, last7 } from '../storage';
import { distanceKm, dominantLevel, fmt, formatDistance, shortDate } from '../util';

export default function StatsScreen({ profile, distanceUnit, onBack }) {
  const [days, setDays] = useState([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    (async () => {
      const log = await getLog();
      setDays(last7(log));
      setStreak(computeStreak(log));
    })();
  }, []);

  const height = profile ? profile.alturacm : 170;
  const totalSteps = days.reduce((a, d) => a + d.entry.steps, 0);
  const totalMinutes = days.reduce((a, d) => a + Math.round(d.entry.activeSeconds / 60), 0);
  const metDays = days.filter((d) => d.entry.met).length;
  const avgSteps = days.length ? Math.round(totalSteps / days.length) : 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>← Volver</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Estadísticas</Text>

      <Card>
        <Text style={styles.cardTitle}>Últimos 7 días</Text>
        <View style={styles.sumRow}>
          <View style={styles.sumItem}>
            <Text style={styles.sumNum}>{fmt(totalSteps)}</Text>
            <Text style={styles.sumLabel}>pasos totales</Text>
          </View>
          <View style={styles.sumItem}>
            <Text style={styles.sumNum}>{fmt(avgSteps)}</Text>
            <Text style={styles.sumLabel}>promedio/día</Text>
          </View>
          <View style={styles.sumItem}>
            <Text style={styles.sumNum}>{metDays}/7</Text>
            <Text style={styles.sumLabel}>metas cumplidas</Text>
          </View>
        </View>
        <View style={styles.sumRow}>
          <View style={styles.sumItem}>
            <Text style={styles.sumNum}>{totalMinutes}</Text>
            <Text style={styles.sumLabel}>min activos</Text>
          </View>
          <View style={styles.sumItem}>
            <Text style={styles.sumNum}>🔥 {streak}</Text>
            <Text style={styles.sumLabel}>racha actual</Text>
          </View>
          <View style={styles.sumItem}>
            <Text style={styles.sumNum}>{formatDistance(distanceKm(totalSteps, height), distanceUnit)}</Text>
            <Text style={styles.sumLabel}>{distanceUnit === 'km' ? 'km totales' : 'metros totales'}</Text>
          </View>
        </View>
      </Card>

      <Text style={styles.section}>Desglose diario</Text>

      {days.map((d) => {
        const lvl = dominantLevel(d.entry.seconds);
        return (
          <View key={d.date} style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowDate}>{d.isToday ? 'Hoy' : shortDate(d.date)}</Text>
              <View style={styles.lvlChip}>
                <View style={[styles.miniDot, { backgroundColor: LEVEL_COLORS[lvl] }]} />
                <Text style={styles.lvlText}>{LEVELS[lvl]}</Text>
              </View>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.rowSteps}>{fmt(d.entry.steps)} pasos</Text>
              <Text style={styles.rowSub}>
                {formatDistance(distanceKm(d.entry.steps, height), distanceUnit)} · {Math.round(d.entry.activeSeconds / 60)} min activos
              </Text>
              <Text style={[styles.rowMet, { color: d.entry.met ? COLORS.primary : COLORS.muted }]}>
                {d.entry.goalType ? (d.entry.met ? '✓ Cumplida' : '✗ No cumplida') : '— Sin meta'}
              </Text>
            </View>
          </View>
        );
      })}

      <Btn label="Volver al inicio" onPress={onBack} outlined color={COLORS.primary} style={{ marginTop: 8 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 40 },
  back: { alignSelf: 'flex-start', paddingVertical: 6 },
  backText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginTop: 4, marginBottom: 16 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  sumRow: { flexDirection: 'row', marginBottom: 12 },
  sumItem: { flex: 1, alignItems: 'center' },
  sumNum: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  sumLabel: { fontSize: 11.5, color: COLORS.muted, marginTop: 2, textAlign: 'center' },
  section: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 4, marginBottom: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  rowLeft: { flex: 1 },
  rowDate: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  lvlChip: { flexDirection: 'row', alignItems: 'center' },
  miniDot: { width: 9, height: 9, borderRadius: 5, marginRight: 6 },
  lvlText: { fontSize: 12, color: COLORS.muted },
  rowRight: { alignItems: 'flex-end' },
  rowSteps: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  rowSub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  rowMet: { fontSize: 12.5, fontWeight: '700', marginTop: 4 },
});