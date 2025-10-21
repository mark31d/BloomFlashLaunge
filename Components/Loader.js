// Components/Loader.js
import React, { useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, Image } from 'react-native';
import { WebView } from 'react-native-webview';

const ASSETS = {
  icon: require('../assets/app_icon.png'),
  thumb: require('../assets/logo_text.png'),
};

/**
 * Loader с двумя картинками и 3D-кубом без клиппинга.
 * props:
 *  - primary   : цвет контура граней
 *  - background: фон
 *  - side      : размер ребра куба в px (по умолчанию 96)
 */
export default function Loader({
  primary = '#FFD166',
  background = '#0C0F2A',
  side = 96,
}) {
  // Размер контейнера WebView делаем с запасом (~2.5 * side), чтобы поворот под 45° не обрезался.
  const webBox = Math.round(side * 2.5);

  const html = useMemo(
    () => `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
  :root{
    --side:${side}px;
    --half:${side / 2}px;
    --border:${primary};
    --fill: rgba(255,209,102,0.28);
  }
  *{box-sizing:border-box}
  html,body{margin:0;height:100%;background:transparent;overflow:visible}
  .wrap{
    display:flex;align-items:center;justify-content:center;
    width:100%;height:100%;
    -webkit-perspective:1000px;perspective:1000px;
  }
  /* куб без scale(), только повороты → предсказуемый бокс */
  .spinner{
    width:var(--side); height:var(--side);
    animation:rot 2s infinite ease; -webkit-animation:rot 2s infinite ease;
    transform-style:preserve-3d; -webkit-transform-style:preserve-3d;
    will-change: transform;
    overflow:visible;
  }
  .spinner>div{
    position:absolute; width:100%; height:100%;
    border:2px solid var(--border);
    background: var(--fill);
    backface-visibility:hidden; -webkit-backface-visibility:hidden;
  }
  .spinner div:nth-of-type(1){transform: translateZ(calc(var(--half) * -1)) rotateY(180deg);}
  .spinner div:nth-of-type(2){transform: rotateY(-270deg) translateX(50%); transform-origin: top right;}
  .spinner div:nth-of-type(3){transform: rotateY(270deg) translateX(-50%); transform-origin: center left;}
  .spinner div:nth-of-type(4){transform: rotateX(90deg) translateY(-50%); transform-origin: top center;}
  .spinner div:nth-of-type(5){transform: rotateX(-90deg) translateY(50%); transform-origin: bottom center;}
  .spinner div:nth-of-type(6){transform: translateZ(var(--half));}

  @keyframes rot{
    0%{   transform: rotate(45deg) rotateX(-25deg) rotateY(25deg); }
    50%{  transform: rotate(45deg) rotateX(-385deg) rotateY(25deg); }
    100%{ transform: rotate(45deg) rotateX(-385deg) rotateY(385deg); }
  }
  @-webkit-keyframes rot{
    0%{   -webkit-transform: rotate(45deg) rotateX(-25deg) rotateY(25deg); }
    50%{  -webkit-transform: rotate(45deg) rotateX(-385deg) rotateY(25deg); }
    100%{ -webkit-transform: rotate(45deg) rotateX(-385deg) rotateY(385deg); }
  }
</style></head>
<body>
  <div class="wrap">
    <div class="spinner">
      <div></div><div></div><div></div>
      <div></div><div></div><div></div>
    </div>
  </div>
</body></html>`,
    [primary, side]
  );

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      {/* 1) App icon */}
      <Image source={ASSETS.icon} style={styles.icon} resizeMode="contain" />
      {/* 2) Game thumb */}
      <Image source={ASSETS.thumb} style={styles.thumb} resizeMode="cover" />
      {/* 3) Куб — WebView больше видимой области куба → не обрезается */}
      <View style={[styles.spinnerBox, { width: webBox, height: webBox }]}>
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          style={{ width: webBox, height: webBox, backgroundColor: 'transparent' }}
          containerStyle={{ backgroundColor: 'transparent' }}
          scrollEnabled={false}
          bounces={false}
          javaScriptEnabled
          domStorageEnabled
          opaque={false}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.fallback}>
              <ActivityIndicator size={Platform.OS === 'ios' ? 'large' : 48} color={primary} />
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  icon: { width: 132, height: 132, marginBottom: 16 },
  thumb: {
    width: '100%', height: 180,
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 18,
  },
  spinnerBox: { alignItems: 'center', justifyContent: 'center', marginTop: 30, marginBottom: 40 },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
