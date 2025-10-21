// Components/SeatingGuide.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Modal,
  Alert,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
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
  aqua: '#FFD166',
  red: '#EF5350',
  orange: '#FF8A3D',
  violet: '#7A4CFF',
};

const ZONES = ['A', 'B', 'C'];
const STORAGE_PREFS = 'VF_seats_prefs';
const STORAGE_RESERVED_LOCAL = 'VF_reserved_local';

const STATUS = {
  available: { key: 'available', label: 'Available', color: PALETTE.aqua },
  occupied: { key: 'occupied', label: 'Occupied', color: PALETTE.red },
  reserved: { key: 'reserved', label: 'Reserved', color: PALETTE.gold },
  maintenance: { key: 'maintenance', label: 'Maintenance', color: PALETTE.orange },
};

function PrimaryButton({ title, onPress, colors, style, textColor = '#1A1A1A' }) {
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
      <Text style={[styles.primaryText, { color: textColor }]}>{title}</Text>
    </Pressable>
  );
}

function GButton({ title, onPress, style, colors = [PALETTE.gold, PALETTE.gold2], textColor = '#1A1A1A' }) {
  return <PrimaryButton title={title} onPress={onPress} colors={colors} style={style} textColor={textColor} />;
}

export default function SeatingGuide() {
  const navigation = useNavigation();

  const [zone, setZone] = useState('ALL');
  const [onlyFree, setOnlyFree] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [seats, setSeats] = useState(() => generateInitialSeats());
  const [selected, setSelected] = useState(null);

  // load prefs & local reservations
  useEffect(() => {
    (async () => {
      try {
        const prefs = await AsyncStorage.getItem(STORAGE_PREFS);
        if (prefs) {
          const { zone: z = 'ALL', onlyFree: f = false, autoRefresh: a = true } = JSON.parse(prefs);
          setZone(z); setOnlyFree(f); setAutoRefresh(a);
        }
        const stored = await AsyncStorage.getItem(STORAGE_RESERVED_LOCAL);
        if (stored) {
          const ids = new Set(JSON.parse(stored)); // array of seat ids reserved by user on this device
          setSeats((prev) => prev.map(s => ids.has(s.id) ? { ...s, status: 'reserved', reservedByMe: true } : s));
        }
      } catch {}
    })();
  }, []);

  // persist prefs
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_PREFS, JSON.stringify({ zone, onlyFree, autoRefresh })).catch(() => {});
  }, [zone, onlyFree, autoRefresh]);

  // auto-refresh simulation (подключи API тут, когда будет бэкенд)
  const intervalRef = useRef(null);
  useEffect(() => {
    if (!autoRefresh) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setSeats((current) => simulateSensorTick(current));
    }, 10_000);
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // имитация запроса
    setTimeout(() => {
      setSeats((current) => simulateSensorTick(current, true));
      setRefreshing(false);
    }, 600);
  }, []);

  const filtered = useMemo(() => {
    let arr = seats;
    if (zone !== 'ALL') arr = arr.filter(s => s.zone === zone);
    if (onlyFree) arr = arr.filter(s => s.status === 'available');
    return arr;
  }, [seats, zone, onlyFree]);

  const stats = useMemo(() => {
    const total = seats.length;
    const counts = {
      available: seats.filter(s => s.status === 'available').length,
      occupied: seats.filter(s => s.status === 'occupied').length,
      reserved: seats.filter(s => s.status === 'reserved').length,
      maintenance: seats.filter(s => s.status === 'maintenance').length,
    };
    return { total, counts };
  }, [seats]);

  const openSeat = useCallback((seat) => setSelected(seat), []);
  const closeSeat = useCallback(() => setSelected(null), []);

  const reserveSeat = useCallback(async (seat) => {
    if (seat.status !== 'available') return;
    const updated = seats.map(s => s.id === seat.id ? { ...s, status: 'reserved', reservedByMe: true } : s);
    setSeats(updated);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_RESERVED_LOCAL);
      const arr = raw ? JSON.parse(raw) : [];
      if (!arr.includes(seat.id)) arr.push(seat.id);
      await AsyncStorage.setItem(STORAGE_RESERVED_LOCAL, JSON.stringify(arr));
    } catch {}
    setSelected({ ...seat, status: 'reserved', reservedByMe: true });
    Alert.alert('Reserved', `Seat ${seat.label} reserved for your booking window.`);
  }, [seats]);

  const goBook = useCallback(() => navigation.getParent()?.navigate('Lounge'), [navigation]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        refreshControl={<RefreshControl tintColor="#fff" refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <Text style={styles.h1}>Seating Information</Text>
        <View style={[styles.card, { marginTop: 12 }]}>
          <Legend />
        </View>

        {/* Filters */}
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.h2}>Filters</Text>
          <Text style={[styles.label, { marginTop: 10 }]}>Zones</Text>
          <View style={[styles.row, { gap: 8 }]}>
            {['ALL', ...ZONES].map((z) => (
              <Pressable
                key={z}
                onPress={() => setZone(z)}
                style={[
                  styles.segment,
                  { borderColor: z === zone ? PALETTE.gold : PALETTE.border, backgroundColor: z === zone ? '#171B3F' : '#0E1231' },
                ]}
              >
                <Text style={[styles.segmentText, z === zone && { color: PALETTE.gold }]}>{z}</Text>
              </Pressable>
            ))}
          </View>

          <View style={[styles.rowBetween, { marginTop: 12 }]}>
            <View style={styles.row}>
              <View style={[styles.dot, { backgroundColor: PALETTE.aqua }]} />
              <Text style={styles.p}>Only available</Text>
            </View>
            <Switch
              value={onlyFree}
              onValueChange={setOnlyFree}
              trackColor={{ false: '#3a3f66', true: '#6b652b' }}
              thumbColor={onlyFree ? PALETTE.aqua : '#bfc3d9'}
            />
          </View>

          <View style={[styles.rowBetween, { marginTop: 8 }]}>
            <View style={styles.row}>
              <View style={[styles.dot, { backgroundColor: PALETTE.gold }]} />
              <Text style={styles.p}>Auto refresh (10s)</Text>
            </View>
            <Switch
              value={autoRefresh}
              onValueChange={setAutoRefresh}
              trackColor={{ false: '#3a3f66', true: '#6b652b' }}
              thumbColor={autoRefresh ? PALETTE.gold : '#bfc3d9'}
            />
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.h2}>Live occupancy</Text>
          <View style={[styles.rowWrap, { marginTop: 10 }]}>
            <Tag color={PALETTE.aqua} label={`Available: ${stats.counts.available}`} />
            <Tag color={PALETTE.red} label={`Occupied: ${stats.counts.occupied}`} />
            <Tag color={PALETTE.gold} label={`Reserved: ${stats.counts.reserved}`} />
            <Tag color={PALETTE.orange} label={`Maint.: ${stats.counts.maintenance}`} />
            <Tag color={PALETTE.violet} label={`Total: ${stats.total}`} />
          </View>
        </View>

        {/* Map */}
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.h2}>Seats map {zone !== 'ALL' ? `· Zone ${zone}` : ''}</Text>
          <View style={styles.mapWrap}>
            {filtered.map((s) => (
              <Seat key={s.id} seat={s} onPress={() => openSeat(s)} />
            ))}
          </View>
          <GButton title="Book a table" onPress={goBook} style={{ marginTop: 12 }} />
        </View>
      </ScrollView>

      {/* Seat modal */}
      <Modal transparent visible={!!selected} animationType="fade" onRequestClose={closeSeat}>
        <View style={styles.modalWrap}>
          <View style={[styles.card, { width: '88%' }]}>
            <Text style={styles.h2}>Seat {selected?.label}</Text>
            <View style={[styles.hr, { marginVertical: 10 }]} />
            <Row label="Zone" value={selected?.zone} />
            <Row label="Row" value={selected?.row} />
            <Row label="Col" value={selected?.col} />
            <Row label="Status" value={STATUS[selected?.status]?.label || selected?.status} color={statusColor(selected)} />
            <Row label="Power outlet" value={selected?.power ? 'Yes' : 'No'} />
            <Row label="Table space" value={`${selected?.deskWidth} cm`} />
            {selected?.reservedByMe ? <Note text="You reserved this seat from this device." /> : null}

            <View style={[styles.row, { gap: 8, marginTop: 12 }]}>
              <GButton title="Close" onPress={closeSeat} colors={['#2B2F51', '#2B2F51']} textColor="#E8ECF1" style={{ flex: 1 }} />
              {selected?.status === 'available' && (
                <GButton title="Reserve" onPress={() => reserveSeat(selected)} style={{ flex: 1 }} />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* --- UI atoms --- */
function Legend() {
  return (
    <View>
      <Text style={styles.h2}>Legend</Text>
      <View style={[styles.rowBetween, { marginTop: 10 }]}>
        <LegendItem color={PALETTE.aqua} label="Available" />
        <LegendItem color={PALETTE.red} label="Occupied" />
        <LegendItem color={PALETTE.gold} label="Reserved" />
        <LegendItem color={PALETTE.orange} label="Maintenance" />
      </View>
      <Text style={[styles.p, { marginTop: 10 }]}>
        Seats update automatically based on built-in sensors. Please don’t leave personal items to “hold” a seat.
      </Text>
    </View>
  );
}
function LegendItem({ color, label }) {
  return (
    <View style={styles.row}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text style={styles.p}>{label}</Text>
    </View>
  );
}
function Tag({ color, label }) {
  return (
    <View style={[styles.tag, { borderColor: color }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}
function Row({ label, value, color }) {
  return (
    <View style={[styles.rowBetween, { marginTop: 6 }]}>
      <Text style={[styles.p, { color: 'rgba(255,255,255,0.66)' }]}>{label}</Text>
      <Text style={[styles.p, { color: color || '#E8ECF1', fontWeight: '700' }]}>{value}</Text>
    </View>
  );
}
function Note({ text }) {
  return (
    <View style={[styles.info, { marginTop: 10 }]}>
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}
function Seat({ seat, onPress }) {
  const c = STATUS[seat.status]?.color || '#888';
  const bg = seat.status === 'available' ? '#0E1231' : '#0F1130';
  const border = seat.status === 'available' ? c : PALETTE.border;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.seat, { borderColor: border, backgroundColor: bg }]}
      accessibilityRole="button"
      accessibilityLabel={`Seat ${seat.label}, status ${seat.status}`}
    >
      <View style={[styles.seatBadge, { backgroundColor: c }]} />
      <Text style={styles.seatText}>{seat.label}</Text>
    </Pressable>
  );
}

/* --- Data & simulation --- */
function generateInitialSeats() {
  // 3 зоны × 24 места = 72
  const out = [];
  ZONES.forEach((z, zi) => {
    for (let r = 1; r <= 4; r++) {
      for (let c = 1; c <= 6; c++) {
        const id = `${z}-${r}-${c}`;
        out.push({
          id,
          label: `${z}${r}${c}`,
          zone: z,
          row: r,
          col: c,
          status: randomStatus(),
          power: Math.random() < 0.6,           // есть розетка?
          deskWidth: 60 + Math.floor(Math.random() * 16), // ширина столешницы, см
          reservedByMe: false,
        });
      }
    }
  });
  return out;
}
function randomStatus() {
  const roll = Math.random();
  if (roll < 0.58) return 'available';
  if (roll < 0.82) return 'occupied';
  if (roll < 0.94) return 'reserved';
  return 'maintenance';
}
function simulateSensorTick(current, harder = false) {
  // имитация изменений: часть мест меняет статус
  const copy = current.map(s => ({ ...s }));
  const changes = Math.max(4, Math.floor(copy.length * (harder ? 0.15 : 0.08)));
  for (let i = 0; i < changes; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    const s = copy[idx];
    if (s.reservedByMe) continue; // не трогаем свои локальные резервы
    // простая логика: занятые -> свободные/резерв; свободные -> занятые/резерв
    if (s.status === 'occupied' && Math.random() < 0.5) s.status = 'available';
    else if (s.status === 'available' && Math.random() < 0.55) s.status = 'occupied';
    else if (s.status === 'maintenance' && Math.random() < 0.4) s.status = 'available';
    else if (s.status === 'reserved' && Math.random() < 0.35) s.status = 'available';
  }
  return copy;
}
function statusColor(s) {
  const c = STATUS[s?.status]?.color;
  return c || '#E8ECF1';
}

/* --- Styles --- */
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

  label: { color: 'rgba(255,255,255,0.86)', fontSize: 12, marginBottom: 6 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },

  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  segment: { flex: 1, paddingVertical: 10, borderWidth: 1, borderRadius: 12, alignItems: 'center' },
  segmentText: { color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 12 },

  // tags
  tag: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1 },
  tagText: { fontSize: 12, fontWeight: '800' },

  // map
  mapWrap: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  seat: {
    width: '15.5%',               // 6 столбцов с зазором
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1,
    padding: 6,
    justifyContent: 'space-between',
  },
  seatBadge: { width: 8, height: 8, borderRadius: 4, alignSelf: 'flex-end' },
  seatText: { color: '#E8ECF1', fontSize: 12, fontWeight: '700' },

  // modal
  modalWrap: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  hr: { height: 1, backgroundColor: PALETTE.border, width: '100%' },

  info: {
    backgroundColor: '#0E1231',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 12,
  },
  infoText: { color: 'rgba(255,255,255,0.78)', fontSize: 12, lineHeight: 18 },

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
  primaryText: { fontWeight: '800', letterSpacing: 0.4, fontSize: 16 },
});
