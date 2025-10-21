// Components/SlotsCatalog.js
import React, { useMemo, useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList, Image, Platform, Modal, Dimensions, ScrollView
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const PALETTE = {
  bg: '#0C0F2A',
  text: '#E8ECF1',
  faint: 'rgba(255,255,255,0.65)',
  gold: '#FFD166',
  gold2: '#FFB23C',
  accent: '#50FFE3',
  border: '#FFFFFF',
};

// Thumbnails (adjust paths if needed)
const thumbs = {
  flash:  require('../assets/flash.png'),
  fruits: require('../assets/fruits.png'),
  prism:  require('../assets/prism.png'),
  sevens: require('../assets/sevens.png'),
};

// Slot meta (venue only; online disabled)
const SLOTS = [
  {
    id: 'flash',
    name: 'Flash 5×5',
    thumb: thumbs.flash,
    grid: '5×5',
    lines: '5 horizontal + 2 diagonal',
    volatility: 'Medium',
    rtp: '≈96.0%',
    features: ['Win streaks', 'Highlight lines', 'Quick spins'],
    venueArea: 'Main floor',
    venueFloor: '1F',
    venueEntrance: 'Lobby',
    machines: 6,
  },
  {
    id: 'fruits',
    name: 'Fruits Classic',
    thumb: thumbs.fruits,
    grid: '3×5',
    lines: '20',
    volatility: 'Low–Medium',
    rtp: '≈95.5%',
    features: ['Wilds', 'Scatter pays', 'Classic fruits'],
    venueArea: 'Retro zone',
    venueFloor: '1F',
    venueEntrance: 'Retro lobby',
    machines: 4,
  },
  {
    id: 'prism',
    name: 'Prism Lines',
    thumb: thumbs.prism,
    grid: '5×3',
    lines: '25',
    volatility: 'Medium–High',
    rtp: '≈96.2%',
    features: ['Expanding wilds', 'Line multipliers'],
    venueArea: 'East wing',
    venueFloor: '2F',
    venueEntrance: 'East gate',
    machines: 5,
  },
  {
    id: 'sevens',
    name: 'Lucky Sevens',
    thumb: thumbs.sevens,
    grid: '3×3',
    lines: '5',
    volatility: 'Low',
    rtp: '≈94.8%',
    features: ['Classic 7s', 'Bar symbols'],
    venueArea: 'Classic aisle',
    venueFloor: '1F',
    venueEntrance: 'North gate',
    machines: 3,
  },
];

/* ---------- Reusable UI ---------- */
function PrimaryButton({ title, onPress, disabled, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryBtn, style,
        disabled && { opacity: 0.6 },
        pressed && !disabled && { transform: [{ scale: 0.98 }] },
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <LinearGradient colors={[PALETTE.gold, PALETTE.gold2]} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill} />
      <Text style={styles.primaryText} numberOfLines={1}>{title}</Text>
    </Pressable>
  );
}

/* ---------- Card (full-bleed image) ---------- */
const CARD_RADIUS = 22;
const CARD_HEIGHT = 260;
const BTN_W = 220;

/* Радиусы/отступы для hero в модалке */
const HERO_RADIUS = 22;     // скругление самой картинки
const HERO_INSET  = 10;     // внутренний отступ от краёв контейнера

function SlotCard({ item, onOpen }) {
  return (
    <View style={styles.cardWrap}>
      <View style={styles.cardBorder} pointerEvents="none" />
      <View style={styles.cardFull}>
        <Image source={item.thumb} style={styles.cardImage} resizeMode="cover" />
        <LinearGradient
          colors={['rgba(12,15,42,0)', 'rgba(12,15,42,0.85)']}
          start={{x:0,y:0}} end={{x:0,y:1}}
          style={styles.cardOverlay}
        />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardSub} numberOfLines={2}>
            Available at our physical casino • <Text style={{ color: PALETTE.accent }}>Venue:</Text> {item.venueArea}
          </Text>
          <View style={styles.actionsRow}>
            <PrimaryButton title="Find at venue" onPress={() => onOpen(item)} style={styles.centerBtn} />
          </View>
        </View>
      </View>
    </View>
  );
}

/* ---------- Modal ---------- */
function LocTag({ label }) {
  return (
    <View style={styles.locTag}>
      <Text style={styles.locTagText}>{label}</Text>
    </View>
  );
}

function SlotDetailsModal({ visible, slot, onClose }) {
  const { width } = Dimensions.get('window');
  const SHEET_W = Math.min(width - 24, 540);
  const HERO_H = Math.max(170, Math.round(SHEET_W * 0.5));

  if (!slot) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={[styles.modalSheetWrap, { width: SHEET_W }]}>
        <View style={styles.modalBorder} pointerEvents="none" />
        <LinearGradient colors={['#101638', '#0B0F28']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.modalSheet}>
          <ScrollView contentContainerStyle={{ paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
            {/* ВНЕШНИЙ контейнер с внутренним отступом */}
            <View style={[styles.heroWrap, { height: HERO_H, padding: HERO_INSET }]}>
              {/* КЛИП-КОНТЕЙНЕР: именно он скругляет и обрезает изображение на iOS/Android */}
              <View
                style={styles.heroClip}
                collapsable={false}
                renderToHardwareTextureAndroid
              >
                <Image
                  source={slot.thumb}
                  style={styles.heroImg}
                  resizeMode="contain"     // без обрезания
                  accessible
                  accessibilityLabel={`${slot.name} image`}
                />
              </View>
            </View>

            <Text style={styles.modalTitle} numberOfLines={2}>{slot.name}</Text>
            <Text style={styles.modalSub}>
              Play this slot at our physical casino.
            </Text>

            <View style={styles.locationBox}>
              <Text style={styles.sectionTitle}>Location in casino</Text>
              <View style={styles.locTagsRow}>
                <LocTag label={`Area: ${slot.venueArea}`} />
                {slot.venueFloor && <LocTag label={`Floor: ${slot.venueFloor}`} />}
                {slot.venueEntrance && <LocTag label={`Entrance: ${slot.venueEntrance}`} />}
                {typeof slot.machines === 'number' && <LocTag label={`${slot.machines} machines`} />}
              </View>
              <Text style={styles.locHint}>
                Ask our staff for directions to this area. They’ll guide you to the nearest machine.
              </Text>
            </View>

            <View style={styles.modalMetaRow}>
              <View style={styles.metaCol}>
                <Text style={styles.infoLabel}>Grid</Text>
                <Text style={styles.infoValue}>{slot.grid}</Text>
              </View>
              <View style={styles.metaCol}>
                <Text style={styles.infoLabel}>Lines</Text>
                <Text style={styles.infoValue}>{slot.lines}</Text>
              </View>
            </View>
            <View style={styles.modalMetaRow}>
              <View style={styles.metaCol}>
                <Text style={styles.infoLabel}>Volatility</Text>
                <Text style={styles.infoValue}>{slot.volatility}</Text>
              </View>
              <View style={styles.metaCol}>
                <Text style={styles.infoLabel}>RTP</Text>
                <Text style={styles.infoValue}>{slot.rtp}</Text>
              </View>
            </View>

            <Text style={[styles.modalFeatures, { marginBottom: 6 }]}>
              {slot.features.join(' • ')}
            </Text>

            <PrimaryButton title="Close" onPress={onClose} style={[styles.centerBtn, { marginTop: 12 }]} />
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
}

/* ---------- Screen ---------- */
export default function SlotsCatalog() {
  const data = useMemo(() => SLOTS, []);
  const [selected, setSelected] = useState(null);
  const [visible, setVisible] = useState(false);

  const openModal = useCallback((slot) => {
    setSelected(slot);
    setVisible(true);
  }, []);
  const closeModal = useCallback(() => setVisible(false), []);

  return (
    <SafeAreaView style={styles.safe} edges={['top','bottom','left','right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Slots</Text>
        <Text style={styles.subtitle}>
          Browse our slots available in the physical casino. Online play is disabled in the app.
        </Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => <SlotCard item={item} onOpen={openModal} />}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        removeClippedSubviews={false}
        contentInsetAdjustmentBehavior="automatic"
        contentInset={{ bottom: 28 }}
        scrollIndicatorInsets={{ bottom: 28 }}
        ListFooterComponent={<View style={{ height: Platform.OS === 'ios' ? 48 : 32 }} />}
      />

      <SlotDetailsModal visible={visible} slot={selected} onClose={closeModal} />
    </SafeAreaView>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.bg },

  header: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 8 },
  title: { color: PALETTE.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: PALETTE.faint, marginTop: 6 },

  listContent: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 18 },

  // --- Card (list) ---
  cardWrap: { position: 'relative', borderRadius: CARD_RADIUS, overflow: 'visible' },
  cardBorder: {
    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
    borderRadius: CARD_RADIUS, borderWidth: 1.5, borderColor: PALETTE.border, zIndex: 1,
  },
  cardFull: {
    height: CARD_HEIGHT,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    backgroundColor: '#0B0F28',
  },
  cardImage: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: '100%', height: '100%' },
  cardOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: Math.round(CARD_HEIGHT * 0.55) },
  cardContent: { position: 'absolute', left: 16, right: 16, bottom: 14 },
  cardTitle: { color: PALETTE.text, fontWeight: '800', fontSize: 18 },
  cardSub: { color: PALETTE.faint, marginTop: 4 },
  actionsRow: { marginTop: 12, alignItems: 'center', justifyContent: 'center', width: '100%' },
  centerBtn: { width: BTN_W, alignSelf: 'center' },

  primaryBtn: { height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  primaryText: { color: '#1A1A1A', fontWeight: '800', letterSpacing: 0.3, fontSize: 14, textAlign: 'center' },

  // --- Modal ---
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  modalSheetWrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: Platform.OS === 'ios' ? 14 : 10,
    alignSelf: 'center',
    borderRadius: CARD_RADIUS,
    overflow: 'visible',
  },
  modalBorder: {
    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
    borderRadius: CARD_RADIUS, borderWidth: 1.5, borderColor: PALETTE.border, zIndex: 1,
  },
  modalSheet: { borderRadius: CARD_RADIUS, overflow: 'hidden' },

  // --- HERO (скругление + внутренний отступ) ---
  heroWrap: {
    width: '100%',
    backgroundColor: '#0E1231',
    justifyContent: 'center',
  },
  heroClip: {
    flex: 1,
    borderRadius: HERO_RADIUS,
    overflow: 'hidden',                    // <- ключ к обрезке краёв
    backgroundColor: '#0B0F28',            // на случай "полос" при contain
  },
  heroImg: {
    width: '100%',
    height: '100%',
    // дублируем углы для Android-драйверов, которые игнорируют общий borderRadius
    borderTopLeftRadius: HERO_RADIUS,
    borderTopRightRadius: HERO_RADIUS,
    borderBottomLeftRadius: HERO_RADIUS,
    borderBottomRightRadius: HERO_RADIUS,
    // лёгкий хак против «белых пикселей» по краю на некоторых GPU
    transform: [{ scale: 1.001 }],
  },

  modalTitle: { color: PALETTE.text, fontWeight: '800', fontSize: 20, marginTop: 12, paddingHorizontal: 16 },
  modalSub:   { color: PALETTE.faint, marginTop: 4, paddingHorizontal: 16 },

  // Location block
  locationBox: {
    marginTop: 12,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  sectionTitle: { color: PALETTE.text, fontWeight: '800', marginBottom: 8 },
  locTagsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  locTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(80,255,227,0.35)',
    backgroundColor: 'rgba(80,255,227,0.12)',
    marginRight: 8,
    marginBottom: 8,
  },
  locTagText: { color: PALETTE.accent, fontWeight: '700', fontSize: 12 },
  locHint: { color: PALETTE.faint, marginTop: 6 },

  modalMetaRow: {
    marginTop: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaCol: { width: '48%' },

  infoLabel: { color: PALETTE.faint, fontSize: 12 },
  infoValue: { color: PALETTE.text, fontWeight: '700', marginTop: 2 },

  modalFeatures: { color: PALETTE.text, marginTop: 10, paddingHorizontal: 16 },
});
