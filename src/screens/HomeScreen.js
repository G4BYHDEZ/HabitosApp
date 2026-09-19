import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../theme';
import { Btn, Card, ProgressBar } from '../components';
import { LEVELS, LEVEL_COLORS } from '../activity';
import { distanceKm, fmt, formatDistance, todayLabel } from '../util';

export default function HomeScreen({ profile, goal, snapshot, streak, distanceUnit, onToggleDistanceUnit, onGoals, onStats, onEditProfile }) {
  const steps = snapshot ? snapshot.steps : 0;
  const activeMinutes = snapshot ? snapshot.activeMinutes : 0;
  const level = snapshot ? snapshot.level : 'resting';
  const km = distanceKm(steps, profile ? profile.alturacm : 170);

  const met =
    goal && goal.type === 'pasos'
      ? steps >= goal.value
      : goal && goal.type === 'distancia'
        ? km >= goal.value
        : null;

  const sensor = snapshot ? snapshot.sensor : null;
  const noAccel = sensor && sensor.accel !== 'ok';
  const noPed = sensor && (sensor.pedometer === 'denied' || sensor.pedometer === 'unavailable' || sensor.pedometer === 'error');

  const progressValue = goal && goal.type === 'distancia' ? km : steps;
  const progressMax = goal ? goal.value : 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.hi}>Hola, {profile ? profile.nombre : ''}</Text>
          <Text style={styles.date}>{todayLabel()}</Text>
        </View>
        <Text style={styles.streak}>🔥 {streak} días</Text>
      </View>

      <Card>
        <Text style={styles.cardTitle}>Nivel de actividad ahora</Text>
        <View style={styles.levelRow}>
          <View style={[styles.dot, { backgroundColor: LEVEL_COLORS[level] }]} />
          <Text style={styles.levelText}>{LEVELS[level]}</Text>
        </View>
        <Text style={styles.mutedText}>Semáforo de intensidad del acelerómetro; se acumula en tu registro diario.</Text>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Actividad de hoy</Text>
        <Text style={styles.bigNum}>{fmt(steps)}</Text>
        <View style={styles.distRow}>
          <Text style={styles.bigLabel}>pasos · {formatDistance(km, distanceUnit)}</Text>
          <TouchableOpacity onPress={onToggleDistanceUnit} style={styles.unitChip}>
            <Text style={styles.unitChipText}>{distanceUnit === 'km' ? 'km' : 'm'}</Text>
          </TouchableOpacity>
        </View>

        {goal ? (
          <>
            <View style={styles.progressTop}>
              <Text style={styles.mutedText}>
                Meta: {goal.type === 'pasos' ? fmt(goal.value) + ' pasos' : formatDistance(goal.value, distanceUnit)}
              </Text>
              <Text style={[styles.metaState, { color: met ? COLORS.primary : COLORS.danger }]}>
                {met ? '✓ Cumplida' : 'En proceso'}
              </Text>
            </View>
            <ProgressBar value={progressValue} max={progressMax} color={met ? COLORS.primary : COLORS.accent} />
          </>
        ) : (
          <Text style={styles.mutedText}>Define una meta diaria para ver tu progreso y racha.</Text>
        )}

        <View style={styles.split}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{activeMinutes}</Text>
            <Text style={styles.statLabel}>min activos</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{formatDistance(distanceKm(steps, profile ? profile.alturacm : 170), distanceUnit)}</Text>
            <Text style={styles.statLabel}>{distanceUnit === 'km' ? 'km hoy' : 'metros hoy'}</Text>
          </View>
        </View>

        {!!noAccel && <Text style={styles.sensorNote}>El acelerómetro no está disponible; no se registrarán minutos activos.</Text>}
        {!!noPed && (
          <Text style={styles.sensorNote}>
            No hay permiso para contar pasos. Activa el acceso a "Actividad física" (Android) o "Movimiento y estado físico" (iOS) en los Ajustes del sistema.
          </Text>
        )}
      </Card>

      <View style={styles.actions}>
        <Btn label={goal ? 'Editar meta' : 'Definir meta'} onPress={onGoals} style={{ flex: 1, marginRight: 8 }} outlined={!!goal} />
        <Btn label="Estadísticas" onPress={onStats} style={{ flex: 1, marginLeft: 8 }} />
      </View>

      <TouchableOpacity onPress={onEditProfile} style={styles.editLink}>
        <Text style={styles.editText}>Editar perfil</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  hi: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  date: { fontSize: 14, color: COLORS.muted, marginTop: 2 },
  streak: { fontSize: 15, fontWeight: '700', color: COLORS.gold, backgroundColor: COLORS.warm, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 5, borderWidth: 1, borderColor: '#F2D7A5' },
  cardTitle: { fontSize: 13, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  levelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dot: { width: 14, height: 14, borderRadius: 7, marginRight: 10 },
  levelText: { fontSize: 19, fontWeight: '700', color: COLORS.text },
  mutedText: { fontSize: 12.5, color: COLORS.muted, lineHeight: 18 },
  bigNum: { fontSize: 44, fontWeight: '800', color: COLORS.text },
  distRow: { flexDirection: 'row', alignItems: 'center' },
  bigLabel: { fontSize: 15, color: COLORS.muted, marginBottom: 14, flexShrink: 1 },
  unitChip: {
    marginLeft: 8,
    marginBottom: 14,
    backgroundColor: COLORS.soft,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  unitChipText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  metaState: { fontSize: 13, fontWeight: '700' },
  split: { flexDirection: 'row', marginTop: 16 },
  statBox: { flex: 1, flexDirection: 'row', alignItems: 'baseline', borderLeftWidth: 3, borderLeftColor: COLORS.accent, paddingLeft: 8 },
  statNum: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: 12.5, color: COLORS.muted, marginLeft: 6 },
  actions: { flexDirection: 'row', marginTop: 6 },
  sensorNote: { marginTop: 12, fontSize: 12, color: COLORS.danger, lineHeight: 17 },
  editLink: { alignSelf: 'center', marginTop: 18, padding: 8 },
  editText: { color: COLORS.muted, fontSize: 14, textDecorationLine: 'underline' },
});