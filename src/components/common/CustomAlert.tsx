// ============================================
// CUSTOM ALERT - SweetAlert Style for React Native
// ============================================

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../theme';

const { width } = Dimensions.get('window');

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'question';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  type?: AlertType;
  title?: string;
  message?: string;
  buttons?: AlertButton[];
  onClose: () => void;
  icon?: string;
  autoClose?: number; // Auto close after X milliseconds
}

const ALERT_CONFIG = {
  success: {
    icon: '✅',
    color: '#10B981',
    bgColor: '#D1FAE5',
    defaultTitle: 'สำเร็จ!',
  },
  error: {
    icon: '❌',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    defaultTitle: 'เกิดข้อผิดพลาด',
  },
  warning: {
    icon: '⚠️',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    defaultTitle: 'คำเตือน',
  },
  info: {
    icon: 'ℹ️',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    defaultTitle: 'แจ้งเตือน',
  },
  question: {
    icon: '❓',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    defaultTitle: 'ยืนยัน',
  },
};

export default function CustomAlert({
  visible,
  type = 'info',
  title,
  message,
  buttons = [{ text: 'ตกลง' }],
  onClose,
  icon,
  autoClose,
}: CustomAlertProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const config = ALERT_CONFIG[type];
  const displayIcon = icon || config.icon;
  const displayTitle = title || config.defaultTitle;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto close if specified
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoClose);
        return () => clearTimeout(timer);
      }
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      callback?.();
    });
  };

  const getButtonStyle = (style?: string, index?: number, total?: number) => {
    const isLast = index === (total ?? 1) - 1;
    
    if (style === 'cancel') {
      return {
        backgroundColor: '#F3F4F6',
        textColor: COLORS.textSecondary,
      };
    }
    if (style === 'destructive') {
      return {
        backgroundColor: '#FEE2E2',
        textColor: '#EF4444',
      };
    }
    // Default - use type color for last/primary button
    if (isLast || total === 1) {
      return {
        backgroundColor: config.color,
        textColor: '#FFFFFF',
      };
    }
    return {
      backgroundColor: '#F3F4F6',
      textColor: COLORS.text,
    };
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => handleClose()}
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View 
          style={[
            styles.container,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          {/* Icon Circle */}
          <View style={[styles.iconCircle, { backgroundColor: config.bgColor }]}>
            <Text style={styles.icon}>{displayIcon}</Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: config.color }]}>
            {displayTitle}
          </Text>

          {/* Message */}
          {message && (
            <Text style={styles.message}>{message}</Text>
          )}

          {/* Buttons */}
          <View style={[
            styles.buttonContainer,
            buttons.length > 2 && styles.buttonContainerVertical
          ]}>
            {buttons.map((button, index) => {
              const btnStyle = getButtonStyle(button.style, index, buttons.length);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    buttons.length <= 2 && styles.buttonHorizontal,
                    buttons.length > 2 && styles.buttonVertical,
                    { backgroundColor: btnStyle.backgroundColor }
                  ]}
                  onPress={() => handleClose(button.onPress)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.buttonText, { color: btnStyle.textColor }]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ============================================
// HOOK FOR EASY USAGE
// ============================================

export interface AlertState {
  visible: boolean;
  type: AlertType;
  title?: string;
  message?: string;
  buttons: AlertButton[];
  icon?: string;
  autoClose?: number;
}

export const initialAlertState: AlertState = {
  visible: false,
  type: 'info',
  title: '',
  message: '',
  buttons: [{ text: 'ตกลง' }],
};

// Helper function to create alert configs
export const createAlert = {
  success: (title: string, message?: string, buttons?: AlertButton[]): AlertState => ({
    visible: true,
    type: 'success',
    title,
    message,
    buttons: buttons || [{ text: 'ตกลง' }],
  }),
  
  error: (title: string, message?: string, buttons?: AlertButton[]): AlertState => ({
    visible: true,
    type: 'error',
    title,
    message,
    buttons: buttons || [{ text: 'ตกลง' }],
  }),
  
  warning: (title: string, message?: string, buttons?: AlertButton[]): AlertState => ({
    visible: true,
    type: 'warning',
    title,
    message,
    buttons: buttons || [{ text: 'ตกลง' }],
  }),
  
  info: (title: string, message?: string, buttons?: AlertButton[]): AlertState => ({
    visible: true,
    type: 'info',
    title,
    message,
    buttons: buttons || [{ text: 'ตกลง' }],
  }),
  
  confirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void): AlertState => ({
    visible: true,
    type: 'question',
    title,
    message,
    buttons: [
      { text: 'ยกเลิก', style: 'cancel', onPress: onCancel },
      { text: 'ยืนยัน', onPress: onConfirm },
    ],
  }),
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    width: width * 0.85,
    maxWidth: 340,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  iconCircle: {
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
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  message: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
  },
  buttonContainerVertical: {
    flexDirection: 'column',
  },
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonHorizontal: {
    flex: 1,
  },
  buttonVertical: {
    width: '100%',
  },
  buttonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
