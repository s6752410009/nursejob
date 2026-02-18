// ============================================
// CONFIRM MODAL - Beautiful Alert Replacement
// ============================================

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../theme';

interface ConfirmModalProps {
  visible: boolean;
  title?: string;
  message: string;
  icon?: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'success' | 'warning' | 'info';
}

export default function ConfirmModal({
  visible,
  title,
  message,
  icon,
  confirmText = 'ตกลง',
  cancelText = 'ยกเลิก',
  confirmColor,
  onConfirm,
  onCancel,
  type = 'danger',
}: ConfirmModalProps) {
  
  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: icon || '🚪',
          color: COLORS.danger,
          bgColor: '#FEE2E2',
        };
      case 'success':
        return {
          icon: icon || '✅',
          color: COLORS.success,
          bgColor: '#D1FAE5',
        };
      case 'warning':
        return {
          icon: icon || '⚠️',
          color: '#F59E0B',
          bgColor: '#FEF3C7',
        };
      case 'info':
      default:
        return {
          icon: icon || 'ℹ️',
          color: COLORS.primary,
          bgColor: '#DBEAFE',
        };
    }
  };

  const typeStyles = getTypeStyles();

  useEffect(() => {
    if (visible && typeof document !== 'undefined') {
      try {
        const active = document.activeElement as HTMLElement | null;
        if (active && active !== document.body) active.blur();
      } catch (e) {
        // ignore
      }
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay} accessibilityViewIsModal={true}>
        <View style={styles.container}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: typeStyles.bgColor }]}>
            <Text style={styles.icon}>{typeStyles.icon}</Text>
          </View>

          {/* Title */}
          {title && <Text style={styles.title}>{title}</Text>}

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: confirmColor || typeStyles.color },
              ]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ============================================
// SUCCESS MODAL - For success messages
// ============================================
interface SuccessModalProps {
  visible: boolean;
  title?: string;
  message: string;
  icon?: string;
  buttonText?: string;
  onClose: () => void;
}

export function SuccessModal({
  visible,
  title = 'สำเร็จ!',
  message,
  icon = '🎉',
  buttonText = 'ตกลง',
  onClose,
}: SuccessModalProps) {
  useEffect(() => {
    if (visible && typeof document !== 'undefined') {
      try {
        const active = document.activeElement as HTMLElement | null;
        if (active && active !== document.body) active.blur();
      } catch (e) {}
    }
  }, [visible]);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay} accessibilityViewIsModal={true}>
        <View style={styles.container}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: '#D1FAE5' }]}>
            {icon === '✅' ? (
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFF', fontSize: 24, fontWeight: 'bold' }}>✓</Text>
              </View>
            ) : (
              <Text style={styles.icon}>{icon}</Text>
            )}
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: COLORS.success }]}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Button */}
          <TouchableOpacity
            style={[styles.button, styles.successButton]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.successButtonText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ============================================
// ERROR MODAL - For error messages
// ============================================
interface ErrorModalProps {
  visible: boolean;
  title?: string;
  message: string;
  icon?: string;
  buttonText?: string;
  onClose: () => void;
}

export function ErrorModal({
  visible,
  title = 'เกิดข้อผิดพลาด',
  message,
  icon = '❌',
  buttonText = 'ตกลง',
  onClose,
}: ErrorModalProps) {
  useEffect(() => {
    if (visible && typeof document !== 'undefined') {
      try {
        const active = document.activeElement as HTMLElement | null;
        if (active && active !== document.body) active.blur();
      } catch (e) {}
    }
  }, [visible]);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay} accessibilityViewIsModal={true}>
        <View style={styles.container}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
            <Text style={styles.icon}>{icon}</Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: COLORS.danger }]}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Button */}
          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmButtonText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...SHADOWS.large,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  confirmButton: {
    backgroundColor: COLORS.danger,
  },
  confirmButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  successButton: {
    backgroundColor: COLORS.success,
  },
  successButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dangerButton: {
    backgroundColor: COLORS.danger,
  },
});
