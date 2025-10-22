// Components/QRScreen.js
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Share,
  Alert,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';
import LinearGradient from 'react-native-linear-gradient';

const PALETTE = {
  bg: '#0C0F2A',
  card: '#101432',
  border: '#1B2040',
  text: '#FFFFFF',
  dim: 'rgba(255,255,255,0.78)',
  gold: '#FFD166',
  gold2: '#FFB23C',
  accent: '#FFD166',
};

function PrimaryButton({ title, onPress, colors, style }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryBtn,
        style,
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.98 },
      ]}
      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Text style={styles.primaryText}>{title}</Text>
    </Pressable>
  );
}

function GhostButton({ title, onPress, style }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.ghostBtn,
        style,
        pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
      ]}
      android_ripple={{ color: 'rgba(255,255,255,0.08)' }}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text style={styles.ghostText}>{title}</Text>
    </Pressable>
  );
}

function GButton({ title, onPress, kind = 'primary', style }) {
  if (kind === 'ghost') {
    return <GhostButton title={title} onPress={onPress} style={style} />;
  }
  const colors = kind === 'accent' ? ['#FFD166', '#FFB23C'] : [PALETTE.gold, PALETTE.gold2];
  return <PrimaryButton title={title} onPress={onPress} colors={colors} style={style} />;
}

export default function QRScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const initial = route?.params?.booking || null;

  const [booking, setBooking] = useState(initial);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const load = async () => {
        if (initial) {
          // синхронизируем “последнюю бронь” при прямом переходе
          try { await AsyncStorage.setItem('RFSH_last_booking', JSON.stringify(initial)); } catch {}
          setBooking(initial);
          return;
        }
        try {
          const raw = await AsyncStorage.getItem('RFSH_last_booking');
          if (mounted && raw) setBooking(JSON.parse(raw));
        } catch {}
      };
      load();
      return () => { mounted = false; };
    }, [initial])
  );

  const payload = useMemo(() => {
    if (!booking) return null;
    // компактный полезный пейлоад для сканера
    return JSON.stringify({
      t: 'RFSH_BOOKING',
      ref: booking.ref,
      d: booking.dateISO,
      tm: booking.time,
      rm: booking.room,
      g: booking.guests,
      v: 1,
    });
  }, [booking]);

  const qrData = useMemo(() => {
    if (!payload) return null;
    return payload;
  }, [payload]);


  const sharePass = useCallback(async () => {
    if (!booking) return;
    try {
      await Share.share({
        message: `BloomFlash Launge booking\nRef: ${booking.ref}\nDate: ${booking.dateISO} ${booking.time}\nRoom: ${booking.room}\nGuests: ${booking.guests}`,
        title: 'BloomFlash Launge booking',
      });
    } catch (e) {
      Alert.alert('Share', 'Unable to share pass right now.');
    }
  }, [booking]);

  const toSeats = useCallback(() => navigation.getParent()?.navigate('Seats'), [navigation]);
  const newBooking = useCallback(() => navigation.getParent()?.navigate('Lounge'), [navigation]);

  if (!booking) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={[styles.card, { margin: 16 }]}>
          <Text style={styles.h2}>No booking found</Text>
          <Text style={[styles.p, { marginTop: 8 }]}>
            Make a booking to generate a QR pass for fast entry.
          </Text>
          <GButton title="Book now" onPress={newBooking} style={{ marginTop: 12 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text style={styles.h1}>Your Booking QR</Text>

        {/* QR Card (белая подложка для надёжного сканирования) */}
        <View style={[styles.card, { alignItems: 'center', marginTop: 12 }]}>
          <View style={styles.qrWrap}>
            {qrData ? (
              <View style={styles.qrContainer}>
                <Text style={styles.qrLabel}>BloomFlash Launge</Text>
                <QRCode
                  value={qrData}
                  size={200}
                  color="#000000"
                  backgroundColor="#FFFFFF"
                />
                <Text style={styles.qrRef}>REF: {booking?.ref || 'N/A'}</Text>
              </View>
            ) : (
              <View style={styles.qrLoading}>
                <Text style={styles.qrLoadingText}>Loading...</Text>
              </View>
            )}
          </View>
          <Text style={[styles.p, { marginTop: 10, textAlign: 'center' }]}>
            Show this code at the entrance for a quick check-in.
          </Text>
          <GButton title="Share pass" onPress={sharePass} style={{ marginTop: 12, alignSelf: 'stretch' }} />
        </View>

        {/* Ticket stub */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <View style={styles.rowBetween}>
            <Text style={styles.stubLabel}>Reference</Text>
            <Text style={[styles.stubValue, { color: PALETTE.gold }]}>{booking.ref}</Text>
          </View>
          <View style={[styles.rowBetween, { marginTop: 8 }]}>
            <Text style={styles.stubLabel}>Date & time</Text>
            <Text style={styles.stubValue}>{booking.dateISO} · {booking.time}</Text>
          </View>
          <View style={[styles.rowBetween, { marginTop: 8 }]}>
            <Text style={styles.stubLabel}>Room</Text>
            <Text style={styles.stubValue}>{booking.room}</Text>
          </View>
          <View style={[styles.rowBetween, { marginTop: 8 }]}>
            <Text style={styles.stubLabel}>Guests</Text>
            <Text style={styles.stubValue}>{booking.guests}</Text>
          </View>

          <View style={[styles.hr, { marginVertical: 12 }]} />

          <View style={[styles.rowBetween, { gap: 8 }]}>
            <GButton title="Open seats map" onPress={toSeats} kind="accent" style={{ flex: 1 }} />
            <GButton title="New booking" onPress={newBooking} kind="primary" style={{ flex: 1 }} />
          </View>
        </View>

        {/* Info block */}
        <View style={[styles.info, { marginTop: 12 }]}>
          <Text style={styles.infoText}>
            Keep brightness high and avoid screen cracks over the QR. Your pass expires if the booking time is exceeded.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PALETTE.bg },

  h1: { color: PALETTE.text, fontSize: 22, fontWeight: '800' },
  h2: { color: PALETTE.text, fontSize: 16, fontWeight: '700' },
  p: { color: PALETTE.dim, fontSize: 14, lineHeight: 20 },

  card: {
    backgroundColor: PALETTE.card,
    borderColor: PALETTE.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },

  qrWrap: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 280,
    height: 280,
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 240,
    height: 240,
  },
  qrLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
    textAlign: 'center',
  },
  qrRef: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD166',
    marginTop: 8,
    textAlign: 'center',
  },
  qrLoading: {
    width: 240,
    height: 240,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrLoadingText: {
    color: '#666666',
    fontSize: 14,
  },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  // buttons
  primaryBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  primaryText: { color: '#1A1A1A', fontWeight: '800', letterSpacing: 0.4, fontSize: 16 },

  ghostBtn: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  ghostText: { color: '#E8ECF1', fontWeight: '700', fontSize: 16, letterSpacing: 0.2 },

  // stub
  stubLabel: { color: 'rgba(255,255,255,0.66)', fontSize: 12 },
  stubValue: { color: PALETTE.text, fontSize: 14, fontWeight: '700' },
  hr: { height: 1, backgroundColor: PALETTE.border, width: '100%' },

  info: {
    backgroundColor: '#0E1231',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 12,
  },
  infoText: { color: 'rgba(255,255,255,0.78)', fontSize: 12, lineHeight: 18 },
});
