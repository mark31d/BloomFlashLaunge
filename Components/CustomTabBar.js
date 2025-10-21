// Components/CustomTabBar.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Custom bottom tab bar for RunFitSportHub.
 * Props (из App.js):
 *  - colors: { bg, card, primary, success, danger, text, dim, border }
 *  - ...остальные пропсы обычного BottomTabBar (state, descriptors, navigation)
 */
export default function CustomTabBar({ state, descriptors, navigation, colors }) {
  const insets = useSafeAreaInsets();

  // --- badges / dots from AsyncStorage ---
  const [hasBooking, setHasBooking] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);

  const readBadges = useCallback(async () => {
    try {
      const booking = await AsyncStorage.getItem('VF_last_booking');
      setHasBooking(Boolean(booking));

      const qRaw = await AsyncStorage.getItem('VF_queue_games');
      const q = qRaw ? JSON.parse(qRaw) : [];
      setQueueCount(Array.isArray(q) ? q.length : 0);

      const tRaw = await AsyncStorage.getItem('VF_help_requests');
      const t = tRaw ? JSON.parse(tRaw) : [];
      const open = Array.isArray(t) ? t.filter((x) => x?.status === 'Open').length : 0;
      setOpenTickets(open);
    } catch {
      // fail-silent
    }
  }, []);

  useEffect(() => {
    readBadges();
    // Обновляем при любых навигационных изменениях (меняется состояние табов/стеков)
    const unsub = navigation.addListener('state', readBadges);
    return () => unsub && unsub();
  }, [navigation, readBadges]);

  const iconMap = useMemo(
    () => ({
      Lounge: require('../assets/tab_home.png'),
      Seats: require('../assets/tab_seat.png'),
      Games: require('../assets/tab_games.png'),
      QR: require('../assets/tab_qr.png'),
      Staff: require('../assets/tab_staff.png'),
    }),
    []
  );

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: 'rgba(0,0,0,0.35)',
          borderColor: colors?.border || 'rgba(255,255,255,0.18)',
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const iconSrc = iconMap[route.name];
          const tint = isFocused ? (colors?.primary || '#FFD166') : '#FFFFFF';
          const textColor = isFocused ? (colors?.primary || '#FFD166') : (colors?.text || '#E8ECF1');

          // badges logic
          let badge = null;
          if (route.name === 'QR' && hasBooking) {
            badge = <Dot color={colors?.primary || '#FFD166'} />;
          } else if (route.name === 'Games' && queueCount > 0) {
            badge = <Counter value={queueCount} color={colors?.success || '#FFD166'} />;
          } else if (route.name === 'Staff' && openTickets > 0) {
            badge = <Counter value={openTickets} color={colors?.danger || '#FF4D8C'} />;
          }

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              android_ripple={{ color: 'rgba(255,255,255,0.12)', borderless: true }}
              style={styles.item}
            >
              <View style={styles.iconWrap}>
                {iconSrc ? (
                  <Image
                    source={iconSrc}
                    style={[
                      styles.icon,
                      { tintColor: tint, opacity: isFocused ? 1 : 0.9 },
                    ]}
                    tintColor={tint}
                    resizeMode="contain"
                  />
                ) : null}
                {badge}
              </View>
              <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
                {label}
              </Text>
              {/* активная подсветка-полоска */}
              <View
                style={[
                  styles.activeBar,
                  { backgroundColor: isFocused ? (colors?.primary || '#FFD166') : 'transparent' },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* --- маленькие UI элементы --- */
function Dot({ color }) {
  return <View style={[styles.dot, { backgroundColor: color }]} />;
}
function Counter({ value, color }) {
  const text = value > 99 ? '99+' : String(value);
  return (
    <View style={[styles.counter, { backgroundColor: color }]}>
      <Text style={styles.counterText}>{text}</Text>
    </View>
  );
}

/* --- стили --- */
const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
    borderWidth: 1,
    borderRadius: 22,
    paddingTop: 6,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  iconWrap: {
    width: 28,
    height: 28,
    marginTop: 2,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: 24, height: 24 },
  label: { fontSize: 11, fontWeight: '700' },

  activeBar: {
    marginTop: 6,
    width: 20,
    height: 3,
    borderRadius: 2,
    opacity: Platform.select({ ios: 0.9, android: 0.95 }),
  },

  // badges
  dot: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  counter: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: { color: '#0C0F2A', fontSize: 10, fontWeight: '800' },
});
