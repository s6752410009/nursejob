import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../../theme';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Image source={require('../../../assets/splash.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>NurseGo</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    alignItems: 'center',
  },
  logo: {
    width: 220,
    height: 220,
    marginBottom: SPACING.md,
  },
  title: {
    color: '#fff',
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
  },
});
