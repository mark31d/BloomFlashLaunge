// Components/GamesScreen.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  SafeAreaView,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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

// Локальная БД (совместима по id c GameDetails)
const GAMES_DB = [
  {
    id: 'flash',
    title: 'Flash',
    tagline: 'Lightning-fast station',
    speed: 'Very fast',
    difficulty: 'Medium',
    session: '2–10 min',
    tags: ['fast', 'short', 'reaction'],
    media: [require('../assets/flash_thumb.png')],
    stations: { zone: 'A', available: ['A11', 'A12', 'A16'], busy: ['A14', 'A15'] },
    score: 98, // популярность
  },
  {
    id: 'blitz',
    title: 'Blitz',
    tagline: 'Short bursts, sharp focus',
    speed: 'Fast',
    difficulty: 'Easy',
    session: '1–5 min',
    tags: ['warmup', 'timing'],
    media: [require('../assets/flash_thumb.png')],
    stations: { zone: 'B', available: ['B21', 'B22'], busy: ['B23'] },
    score: 87,
  },
  {
    id: 'vector',
    title: 'Vector',
    tagline: 'Balanced pace and control',
    speed: 'Balanced',
    difficulty: 'Medium',
    session: '5–12 min',
    tags: ['balanced', 'control'],
    media: [require('../assets/flash_thumb.png')],
    stations: { zone: 'C', available: ['C31'], busy: ['C32', 'C33'] },
    score: 81,
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

export default function GamesScreen() {
  const navigation = useNavigation();

  const [query, setQuery] = useState('');
  const [speed, setSpeed] = useState('All');        // All | Very fast | Fast | Balanced
  const [onlyFree, setOnlyFree] = useState(false);  // только игры, где есть свободные станции
  const [sort, setSort] = useState('Popular');      // Popular | Free first

  const [favs, setFavs] = useState([]);
  const [queue, setQueue] = useState([]);

  // загрузка фаворитов/очереди
  useEffect(() => {
    (async () => {
      try {
        const f = await AsyncStorage.getItem(STORAGE_FAVS);
        const q = await AsyncStorage.getItem(STORAGE_QUEUE);
        setFavs(f ? JSON.parse(f) : []);
        setQueue(q ? JSON.parse(q) : []);
      } catch {}
    })();
  }, []);

  const toggleFav = useCallback(async (id) => {
    try {
      const isFav = favs.includes(id);
      const next = isFav ? favs.filter((x) => x !== id) : [...favs, id];
      setFavs(next);
      await AsyncStorage.setItem(STORAGE_FAVS, JSON.stringify(next));
    } catch {}
  }, [favs]);

  const toggleQueue = useCallback(async (id) => {
    try {
      const isQueued = queue.includes(id);
      const next = isQueued ? queue.filter((x) => x !== id) : [...queue, id];
      setQueue(next);
      await AsyncStorage.setItem(STORAGE_QUEUE, JSON.stringify(next));
      if (!isQueued) Alert.alert('Queued', 'We will notify you in-app when a station becomes free.');
    } catch {}
  }, [queue]);

  const filtered = useMemo(() => {
    let arr = [...GAMES_DB];

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      arr = arr.filter((g) =>
        g.title.toLowerCase().includes(q) ||
        g.tagline.toLowerCase().includes(q) ||
        g.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (speed !== 'All') {
      arr = arr.filter((g) => g.speed === speed);
    }
    if (onlyFree) {
      arr = arr.filter((g) => g.stations.available.length > 0);
    }
    if (sort === 'Popular') {
      arr.sort((a, b) => b.score - a.score);
    } else if (sort === 'Free first') {
      arr.sort((a, b) => b.stations.available.length - a.stations.available.length);
    }
    return arr;
  }, [query, speed, onlyFree, sort]);

  const openDetails = useCallback((id) => {
    navigation.navigate('GameDetails', { gameId: id });
  }, [navigation]);

  const openSeats = useCallback(() => navigation.getParent()?.navigate('Seats'), [navigation]);

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header / Search */}
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <Text style={styles.h1}>Games</Text>

        <View style={[styles.searchWrap, { marginTop: 12 }]}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or tag…"
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={styles.searchInput}
          />
        </View>

        {/* Filters */}
        <View style={[styles.card, { marginTop: 10 }]}>
          <Text style={styles.h2}>Filters</Text>

          <Text style={[styles.label, { marginTop: 8 }]}>Speed</Text>
          <View style={[styles.row, { gap: 8 }]}>
            {['All', 'Very fast', 'Fast', 'Balanced'].map((s) => (
              <Pressable
                key={s}
                onPress={() => setSpeed(s)}
                style={[
                  styles.segment,
                  { borderColor: s === speed ? PALETTE.gold : PALETTE.border, backgroundColor: s === speed ? '#171B3F' : '#0E1231' },
                ]}
              >
                <Text style={[styles.segmentText, s === speed && { color: PALETTE.gold }]}>{s}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: 10 }]}>Show</Text>
          <View style={[styles.row, { gap: 8 }]}>
            <Pressable
              onPress={() => setOnlyFree((v) => !v)}
              style={[
                styles.segment,
                { borderColor: onlyFree ? PALETTE.aqua : PALETTE.border, backgroundColor: onlyFree ? '#2B2B0F' : '#0E1231' },
              ]}
            >
              <Text style={[styles.segmentText, { color: onlyFree ? PALETTE.aqua : 'rgba(255,255,255,0.85)' }]}>
                Only free now
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSort((s) => (s === 'Popular' ? 'Free first' : 'Popular'))}
              style={[
                styles.segment,
                { borderColor: PALETTE.border, backgroundColor: '#0E1231' },
              ]}
            >
              <Text style={styles.segmentText}>Sort: {sort}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 140, paddingTop: 4 }}
        renderItem={({ item }) => (
          <GameCard
            game={item}
            fav={favs.includes(item.id)}
            queued={queue.includes(item.id)}
            onOpen={() => openDetails(item.id)}
            onFav={() => toggleFav(item.id)}
            onQueue={() => toggleQueue(item.id)}
            onSeats={openSeats}
          />
        )}
        ListEmptyComponent={
          <View style={[styles.card, { marginTop: 8 }]}>
            <Text style={styles.p}>Nothing found. Try clearing filters or changing your search.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function GameCard({ game, fav, queued, onOpen, onFav, onQueue, onSeats }) {
  const freeCount = game.stations.available.length;
  const busyCount = game.stations.busy.length;

  return (
    <View style={[styles.card, { marginBottom: 12, overflow: 'hidden', padding: 0 }]}>
      {/* media */}
      <Image source={game.media[0]} style={styles.hero} resizeMode="contain" />

      <View style={{ padding: 16 }}>
        <View style={[styles.rowBetween]}>
          <Text style={styles.h2}>{game.title}</Text>
          <Pressable onPress={onFav} style={styles.badgeBtn}>
            <Text style={[styles.badgeText, fav && { color: PALETTE.gold }]}>{fav ? '★ Favorite' : '☆ Favorite'}</Text>
          </Pressable>
        </View>

        <Text style={[styles.p, { marginTop: 4 }]}>{game.tagline}</Text>

        {/* chips */}
        <View style={[styles.rowWrap, { marginTop: 8 }]}>
          <Chip label={game.speed} color={PALETTE.violet} />
          <Chip label={game.difficulty} color={PALETTE.orange} />
          <Chip label={game.session} color={PALETTE.gold} />
          <Chip label={`${freeCount} free`} color={PALETTE.aqua} />
          <Chip label={`${busyCount} busy`} color={PALETTE.pink} />
          <Chip label={`Zone ${game.stations.zone}`} color={'#9AD0FF'} />
        </View>

        {/* tags */}
        <View style={[styles.rowWrap, { marginTop: 6 }]}>
          {game.tags.map((t) => (
            <Tag key={t} label={`#${t}`} />
          ))}
        </View>

        {/* actions */}
        <View style={[styles.row, { gap: 8, marginTop: 12 }]}>
          <GButton title="Open" onPress={onOpen} style={{ flex: 1 }} />
          <GButton
            title={queued ? 'Queued' : 'Notify me'}
            onPress={onQueue}
            colors={queued ? ['#2B2F51', '#2B2F51'] : [PALETTE.aqua, '#FFB23C']}
            textColor={queued ? '#E8ECF1' : '#0C0F2A'}
            style={{ width: 140 }}
          />
        </View>

        <Pressable onPress={onSeats} style={[styles.miniBtn, { marginTop: 10, alignSelf: 'flex-start' }]}>
          <Text style={styles.miniBtnText}>Open seats map</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* --- small UI atoms --- */
function Chip({ label, color }) {
  return (
    <View style={[styles.chip, { borderColor: color }]}>
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}
function Tag({ label }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

/* --- styles --- */
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

  searchWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: '#0E1231',
  },
  searchInput: {
    height: 44,
    paddingHorizontal: 12,
    color: '#E8ECF1',
    fontSize: 14,
  },

  segment: { flex: 1, paddingVertical: 10, borderWidth: 1, borderRadius: 12, alignItems: 'center' },
  segmentText: { color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 12 },

  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  hero: { width: '100%', height: 240 },

  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '800' },

  tag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: '#0E1231',
  },
  tagText: { color: '#E8ECF1', fontSize: 11, fontWeight: '700' },

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

  badgeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: '#0E1231',
  },
  badgeText: { color: '#E8ECF1', fontWeight: '800', fontSize: 12 },

  miniBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: '#0E1231',
  },
  miniBtnText: { color: '#E8ECF1', fontWeight: '700', fontSize: 12 },
});
