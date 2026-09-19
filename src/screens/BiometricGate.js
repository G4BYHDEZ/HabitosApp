import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { COLORS } from '../theme';
import { Btn } from '../components';

export default function BiometricGate({ onUnlock, reason }) {
  const [status, setStatus] = useState('loading');
  const [types, setTypes] = useState([]);
  const [checking, setChecking] = useState(false);
  const [failMsg, setFailMsg] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [has, enrolled] = await Promise.all([
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
        ]);
        let supported = [];
        try {
          supported = await LocalAuthentication.supportedAuthenticationTypesAsync();
        } catch (e) {
          supported = [];
        }
        setTypes(supported || []);
        if (!has) {
          setStatus('no_hardware');
          setFailMsg('Este dispositivo no tiene sensor biométrico (huella, Face ID o iris).');
        } else if (!enrolled) {
          setStatus('not_enrolled');
          setFailMsg('No hay ninguna huella, Face ID o iris registrado en el dispositivo.');
        } else {
          setStatus('ready');
        }
      } catch (e) {
        setStatus('error');
        setFailMsg('No se pudo consultar el estado biométrico del dispositivo.');
      }
    })();
  }, [tick]);

  const authName = () => {
    const hasFinger = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
    const hasFace = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
    const hasIris = types.includes(LocalAuthentication.AuthenticationType.IRIS);
    if (hasFinger && hasFace) return 'huella o Face ID';
    if (hasFinger) return 'huella';
    if (hasFace || hasIris) return 'Face ID';
    return 'biometría';
  };

  const unlock = async () => {
    if (checking) return;
    setChecking(true);
    setFailMsg('');
    try {
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        promptDescription: 'Verifica tu identidad para acceder a tus datos.',
        cancelLabel: 'Cancelar',
      });
      if (res.success) {
        onUnlock();
      } else {
        if (res.error && res.error !== 'user_cancel') {
          setFailMsg('No se pudo verificar la identidad. Intenta de nuevo.');
        }
      }
    } catch (e) {
      setFailMsg('La verificación biométrica no está disponible en este momento.');
    }
    setChecking(false);
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.box}>
        <Text style={styles.icon}>🌱</Text>
        <Text style={styles.title}>Datos protegidos</Text>
        <Text style={styles.subtitle}>{reason}</Text>

        {status === 'loading' && <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 18 }} />}

        {status === 'ready' && (
          <>
            <Btn
              label={checking ? 'Verificando…' : `Desbloquear con ${authName()}`}
              onPress={unlock}
              disabled={checking}
            />
            {!!failMsg && <Text style={styles.warn}>{failMsg}</Text>}
          </>
        )}

        {(status === 'no_hardware' || status === 'not_enrolled' || status === 'error') && (
          <>
            <Text style={styles.warn}>{failMsg}</Text>
            <Btn label="Continuar sin biometría" outlined color={COLORS.text} onPress={onUnlock} style={{ marginBottom: 10 }} />
            <TouchableOpacity onPress={() => setTick((t) => t + 1)} style={styles.linkWrap}>
              <Text style={styles.link}>Volver a comprobar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  box: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 26,
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 26,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primaryDark,
    shadowOpacity: 0.12,
    shadowRadius: 0,
    shadowOffset: { width: 5, height: 5 },
    elevation: 4,
  },
  icon: {
    fontSize: 44,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 20,
  },
  warn: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 19,
  },
  linkWrap: {
    padding: 6,
  },
  link: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});