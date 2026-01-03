// ============================================
// CALENDAR PICKER COMPONENT
// ============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../theme';

interface CalendarPickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label?: string;
  error?: string;
  minDate?: Date;
  maxDate?: Date;
}

const THAI_DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];
const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.',
  'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.',
  'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export default function CalendarPicker({
  value,
  onChange,
  label,
  error,
  minDate = new Date(),
  maxDate,
}: CalendarPickerProps) {
  const [showModal, setShowModal] = useState(false);
  const [showNativePicker, setShowNativePicker] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(value));

  const formatDisplayDate = (date: Date): string => {
    const day = date.getDate();
    const month = THAI_MONTHS_SHORT[date.getMonth()];
    const year = date.getFullYear() + 543;
    const dayName = THAI_DAYS[date.getDay()];
    return `${dayName}. ${day} ${month} ${year}`;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isTomorrow = (date: Date): boolean => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  };

  const isSelected = (date: Date): boolean => {
    return date.toDateString() === value.toDateString();
  };

  const isDisabled = (date: Date): boolean => {
    if (minDate && date < new Date(minDate.setHours(0, 0, 0, 0))) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const generateCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: (Date | null)[] = [];
    
    // Add empty slots for days before first day
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    // Add days of month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const goToPrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateSelect = (date: Date) => {
    if (!isDisabled(date)) {
      onChange(date);
      setShowModal(false);
    }
  };

  const handleQuickSelect = (daysFromNow: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    onChange(date);
    setShowModal(false);
  };

  // For iOS/Android native picker
  const handleNativeChange = (event: any, selectedDate?: Date) => {
    setShowNativePicker(false);
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const renderCalendar = () => (
    <Modal
      visible={showModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowModal(false)}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={() => setShowModal(false)}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          style={styles.modalContent}
          onPress={() => {}}
        >
          {/* Quick Select */}
          <View style={styles.quickSelectRow}>
            <TouchableOpacity
              style={[styles.quickButton, isToday(value) && styles.quickButtonActive]}
              onPress={() => handleQuickSelect(0)}
            >
              <Text style={[styles.quickButtonText, isToday(value) && styles.quickButtonTextActive]}>
                วันนี้
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickButton, isTomorrow(value) && styles.quickButtonActive]}
              onPress={() => handleQuickSelect(1)}
            >
              <Text style={[styles.quickButtonText, isTomorrow(value) && styles.quickButtonTextActive]}>
                พรุ่งนี้
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => handleQuickSelect(7)}
            >
              <Text style={styles.quickButtonText}>+7 วัน</Text>
            </TouchableOpacity>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
              <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {THAI_MONTHS[viewDate.getMonth()]} {viewDate.getFullYear() + 543}
            </Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
              <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Day Headers */}
          <View style={styles.dayHeaders}>
            {THAI_DAYS.map((day, index) => (
              <Text 
                key={day} 
                style={[
                  styles.dayHeader,
                  index === 0 && styles.sundayText,
                  index === 6 && styles.saturdayText,
                ]}
              >
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {generateCalendarDays().map((date, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  date && isSelected(date) && styles.dayCellSelected,
                  date && isToday(date) && !isSelected(date) && styles.dayCellToday,
                  date && isDisabled(date) && styles.dayCellDisabled,
                ]}
                onPress={() => date && handleDateSelect(date)}
                disabled={!date || isDisabled(date)}
              >
                {date && (
                  <Text
                    style={[
                      styles.dayText,
                      isSelected(date) && styles.dayTextSelected,
                      isToday(date) && !isSelected(date) && styles.dayTextToday,
                      isDisabled(date) && styles.dayTextDisabled,
                      date.getDay() === 0 && styles.sundayText,
                      date.getDay() === 6 && styles.saturdayText,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Selected Date Display */}
          <View style={styles.selectedDisplay}>
            <Text style={styles.selectedLabel}>วันที่เลือก:</Text>
            <Text style={styles.selectedDate}>{formatDisplayDate(value)}</Text>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowModal(false)}
          >
            <Text style={styles.closeButtonText}>ตกลง</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[styles.inputButton, error && styles.inputButtonError]}
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
        <Text style={styles.inputText}>{formatDisplayDate(value)}</Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {renderCalendar()}

      {/* Native picker for Android */}
      {showNativePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          onChange={handleNativeChange}
          minimumDate={minDate}
          maximumDate={maxDate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  inputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  inputButtonError: {
    borderColor: COLORS.error,
  },
  inputText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  errorText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 360,
  },
  quickSelectRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  quickButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  quickButtonActive: {
    backgroundColor: COLORS.primary,
  },
  quickButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  quickButtonTextActive: {
    color: '#FFF',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  navButton: {
    padding: SPACING.xs,
  },
  monthTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
    paddingVertical: SPACING.xs,
  },
  sundayText: {
    color: '#EF4444',
  },
  saturdayText: {
    color: '#3B82F6',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.full,
  },
  dayCellSelected: {
    backgroundColor: COLORS.primary,
  },
  dayCellToday: {
    backgroundColor: COLORS.primaryLight,
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  dayTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  dayTextToday: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  dayTextDisabled: {
    color: COLORS.textMuted,
  },
  selectedDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  selectedLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  selectedDate: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  closeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  closeButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#FFF',
  },
});
