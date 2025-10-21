// App.js
import 'react-native-gesture-handler'; // ← обязательно первой строкой
import React, { useEffect, useState } from 'react';
import { StyleSheet, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

/* ── Splash / Onboarding ── */
import Loader from './Components/Loader';
import Onboarding from './Components/Onboarding';

/* ── VelvetFlash (дом/посадка/игры/QR/персонал) ── */
import LoungeScreen   from './Components/LoungeScreen';
import SeatingGuide   from './Components/SeatingGuide';
import GamesScreen    from './Components/GamesScreen';
import GameDetails    from './Components/GameDetails';
import QRScreen       from './Components/QRScreen';
import StaffScreen    from './Components/StaffScreen';

/* ── Game (полноценная) ── */
import SlotsCatalog   from './Components/SlotsCatalog';

/* ── Кастомный таббар ── */
import CustomTabBar from './Components/CustomTabBar';
// import { AppProvider } from './Components/AppContext'; // опционально

/* ── VelvetFlash навигационная тема ── */
const VelvetFlashTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0C0F2A',
    card: '#101432',
    text: '#E8ECF1',
    border: '#1B2040',
    primary: '#FFD166',
    notification: '#FFB23C',
  },
};
const PALETTE = {
  bg: '#0C0F2A',
  card: '#101432',
  border: '#1B2040',
  gold: '#FFD166',
  gold2: '#FFB23C',
  text: '#E8ECF1',
  dim: '#8A96B2',
  aqua: '#50FFE3',
  pink: '#FF4D8C',
};

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/* ── Lounge stack (дом) ── */
const LoungeStack = createNativeStackNavigator();
function LoungeFlow() {
  return (
    <LoungeStack.Navigator screenOptions={{ headerShown: false }}>
      <LoungeStack.Screen name="LoungeScreen" component={LoungeScreen} />
    </LoungeStack.Navigator>
  );
}

/* ── Seats stack (гайд/посадка) ── */
const SeatsStack = createNativeStackNavigator();
function SeatsFlow() {
  return (
    <SeatsStack.Navigator screenOptions={{ headerShown: false }}>
      <SeatsStack.Screen name="SeatingGuide" component={SeatingGuide} />
    </SeatsStack.Navigator>
  );
}

/* ── Games stack ── */
const GamesStack = createNativeStackNavigator();
function GamesFlow() {
  return (
    <GamesStack.Navigator screenOptions={{ headerShown: false }}>
      <GamesStack.Screen name="GamesScreen" component={GamesScreen} />
      <GamesStack.Screen name="GameDetails" component={GameDetails} />
      <GamesStack.Screen name="SlotsCatalog" component={SlotsCatalog} />
    </GamesStack.Navigator>
  );
}

/* ── QR stack (простой) ── */
const QRStack = createNativeStackNavigator();
function QRFlow() {
  return (
    <QRStack.Navigator screenOptions={{ headerShown: false }}>
      <QRStack.Screen name="QRScreen" component={QRScreen} />
    </QRStack.Navigator>
  );
}

/* ── Staff stack (простой) ── */
const StaffStack = createNativeStackNavigator();
function StaffFlow() {
  return (
    <StaffStack.Navigator screenOptions={{ headerShown: false }}>
      <StaffStack.Screen name="StaffScreen" component={StaffScreen} />
    </StaffStack.Navigator>
  );
}

/* ── Bottom Tabs ── */
function BottomTabs() {
  return (
    // <AppProvider>
    <Tab.Navigator
      initialRouteName="Lounge"
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <CustomTabBar
          {...props}
          colors={{
            bg: PALETTE.bg,
            card: '#0F1432',
            primary: PALETTE.gold,
            success: PALETTE.aqua,
            danger: PALETTE.pink,
            text: PALETTE.text,
            dim: PALETTE.dim,
            border: PALETTE.border,
          }}
        />
      )}
    >
      <Tab.Screen name="Lounge" component={LoungeFlow} options={{ title: 'Lounge' }} />
      <Tab.Screen name="Seats"  component={SeatsFlow}  options={{ title: 'Seats' }} />
      <Tab.Screen name="Games"  component={GamesFlow}  options={{ title: 'Games' }} />
      <Tab.Screen name="QR"     component={QRFlow}     options={{ title: 'QR' }} />
      <Tab.Screen name="Staff"  component={StaffFlow}  options={{ title: 'Staff' }} />
    </Tab.Navigator>
    // </AppProvider>
  );
}

export default function App() {
  const [bootDone, setBootDone] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setIsLoading(false);
      setBootDone(true);
    }, 10000);
    return () => clearTimeout(t);
  }, []);

  const handleOnboardingComplete = () => setShowOnboarding(false);

  if (!bootDone || isLoading) return <Loader />;

  return (
    <GestureHandlerRootView style={styles.flex}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.bg} />
      <NavigationContainer theme={VelvetFlashTheme}>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {showOnboarding ? (
            <RootStack.Screen name="Onboarding">
              {(props) => (
                <Onboarding
                  {...props}
                  onComplete={handleOnboardingComplete}
                  palette={PALETTE}
                />
              )}
            </RootStack.Screen>
          ) : (
            <>
              <RootStack.Screen name="Main" component={BottomTabs} />
              {/* можно добавить модальные экраны при необходимости */}
            </>
          )}
        </RootStack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
