import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../theme';
import { Btn } from '../components';

export default function GoalsScreen({ goal, onSave, onBack }) {
  const [type, setType] = useState(goal ? goal.type : 'pasos');
  const [value, setValue] = useState(goal ? String(goal.value) : '10000');

  const submit = () => {
    const v = Number(value);
    if (!Number.isFinite(v) || v <= 0) return Alert.alert('Valor inválido', 'Ingresa un número mayor a 0.');
    onSave({ type, value: Math.round(v) });
  };

  const suggestions = type === 'pasos' ? [5000, 8000, 10000] : [3, 5, 8];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>← Volver</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Meta diaria</Text>
      <Text style={styles.subtitle}>Cumple tu meta de actividad cada día para mantener tu racha.</Text>

      <Text style={styles.label}>Tipo de meta</Text>
      <View style={styles.seg}>
        <TouchableOpacity style={[styles.segItem, type === 'pasos' && styles.segItemOn]} onPress={() => setType('pasos')}>
          <Text style={[styles.segText, type === 'pasos' && styles.segTextOn]}>Pasos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.segItem, type === 'distancia' && styles.segItemOn]} onPress={() => setType('distancia')}>
          <Text style={[styles.segText, type === 'distancia' && styles.segTextOn]}>Distancia (km)</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>{type === 'pasos' ? 'Pasos por día' : 'Kilómetros por día'}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setValue}
        keyboardType="number-pad"
        placeholder={type === 'pasos' ? '10000' : '5'}
        placeholderTextColor={COLORS.placeholder}
        maxLength={6}
      />

      <Text style={styles.label}>Sugerencias</Text>
      <View style={styles.sugRow}>
        {suggestions.map((s) => (
          <TouchableOpacity key={s} style={styles.sug} onPress={() => setValue(String(s))}>
            <Text style={styles.sugText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Btn label="Guardar meta" onPress={submit} style={{ marginTop: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 40 },
  back: { alignSelf: 'flex-start', paddingVertical: 6 },
  backText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginTop: 4, marginBottom: 6 },
  subtitle: { fontSize: 14, color: COLORS.muted, lineHeight: 20, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  seg: { flexDirection: 'row', backgroundColor: COLORS.soft, borderRadius: 16, padding: 4, borderWidth: 1, borderColor: COLORS.border },
  segItem: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  segItemOn: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.primary },
  segText: { color: COLORS.muted, fontSize: 14, fontWeight: '600' },
  segTextOn: { color: COLORS.primary },
  sugRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sug: {
    flex: 1,
    marginRight: 8,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sugText: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },
});