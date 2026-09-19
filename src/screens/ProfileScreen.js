import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../theme';
import { Btn } from '../components';

const SEXOS = ['Hombre', 'Mujer', 'Otro'];

export default function ProfileScreen({ profile, onSave, onBack }) {
  const [nombre, setNombre] = useState(profile ? profile.nombre : '');
  const [sexo, setSexo] = useState(profile ? profile.sexo : 'Hombre');
  const [nacimiento, setNacimiento] = useState(profile ? profile.nacimiento : '');
  const [altura, setAltura] = useState(profile ? String(profile.alturacm) : '');

  const validDate = (s) => {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
    if (!m) return false;
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    return d.getDate() === Number(m[1]) && d.getMonth() === Number(m[2]) - 1;
  };

  const submit = () => {
    if (!nombre.trim()) return Alert.alert('Falta el nombre', 'Escribe tu nombre.');
    if (!validDate(nacimiento)) return Alert.alert('Fecha inválida', 'Usa el formato DD/MM/AAAA.');
    const a = Number(altura);
    if (!Number.isFinite(a) || a < 100 || a > 250) return Alert.alert('Altura inválida', 'La altura debe estar entre 100 y 250 cm.');
    onSave({ nombre: nombre.trim(), sexo, nacimiento, alturacm: a });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.back}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.title}>{profile ? 'Editar perfil' : 'Crea tu perfil'}</Text>
      <Text style={styles.subtitle}>Estos datos se guardan en tu dispositivo y se usan para calcular tu actividad diaria.</Text>

      <Text style={styles.label}>Nombre</Text>
      <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Tu nombre" placeholderTextColor={COLORS.placeholder} />

      <Text style={styles.label}>Sexo</Text>
      <View style={styles.seg}>
        {SEXOS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.segItem, sexo === s && styles.segItemOn]}
            onPress={() => setSexo(s)}
          >
            <Text style={[styles.segText, sexo === s && styles.segTextOn]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Fecha de nacimiento</Text>
      <TextInput style={styles.input} value={nacimiento} onChangeText={setNacimiento} placeholder="DD/MM/AAAA" placeholderTextColor={COLORS.placeholder} maxLength={10} />

      <Text style={styles.label}>Altura (cm)</Text>
      <TextInput
        style={styles.input}
        value={altura}
        onChangeText={setAltura}
        placeholder="Ej. 172"
        placeholderTextColor={COLORS.placeholder}
        keyboardType="number-pad"
        maxLength={3}
      />

      <Btn label="Guardar" onPress={submit} style={{ marginTop: 8 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 40 },
  back: { alignSelf: 'flex-start', paddingVertical: 6 },
  backText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 6, marginTop: 4 },
  subtitle: { fontSize: 14, color: COLORS.muted, marginBottom: 18, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 14 },
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
});