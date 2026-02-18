import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useTheme } from '../../../src/context/ThemeContext'; // Adjusted path
import { PALETTES } from '../../../src/theme/palettes'; // Adjusted path
import { SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZES } from '../../../src/theme';

interface ThemePickerProps {
  onClose?: () => void;
}

const ThemePicker: React.FC<ThemePickerProps> = ({ onClose }) => {
  const { setPalette, paletteId, colors } = useTheme();

  const renderPaletteItem = ({ item }: { item: typeof PALETTES[0] }) => (
    <TouchableOpacity
      style={[
        styles.paletteItem,
        { borderColor: item.primary },
        paletteId === item.id && styles.selectedPalette,
      ]}
      onPress={() => {
        setPalette(item.id);
        onClose?.();
      }}
    >
      <View style={[styles.colorBox, { backgroundColor: item.primary }]} />
      <View style={[styles.colorBox, { backgroundColor: item.secondary }]} />
      <View style={[styles.colorBox, { backgroundColor: item.accent }]} />
      <Text style={[styles.paletteName, { color: colors.text }]}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>เลือกโทนสีแอพ</Text>
      <FlatList
        data={PALETTES}
        keyExtractor={(item) => item.id}
        renderItem={renderPaletteItem}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  title: {
    fontSize: SPACING.xl,
    fontWeight: 'bold',
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  listContainer: {
    justifyContent: 'center',
  },
  paletteItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: SPACING.sm,
    margin: SPACING.sm,
    borderWidth: 2,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#FFFFFF',
    ...SHADOWS.sm,
  },
  selectedPalette: {
    borderWidth: 3,
  },
  colorBox: {
    width: 20,
    height: 20,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.sm,
  },
  paletteName: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'semibold',
    flexShrink: 1, // Allow text to wrap if long
  },
});

export default ThemePicker;
