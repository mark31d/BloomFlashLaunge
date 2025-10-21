// Components/StaffScreen.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TextInput,
  Alert,
  Linking,
  Switch,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const PALETTE = {
  bg: '#0C0F2A',
  card: '#101432',
  border: '#1B2040',
  text: '#E8ECF1',
  dim: 'rgba(255,255,255,0.78)',
  gold: '#FFD166',
  gold2: '#FFB23C',
  aqua: '#FFD166',
  pink: '#FF4D8C',
  orange: '#FF8A3D',
  violet: '#7A4CFF',
  green: '#3AD29F',
};

const STORAGE_TICKETS = 'VF_help_requests';

const STAFF = [
  {
    id: 'st01',
    name: 'Iryna M',
    role: 'Host',
    phone: '+380441112233',
    email: 'host@velvetflash.app',
    languages: ['EN', 'UA'],
    shift: '16:00–00:00',
    status: 'On duty', // On duty, Break, Offline
  },
  {
    id: 'st02',
    name: 'Dmytro K',
    role: 'Dealer',
    phone: '+380441112244',
    email: 'dealer@velvetflash.app',
    languages: ['EN', 'UA', 'RU'],
    shift: '18:00–02:00',
    status: 'On duty',
  },
  {
    id: 'st03',
    name: 'Olena S',
    role: 'Tech Support',
    phone: '+380441112255',
    email: 'support@velvetflash.app',
    languages: ['EN', 'UA'],
    shift: '12:00–20:00',
    status: 'Break',
  },
  {
    id: 'st04',
    name: 'Andrii P',
    role: 'Security',
    phone: '+380441112266',
    email: 'security@velvetflash.app',
    languages: ['UA', 'RU'],
    shift: '20:00–04:00',
    status: 'On duty',
  },
];

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

function GButton({ title, onPress, colors = [PALETTE.gold, PALETTE.gold2], textColor = '#1A1A1A', style }) {
  return <PrimaryButton title={title} onPress={onPress} colors={colors} style={style} textColor={textColor} />;
}

export default function StaffScreen() {
  const navigation = useNavigation();

  const [refreshing, setRefreshing] = useState(false);
  const [autoAssign, setAutoAssign] = useState(true);
  const [tickets, setTickets] = useState([]);

  // form
  const [reason, setReason] = useState('Booking'); // Booking | Seating | Technical | Other
  const [seat, setSeat] = useState('');
  const [note, setNote] = useState('');
  const [priority, setPriority] = useState('Normal'); // Normal | Urgent

  // roster (можем имитировать обновления статуса)
  const [roster, setRoster] = useState(STAFF);

  // загружаем открытые заявки
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_TICKETS);
        setTickets(raw ? JSON.parse(raw) : []);
      } catch {}
    })();
  }, []);

  // ручное обновление (эмуляция смены статусов)
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRoster((prev) =>
        prev.map((s, i) => {
          // простая ротация статуса
          const next = { ...s };
          if (s.status === 'On duty' && Math.random() < 0.15) next.status = 'Break';
          else if (s.status === 'Break' && Math.random() < 0.5) next.status = 'On duty';
          else if (s.status === 'Offline' && Math.random() < 0.3) next.status = 'On duty';
          return next;
        })
      );
      setRefreshing(false);
    }, 600);
  }, []);

  const openPhone = useCallback((phone) => Linking.openURL(`tel:${phone}`).catch(() => {}), []);
  const openMail = useCallback((mail) => Linking.openURL(`mailto:${mail}`).catch(() => {}), []);

  const openSeatsMap = useCallback(() => navigation.getParent()?.navigate('Seats'), [navigation]);
  const openBooking = useCallback(() => navigation.getParent()?.navigate('Lounge'), [navigation]);

  // отправка тикета
  const submitTicket = useCallback(async () => {
    if (!seat.trim()) {
      Alert.alert('Seat / Area', 'Please specify your seat label or area (e.g., A12 or Lobby).');
      return;
    }
    const ref = `H${Math.floor(100000 + Math.random() * 899999)}`;
    const payload = {
      ref,
      reason,
      seat: seat.trim(),
      note: note.trim(),
      priority,
      ts: Date.now(),
      status: 'Open',
      assigned: autoAssign ? autoAssignStaff(roster, reason) : null,
    };

    try {
      const next = [payload, ...tickets].slice(0, 50);
      setTickets(next);
      await AsyncStorage.setItem(STORAGE_TICKETS, JSON.stringify(next));
    } catch {}

    setSeat('');
    setNote('');
    setReason('Booking');
    setPriority('Normal');

    if (payload.assigned) {
      Alert.alert('Request created', `Ref ${ref}\nAssigned to ${payload.assigned.name} (${payload.assigned.role}).`);
    } else {
      Alert.alert('Request created', `Ref ${ref}\nWe'll come to ${payload.seat} shortly.`);
    }
  }, [seat, note, reason, priority, tickets, roster, autoAssign]);

  const openCount = useMemo(() => tickets.filter((t) => t.status === 'Open').length, [tickets]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
        refreshControl={<RefreshControl tintColor="#fff" refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.h1}>Our Staff</Text>

        {/* Summary / Quick CTAs */}
        <View style={[styles.card, { marginTop: 12 }]}>
          <View style={[styles.rowBetween]}>
            <Text style={styles.p}>Open requests</Text>
            <Text style={[styles.p, { color: PALETTE.gold, fontWeight: '800' }]}>{openCount}</Text>
          </View>

          <View style={[styles.row, { gap: 8, marginTop: 12 }]}>
            <GButton title="Open seats map" onPress={openSeatsMap} colors={[PALETTE.aqua, '#FFB23C']} textColor="#0C0F2A" style={{ flex: 1 }} />
            <GButton title="New booking" onPress={openBooking} style={{ flex: 1 }} />
          </View>

          <View style={[styles.rowBetween, { marginTop: 12 }]}>
            <Text style={styles.p}>Auto-assign to best staff</Text>
            <Switch
              value={autoAssign}
              onValueChange={setAutoAssign}
              trackColor={{ false: '#3a3f66', true: '#6b652b' }}
              thumbColor={autoAssign ? PALETTE.gold : '#bfc3d9'}
            />
          </View>
        </View>

        {/* Roster */}
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.h2}>On duty</Text>
          <View style={{ marginTop: 10 }}>
            {roster.map((s) => (
              <StaffRow key={s.id} staff={s} onCall={() => openPhone(s.phone)} onMail={() => openMail(s.email)} />
            ))}
          </View>
        </View>

        {/* Assistance form */}
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.h2}>Request assistance</Text>

          <Text style={[styles.label, { marginTop: 10 }]}>Reason</Text>
          <Segmented
            value={reason}
            options={['Booking', 'Seating', 'Technical', 'Other']}
            onChange={setReason}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Seat / Area</Text>
          <Input value={seat} onChangeText={setSeat} placeholder="E.g., A12 or Lobby" />

          <Text style={[styles.label, { marginTop: 12 }]}>Notes (optional)</Text>
          <Input
            value={note}
            onChangeText={setNote}
            placeholder="Short details for faster help"
            multiline
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Priority</Text>
          <Segmented value={priority} options={['Normal', 'Urgent']} onChange={setPriority} />

          <GButton title="Send request" onPress={submitTicket} style={{ marginTop: 14 }} />
          <Info text="We’ll notify you in app when a staff member is on their way." />
        </View>

        {/* FAQ */}
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.h2}>FAQ</Text>
          <FAQ q="How fast will someone arrive?" a="Usually within 3–5 minutes when On duty. Urgent priority may preempt current tasks." />
          <FAQ q="Can I pick a specific staff member?" a="Yes. If auto-assign is off, call or email the person directly from the roster." />
          <FAQ q="What if I don’t know my seat?" a="Open Seats map and tap your location; include the code (e.g., B23) in the request." />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- helpers ---------- */
function StaffRow({ staff, onCall, onMail }) {
  const badgeColor =
    staff.status === 'On duty' ? PALETTE.green : staff.status === 'Break' ? PALETTE.orange : '#666A8A';

  return (
    <View style={styles.staffRow}>
      <Avatar name={staff.name} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.staffName}>{staff.name}</Text>
        <Text style={styles.staffRole}>{staff.role} · Shift {staff.shift}</Text>
        <View style={[styles.row, { gap: 6, marginTop: 6, flexWrap: 'wrap' }]}>
          {staff.languages.map((l) => (
            <Tag key={l} label={l} />
          ))}
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <View style={[styles.statusDot, { backgroundColor: badgeColor }]} />
        <Text style={styles.statusText}>{staff.status}</Text>
        <View style={[styles.row, { gap: 6, marginTop: 8 }]}>
          <MiniBtn title="Call" onPress={onCall} />
          <MiniBtn title="Email" onPress={onMail} />
        </View>
      </View>
    </View>
  );
}

function Avatar({ name }) {
  const initials = useMemo(() => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase(), [name]);
  return (
    <LinearGradient colors={['#1B2040', '#0E1231']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </LinearGradient>
  );
}

function Tag({ label }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

function MiniBtn({ title, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.miniBtn}>
      <Text style={styles.miniBtnText}>{title}</Text>
    </Pressable>
  );
}

function Input({ value, onChangeText, placeholder, multiline = false }) {
  return (
    <View style={styles.inputWrap}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.35)"
        style={[styles.input, multiline && { height: 88, textAlignVertical: 'top' }]}
        multiline={multiline}
      />
    </View>
  );
}

function Segmented({ value, options, onChange }) {
  return (
    <View style={[styles.row, { gap: 8 }]}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[
              styles.segment,
              { borderColor: active ? PALETTE.gold : PALETTE.border, backgroundColor: active ? '#171B3F' : '#0E1231' },
            ]}
          >
            <Text style={[styles.segmentText, active && { color: PALETTE.gold }]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Info({ text }) {
  return (
    <View style={styles.info}>
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

function FAQ({ q, a }) {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={styles.faqQ}>{q}</Text>
      <Text style={styles.faqA}>{a}</Text>
    </View>
  );
}

function autoAssignStaff(roster, reason) {
  // очень простой подбор: по роли
  const roleMap = {
    Booking: 'Host',
    Seating: 'Host',
    Technical: 'Tech Support',
    Other: 'Host',
  };
  const targetRole = roleMap[reason] || 'Host';
  const available = roster.filter((s) => s.role === targetRole && s.status === 'On duty');
  return available[0] || roster.find((s) => s.status === 'On duty') || null;
}

/* ---------- styles ---------- */
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

  // roster
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  avatarText: { color: '#E8ECF1', fontWeight: '800' },
  staffName: { color: PALETTE.text, fontWeight: '800' },
  staffRole: { color: 'rgba(255,255,255,0.66)', fontSize: 12, marginTop: 2 },

  statusDot: { width: 8, height: 8, borderRadius: 4, alignSelf: 'flex-end' },
  statusText: { color: 'rgba(255,255,255,0.66)', fontSize: 12, marginTop: 2 },

  tag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: '#0E1231',
  },
  tagText: { color: '#E8ECF1', fontSize: 11, fontWeight: '700' },

  miniBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: '#0E1231',
  },
  miniBtnText: { color: '#E8ECF1', fontWeight: '700', fontSize: 12 },

  // form
  label: { color: 'rgba(255,255,255,0.86)', fontSize: 12, marginBottom: 6 },
  inputWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: '#0E1231',
  },
  input: {
    height: 44,
    paddingHorizontal: 12,
    color: '#E8ECF1',
    fontSize: 14,
  },

  segment: { flex: 1, paddingVertical: 10, borderWidth: 1, borderRadius: 12, alignItems: 'center' },
  segmentText: { color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 12 },

  info: {
    backgroundColor: '#0E1231',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 12,
    marginTop: 12,
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

  // FAQ
  faqQ: { color: '#E8ECF1', fontWeight: '800', marginTop: 6 },
  faqA: { color: 'rgba(255,255,255,0.78)', marginTop: 2, lineHeight: 18 },
});
