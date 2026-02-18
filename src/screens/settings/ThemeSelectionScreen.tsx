import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/context/ThemeContext'; // Adjusted path
import { ThemePicker, BackButton } from '../../components/common';
import { SPACING, FONT_SIZES } from '../../theme';

const ThemeSelectionScreen: React.FC = () => {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <BackButton />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={[styles.header, { color: colors.text }]}>เลือกธีมและโทนสี</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            ลองเปลี่ยนสีหลักของแอพ เพื่อดูว่าโทนสีไหนที่คุณชอบที่สุด
          </Text>
          <ThemePicker />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: SPACING.lg,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  header: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONT_SIZES.lg,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
});

export default ThemeSelectionScreen;
