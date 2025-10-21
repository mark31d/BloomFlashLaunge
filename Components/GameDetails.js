// Components/GameDetails.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Alert,
  Switch,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';

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
};

const STORAGE_FAVS = 'VF_favorite_games';
const STORAGE_QUEUE = 'VF_queue_games';

const GAMES_DB = {
  flash: {
    id: 'flash',
    title: 'Flash',
    tagline: 'Lightning-fast station for thrill seekers',
    description:
      'Play smart and fast in FLASH. With instant rounds and clean UI, Flash is perfect for short, intense sessions. Learn the rhythm, optimize your reactions, and enjoy streamlined gameplay.',
    media: [
      require('../assets/logo_text.png'),
      require('../assets/logo_text.png'),
    ],
    facts: [
      { label: 'Speed', value: 'Very fast' },
      { label: 'Difficulty', value: 'Medium' },
      { label: 'Best for', value: '2–10 min sessions' },
    ],
    // где искать станции (пример; в реале подставь из API)
    stations: {
      zone: 'A',
      available: ['A11', 'A12', 'A16'],
      busy: ['A14', 'A15'],
    },
    similar: ['blitz', 'vector'],
  },

  // Мок похожих игр (без картинок; можно добавить ассеты, если появятся)
  blitz: {
    id: 'blitz',
    title: 'Blitz',
    tagline: 'Short bursts, sharp focus',
    description:
      'Compact rounds and quick outcomes. Ideal for warming up and learning timing windows before Flash.',
    media: [require('../assets/logo_text.png')],
    facts: [
      { label: 'Speed', value: 'Fast' },
      { label: 'Difficulty', value: 'Easy' },
      { label: 'Sessions', value: '1–5 min' },
    ],
    stations: { zone: 'B', available: ['B21', 'B22'], busy: ['B23'] },
    similar: ['flash', 'vector'],
  },

  vector: {
    id: 'vector',
    title: 'Vector',
    tagline: 'Balanced pace and control',
    description:
      'More control and clearer pacing. Great step-up once you’ve mastered Blitz and want deeper runs.',
    media: [require('../assets/logo_text.png')],
    facts: [
      { label: 'Speed', value: 'Balanced' },
      { label: 'Difficulty', value: 'Medium' },
      { label: 'Sessions', value: '5–12 min' },
    ],
    stations: { zone: 'C', available: ['C31'], busy: ['C32', 'C33'] },
    similar: ['flash'],
  },
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

function GButton({ title, onPress, colors = [PALETTE.gold, PALETTE.gold2], textColor = '#1A1A1A', style }) {
  return <PrimaryButton title={title} onPress={onPress} colors={colors} style={style} textColor={textColor} />;
}

export default function GameDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const gameIdParam = route?.params?.gameId;

  const [gameId, setGameId] = useState(gameIdParam || 'flash');
  const game = useMemo(() => GAMES_DB[gameId] || GAMES_DB.flash, [gameId]);

  // избранное / очередь
  const [favs, setFavs] = useState([]);
  const [queue, setQueue] = useState([]); // ids с уведомлениями
  const isFav = favs.includes(game.id);
  const inQueue = queue.includes(game.id);

  // живой статус (эмуляция)
  const [liveStations, setLiveStations] = useState(game.stations);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const tickRef = useRef(null);

  // подгрузка и синхронизация при входе
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const load = async () => {
        try {
          const f = await AsyncStorage.getItem(STORAGE_FAVS);
          const q = await AsyncStorage.getItem(STORAGE_QUEUE);
          if (mounted) {
            setFavs(f ? JSON.parse(f) : []);
            setQueue(q ? JSON.parse(q) : []);
          }
        } catch {}
      };
      load();

      return () => { mounted = false; };
    }, [])
  );

  // сбрасываем статус при смене игры
  useEffect(() => {
    setLiveStations(game.stations);
  }, [gameId, game.stations]);

  // автообновление (каждые 10с)
  useEffect(() => {
    if (!autoRefresh) { clearInterval(tickRef.current); return; }
    tickRef.current = setInterval(() => {
      setLiveStations((curr) => simulateLive(curr));
    }, 10_000);
    return () => clearInterval(tickRef.current);
  }, [autoRefresh]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setLiveStations((curr) => simulateLive(curr, true));
      setRefreshing(false);
    }, 600);
  }, []);

  const toggleFav = useCallback(async () => {
    try {
      const next = isFav ? favs.filter((id) => id !== game.id) : [...favs, game.id];
      setFavs(next);
      await AsyncStorage.setItem(STORAGE_FAVS, JSON.stringify(next));
    } catch {}
  }, [isFav, favs, game.id]);

  const toggleQueue = useCallback(async () => {
    try {
      const next = inQueue ? queue.filter((id) => id !== game.id) : [...queue, game.id];
      setQueue(next);
      await AsyncStorage.setItem(STORAGE_QUEUE, JSON.stringify(next));
      if (!inQueue) Alert.alert('Queued', 'We will notify you in-app when a station becomes free.');
    } catch {}
  }, [inQueue, queue, game.id]);

  const goBack = useCallback(() => navigation.goBack(), [navigation]);
  const goSimilar = useCallback((id) => setGameId(id), []);

  const openSeats = useCallback(() => navigation.getParent()?.navigate('Seats'), [navigation]);
  const openSlots = useCallback(() => navigation.navigate('SlotsCatalog'), [navigation]);

  const freeCount = liveStations.available.length;
  const busyCount = liveStations.busy.length;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.header]}>
        <Pressable onPress={goBack} style={styles.backBtn} hitSlop={8} accessibilityLabel="Go back">
          <Text style={{ color: PALETTE.gold, fontSize: 18 }}>◀</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{game.title}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
        refreshControl={<RefreshControl tintColor="#fff" refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* медиа-галерея */}
        <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
          <View style={styles.mediaContainer}>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
              {game.media.map((src, idx) => (
                <View key={idx} style={styles.imageWrapper}>
                  <Image source={src} style={styles.hero} resizeMode="contain" />
                </View>
              ))}
            </ScrollView>
          </View>

          {/* шапка под фото */}
          <View style={{ padding: 16 }}>
            <Text style={styles.h1}>{game.title}</Text>
            <Text style={[styles.p, { marginTop: 4 }]}>{game.tagline}</Text>

            <View style={[styles.row, { gap: 8, marginTop: 12 }]}>
              <Chip label={`${freeCount} free`} color={PALETTE.aqua} />
              <Chip label={`${busyCount} busy`} color={PALETTE.pink} />
              <Chip label={`Zone ${liveStations.zone}`} color={PALETTE.violet} />
            </View>

            <View style={[styles.rowBetween, { marginTop: 12 }]}>
              <FavButton active={isFav} onPress={toggleFav} />
              <QueueButton active={inQueue} onPress={toggleQueue} />
            </View>
          </View>
        </View>

        {/* описание */}
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.h2}>About</Text>
          <Text style={[styles.p, { marginTop: 8 }]}>{game.description}</Text>

          <View style={[styles.rowWrap, { marginTop: 10 }]}>
            {game.facts.map((f, i) => (
              <Fact key={i} label={f.label} value={f.value} />
            ))}
          </View>
        </View>

        {/* статус станций */}
        <View style={[styles.card, { marginTop: 12 }]}>
          <View style={styles.rowBetween}>
            <Text style={styles.h2}>Stations</Text>
            <View style={styles.row}>
              <Text style={[styles.p, { marginRight: 8 }]}>Auto refresh (10s)</Text>
              <Switch
                value={autoRefresh}
                onValueChange={setAutoRefresh}
                trackColor={{ false: '#3a3f66', true: '#6b652b' }}
                thumbColor={autoRefresh ? PALETTE.gold : '#bfc3d9'}
              />
            </View>
          </View>

          <Text style={[styles.p, { marginTop: 8 }]}>Available</Text>
          <View style={[styles.rowWrap, { marginTop: 6 }]}>
            {liveStations.available.length ? liveStations.available.map((l) => <SeatTag key={l} label={l} color={PALETTE.aqua} />)
              : <Text style={[styles.p, { color: '#bfc3d9' }]}>No free stations right now</Text>}
          </View>

          <Text style={[styles.p, { marginTop: 12 }]}>Busy</Text>
          <View style={[styles.rowWrap, { marginTop: 6 }]}>
            {liveStations.busy.length ? liveStations.busy.map((l) => <SeatTag key={l} label={l} color={PALETTE.pink} />)
              : <Text style={[styles.p, { color: '#bfc3d9' }]}>None</Text>}
          </View>

          <GButton title="Open seats map" onPress={openSeats} style={{ marginTop: 12 }} />
        </View>

        {/* действия */}
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.h2}>Actions</Text>
          <View style={[styles.row, { gap: 8, marginTop: 10 }]}>
            <GButton title="Add to queue" onPress={toggleQueue} style={{ flex: 1 }} />
            <GButton title="Slots" onPress={openSlots} colors={[PALETTE.aqua, '#FFB23C']} textColor="#0C0F2A" style={{ flex: 1 }} />
          </View>
        </View>

        {/* похожие игры */}
        {game.similar?.length ? (
          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={styles.h2}>Similar</Text>
            <View style={[styles.rowWrap, { marginTop: 10 }]}>
              {game.similar.map((sid) => {
                const g = GAMES_DB[sid];
                if (!g) return null;
                return (
                  <Pressable key={sid} onPress={() => goSimilar(sid)} style={styles.simItem}>
                    <View style={styles.simThumbWrap}>
                      <Image source={g.media[0]} style={styles.simThumb} />
                    </View>
                    <Text style={styles.simTitle} numberOfLines={1}>{g.title}</Text>
                    <Text style={styles.simTagline} numberOfLines={2}>{g.tagline}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

/* --- helpers & UI atoms --- */
function FavButton({ active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.badgeBtn, active && { borderColor: PALETTE.gold }]}>
      <Text style={[styles.badgeText, active && { color: PALETTE.gold }]}>{active ? '★ In Favorites' : '☆ Add to Favorites'}</Text>
    </Pressable>
  );
}
function QueueButton({ active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.badgeBtn, active && { borderColor: PALETTE.aqua }]}>
      <Text style={[styles.badgeText, active && { color: PALETTE.aqua }]}>{active ? 'In Queue' : 'Notify when free'}</Text>
    </Pressable>
  );
}
function Chip({ label, color }) {
  return (
    <View style={[styles.chip, { borderColor: color }]}>
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}
function Fact({ label, value }) {
  return (
    <View style={styles.fact}>
      <Text style={[styles.factLabel]}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}
function SeatTag({ label, color }) {
  return (
    <View style={[styles.seatTag, { borderColor: color }]}>
      <Text style={[styles.seatTagText, { color }]}>{label}</Text>
    </View>
  );
}

/* --- live simulation (заменить на реальные API вызовы) --- */
function simulateLive(curr, stronger = false) {
  // поверхностная имитация смены статусов
  const available = new Set(curr.available);
  const busy = new Set(curr.busy);
  const flipCount = Math.max(1, Math.floor((available.size + busy.size) * (stronger ? 0.25 : 0.12)));

  const all = [...available, ...busy];
  for (let i = 0; i < flipCount; i++) {
    const label = all[Math.floor(Math.random() * all.length)];
    if (!label) continue;
    if (available.has(label)) {
      available.delete(label); busy.add(label);
    } else if (busy.has(label)) {
      busy.delete(label); available.add(label);
    }
  }
  return { ...curr, available: [...available], busy: [...busy] };
}

/* --- styles --- */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PALETTE.bg },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { padding: 8 },
  headerTitle: { flex: 1, textAlign: 'center', color: PALETTE.text, fontSize: 18, fontWeight: '800' },

  card: {
    backgroundColor: PALETTE.card,
    borderColor: PALETTE.border,
    borderWidth: 1,
    borderRadius: 16,
  },

  mediaContainer: {
    width: '100%',
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E1231',
  },
  imageWrapper: {
    width: 320,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1F3A',
    borderRadius: 12,
    marginHorizontal: 8,
  },
  hero: { 
    width: 300, 
    height: 200,
  },

  h1: { color: PALETTE.text, fontSize: 22, fontWeight: '800' },
  h2: { color: PALETTE.text, fontSize: 16, fontWeight: '700' },
  p: { color: PALETTE.dim, fontSize: 14, lineHeight: 20 },

  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '800' },

  badgeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: '#0E1231',
  },
  badgeText: { color: '#E8ECF1', fontWeight: '800' },

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

  fact: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: '#0E1231',
    marginRight: 8,
  },
  factLabel: { color: 'rgba(255,255,255,0.66)', fontSize: 11 },
  factValue: { color: PALETTE.text, fontSize: 13, fontWeight: '700' },

  seatTag: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1 },
  seatTagText: { fontSize: 12, fontWeight: '800' },

  simItem: {
    width: 140,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: '#0E1231',
    marginRight: 10,
  },
  simThumbWrap: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  simThumb: { width: '100%', height: 80, resizeMode: 'cover' },
  simTitle: { color: PALETTE.text, fontWeight: '800', fontSize: 13, marginTop: 8 },
  simTagline: { color: PALETTE.dim, fontSize: 12, marginTop: 2 },
});
