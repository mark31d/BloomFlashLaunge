// Components/LoungeScreen.js
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  SafeAreaView,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';

const PALETTE = {
  bg: '#0C0F2A',
  card: '#101432',
  card2: '#13183A',
  border: '#1B2040',
  text: '#FFFFFF',
  dim: 'rgba(255,255,255,0.78)',
  gold: '#FFD166',
  gold2: '#FFB23C',
  success: '#FFD166',
};

const ASSETS = {
  gameThumb: require('../assets/logo_text.png'),
  icoSeat: require('../assets/tab_seat.png'),
  icoGames: require('../assets/tab_games.png'),
  icoQR: require('../assets/tab_qr.png'),
  icoStaff: require('../assets/tab_staff.png'),
};

const ROOMS = ['Standard', 'Couples', 'VIP'];

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

function GButton({ title, onPress, style }) {
  return <PrimaryButton title={title} onPress={onPress} colors={[PALETTE.gold, PALETTE.gold2]} style={style} />;
}

export default function LoungeScreen() {
  const navigation = useNavigation();

  // ---- booking form state ----
  const [room, setRoom] = useState(ROOMS[0]);
  const [guests, setGuests] = useState(2);
  const [date, setDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000)); // завтра
  const [time, setTime] = useState(new Date(new Date().setHours(18, 0, 0, 0))); // 18:00 сегодня
  const [showPicker, setShowPicker] = useState({ mode: null }); // { mode:'date'|'time' }

  const mins = useMemo(() => String(time.getMinutes()).padStart(2, '0'), [time]);
  const hrs = useMemo(() => String(time.getHours()).padStart(2, '0'), [time]);

  const formatDate = useCallback((d) => {
    try {
      return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return d.toDateString();
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    // простая валидация
    if (!room) return Alert.alert('Select room', 'Please choose a room type.');
    if (guests < 1) return Alert.alert('Guests', 'At least 1 guest.');
    const bookingRef = `${Math.floor(100000 + Math.random() * 899999)}`;

    const payload = {
      ref: bookingRef,
      room,
      guests,
      dateISO: date.toISOString().slice(0, 10),
      time: `${hrs}:${mins}`,
      ts: Date.now(),
    };

    try {
      await AsyncStorage.setItem('VF_last_booking', JSON.stringify(payload));
    } catch {}

    // перейти на вкладку QR и передать параметры
    navigation.getParent()?.navigate('QR', {
      screen: 'QRScreen',
      params: { booking: payload },
    });
  }, [navigation, room, guests, date, hrs, mins]);

  const goSeats = useCallback(() => navigation.getParent()?.navigate('Seats'), [navigation]);
  const goGames = useCallback(() => navigation.getParent()?.navigate('Games'), [navigation]);
  const goQR = useCallback(() => navigation.getParent()?.navigate('QR'), [navigation]);
  const goStaff = useCallback(() => navigation.getParent()?.navigate('Staff'), [navigation]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {/* Hero / Welcome */}
        <Text style={styles.h1}>
          WELCOME TO OUR <Text style={{ color: PALETTE.gold }}>VENUE</Text>
        </Text>
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.p}>
            Experience luxury and comfort in our elegantly designed rooms. Each space offers premium seating
            arrangements with state-of-the-art amenities for your ultimate entertainment experience.
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={[styles.row, { marginTop: 16, gap: 12 }]}>
          <QuickAction icon={ASSETS.icoSeat} title="Seats" onPress={goSeats} />
          <QuickAction icon={ASSETS.icoGames} title="Games" onPress={goGames} />
          <QuickAction icon={ASSETS.icoQR} title="QR" onPress={goQR} />
          <QuickAction icon={ASSETS.icoStaff} title="Staff" onPress={goStaff} />
        </View>

        {/* Booking Card */}
        <View style={[styles.card, { marginTop: 18 }]}>
          <Text style={styles.h2}>Book gaming table</Text>

          {/* Room type */}
          <Text style={[styles.label, { marginTop: 12 }]}>Room</Text>
          <View style={[styles.row, { gap: 8 }]}>
            {ROOMS.map((r) => (
              <Pressable
                key={r}
                onPress={() => setRoom(r)}
                style={[
                  styles.segment,
                  { borderColor: r === room ? PALETTE.gold : PALETTE.border, backgroundColor: r === room ? '#171B3F' : '#0E1231' },
                ]}
              >
                <Text style={[styles.segmentText, r === room && { color: PALETTE.gold }]}>{r}</Text>
              </Pressable>
            ))}
          </View>

          {/* Guests */}
          <Text style={[styles.label, { marginTop: 12 }]}>Guests</Text>
          <View style={[styles.rowBetween, styles.inputRow]}>
            <Stepper value={guests} onChange={setGuests} min={1} max={8} />
            <Text style={[styles.p, { color: PALETTE.gold }]}>{guests} {guests === 1 ? 'person' : 'people'}</Text>
          </View>

          {/* Date / Time */}
          <Text style={[styles.label, { marginTop: 12 }]}>Date & time</Text>
          <View style={[styles.row, { gap: 8 }]}>
            <Pressable style={styles.input} onPress={() => setShowPicker({ mode: 'date' })}>
              <Text style={styles.inputText}>{formatDate(date)}</Text>
            </Pressable>
            <Pressable style={[styles.input, { width: 120 }]} onPress={() => setShowPicker({ mode: 'time' })}>
              <Text style={styles.inputText}>
                {hrs}:{mins}
              </Text>
            </Pressable>
          </View>

          <GButton title="Confirm booking" onPress={handleConfirm} style={{ marginTop: 14 }} />

          <View style={[styles.info, { marginTop: 12 }]}>
            <Text style={styles.infoText}>
              Seats detect occupancy automatically. To keep things smooth, please don’t leave personal items on empty seats.
            </Text>
          </View>
        </View>

        {/* Preview game (teaser) */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.h2}>Flash</Text>
          <Image source={ASSETS.gameThumb} style={styles.thumb} />
          <Text style={[styles.p, { marginTop: 8 }]}>
            Play smart and fast in FLASH. With instant results and sleek action, it’s the lightning-fast game for thrill seekers.
          </Text>
          <GButton title="Open game" onPress={goGames} style={{ marginTop: 12 }} />
        </View>
      </ScrollView>

      {/* Native pickers in modal wrapper for consistent UX */}
      <Modal transparent visible={!!showPicker.mode} animationType="fade" onRequestClose={() => setShowPicker({ mode: null })}>
        <View style={styles.modalWrap}>
          <View style={[styles.card, { width: '88%' }]}>
            {showPicker.mode === 'date' && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                minimumDate={new Date()}
                onChange={(e, d) => {
                  if (Platform.OS !== 'ios') setShowPicker({ mode: null });
                  if (d) setDate(d);
                }}
              />
            )}
            {showPicker.mode === 'time' && (
              <DateTimePicker
                value={time}
                mode="time"
                is24Hour
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(e, t) => {
                  if (Platform.OS !== 'ios') setShowPicker({ mode: null });
                  if (t) setTime(t);
                }}
              />
            )}
            {Platform.OS === 'ios' && (
              <GButton title="Done" onPress={() => setShowPicker({ mode: null })} style={{ marginTop: 12 }} />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function QuickAction({ icon, title, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.qAction}>
      <Image 
        source={icon} 
        style={{ width: 22, height: 22, marginBottom: 6 }} 
        tintColor="#FFFFFF"
      />
      <Text style={styles.qText}>{title}</Text>
    </Pressable>
  );
}

function Stepper({ value, onChange, min = 0, max = 99 }) {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={() => onChange(Math.max(min, value - 1))} style={[styles.stepBtn, { borderRightWidth: 1 }]}>
        <Text style={styles.stepText}>−</Text>
      </Pressable>
      <View style={styles.stepValue}>
        <Text style={styles.stepValText}>{value}</Text>
      </View>
      <Pressable onPress={() => onChange(Math.min(max, value + 1))} style={[styles.stepBtn, { borderLeftWidth: 1 }]}>
        <Text style={styles.stepText}>＋</Text>
      </Pressable>
    </View>
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

  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

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

  qAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#0E1231',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  qText: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },

  label: { color: 'rgba(255,255,255,0.86)', fontSize: 12, marginBottom: 6 },
  segment: { flex: 1, paddingVertical: 10, borderWidth: 1, borderRadius: 12, alignItems: 'center' },
  segmentText: { color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 12 },

  inputRow: {
    backgroundColor: '#0E1231',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: '#0E1231',
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  inputText: { color: '#E8ECF1', fontSize: 14 },

  info: {
    backgroundColor: '#0E1231',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 12,
  },
  infoText: { color: 'rgba(255,255,255,0.78)', fontSize: 12, lineHeight: 18 },

  thumb: { width: '100%', height: 200, borderRadius: 12, resizeMode: 'cover', marginTop: 10 },

  // stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: '#0E1231',
    overflow: 'hidden',
  },
  stepBtn: { paddingHorizontal: 14, paddingVertical: 8, borderColor: PALETTE.border },
  stepText: { color: '#E8ECF1', fontSize: 18, fontWeight: '800' },
  stepValue: { paddingHorizontal: 16, paddingVertical: 8 },
  stepValText: { color: PALETTE.gold, fontSize: 16, fontWeight: '800' },

  // modal
  modalWrap: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
});
