// Components/Onboarding.js
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  FlatList,
  Pressable,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');

const DEFAULT_PALETTE = {
  bg: '#0C0F2A',
  card: '#101432',
  border: '#1B2040',
  gold: '#FFD166',
  gold2: '#FFB23C',
  text: '#E8ECF1',
  dim: 'rgba(255,255,255,0.78)',
};

const ASSETS = {
  hero1: require('../assets/tab_home.png'),
  hero2: require('../assets/tab_seat.png'),
  hero3: require('../assets/tab_games.png'),
  hero4: require('../assets/tab_qr.png'),
};

const SLIDES = [
  { key: 'book',   title: 'Book in a Few Taps', text: 'Reserve your table straight from your phone.\nNo calls, no hassle — quick and modern.', image: ASSETS.hero1, color: '#FFD166' },
  { key: 'seats',  title: 'Smart Seating in Real-Time', text: 'See which seats are free right now.\nBuilt-in sensors keep availability accurate.', image: ASSETS.hero2, color: '#00E5FF' },
  { key: 'explore',title: 'Explore Games Ahead', text: 'Browse stations and visuals before you arrive.\nPick what you want to play.', image: ASSETS.hero3, color: '#FF4081' },
  { key: 'qr',     title: 'Instant Entry with QR', text: 'Show your in-app QR at the door and start faster.\nWelcome to BloomFlash Launge.', image: ASSETS.hero4, color: '#8B5CF6' },
];

/* ------------ Buttons ------------- */
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

export default function Onboarding({ onComplete = () => {}, palette = DEFAULT_PALETTE }) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const flatRef = useRef(null);

  const isLast = index === SLIDES.length - 1;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems?.length > 0) setIndex(viewableItems[0].index ?? 0);
  }).current;
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 60 });

  const handleNext = useCallback(() => {
    if (isLast) onComplete();
    else flatRef.current?.scrollToIndex({ index: index + 1, animated: true });
  }, [index, isLast, onComplete]);

  const handleBack = useCallback(() => {
    if (index > 0) flatRef.current?.scrollToIndex({ index: index - 1, animated: true });
  }, [index]);

  const handleSkip = useCallback(() => onComplete(), [onComplete]);

  const Dot = useCallback(
    ({ active }) => (
      <View style={[styles.dot, { backgroundColor: active ? palette.gold : 'rgba(255,255,255,0.28)' }]} />
    ),
    [palette.gold]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <View style={[styles.slide, { width: SCREEN_W }]}>
        <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.card }]}>
          <Image 
            source={item.image} 
            style={styles.image} 
            resizeMode="contain"
            tintColor={item.color}
          />
        </View>
        <Text style={[styles.title, { color: palette.text }]}>{item.title}</Text>
        <Text style={[styles.text, { color: palette.dim }]}>{item.text}</Text>
      </View>
    ),
    [palette]
  );

  const gradientColors = useMemo(() => [palette.gold, palette.gold2], [palette]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]} edges={['top','bottom','left','right']}>
      <StatusBar barStyle="light-content" backgroundColor={palette.bg} />

      {/* Slides */}
      <FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={(it) => it.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={renderItem}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfigRef.current}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <Dot key={i} active={i === index} />
        ))}
      </View>

      {/* CTA — центрировано и широко */}
      <View style={[styles.ctaWrap, { paddingBottom: Math.max(insets.bottom, 22), alignItems: 'center' }]}>
        {isLast ? (
          <PrimaryButton title="Get Started" onPress={handleNext} colors={gradientColors} style={styles.wide} />
        ) : (
          <>
            <PrimaryButton title="Next" onPress={handleNext} colors={gradientColors} style={styles.wide} />
            {index > 0 && <GhostButton title="Back" onPress={handleBack} style={[styles.wide, { marginTop: 10 }]} />}
          </>
        )}
        
        {/* Skip button moved down */}
        <Pressable onPress={handleSkip} hitSlop={12} style={styles.skipBtnBottom}>
          <Text style={[styles.skipText, { color: palette.dim }]}>Skip</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipBtnBottom: { padding: 10, marginTop: 12 },
  skipText: { fontSize: 14 },

  slide: { paddingHorizontal: 20, paddingTop: 80, alignItems: 'center' },

  card: {
    width: '100%',
    height: 260,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '80%', height: '80%' },

  title: { fontSize: 22, fontWeight: '800', marginTop: 20, textAlign: 'center' },
  text: { fontSize: 14, lineHeight: 20, marginTop: 10, textAlign: 'center' },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 18, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },

  ctaWrap: { paddingHorizontal: 20, marginTop: 16 },

  /* ширина для кнопок — около 92% экрана */
  wide: { width: '92%', alignSelf: 'center' },

  primaryBtn: {
    height: 60,
    borderRadius: 30,
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
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  ghostText: { color: '#E8ECF1', fontWeight: '700', fontSize: 16, letterSpacing: 0.2 },
});
