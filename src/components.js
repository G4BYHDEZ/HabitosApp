import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from './theme';

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Btn({ label, onPress, color = COLORS.primary, disabled, outlined, style }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        outlined ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: color } : { backgroundColor: color },
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.btnText, outlined ? { color } : null]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function ProgressBar({ value, max, color = COLORS.primary }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 22,
    borderBottomRightRadius: 6,
    borderBottomLeftRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primaryDark,
    shadowOpacity: 0.1,
    shadowRadius: 0,
    shadowOffset: { width: 4, height: 4 },
    elevation: 3,
  },
  btn: {
    borderRadius: 5,
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  track: {
    height: 12,
    borderRadius: 3,
    backgroundColor: COLORS.soft,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});