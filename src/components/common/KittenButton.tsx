import React from 'react';
import { StyleProp, ViewStyle, ActivityIndicator } from 'react-native';
import { Button as KittenBtn, ButtonProps as KittenBtnProps } from '@ui-kitten/components';
import { COLORS } from '../../theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface Props extends Omit<KittenBtnProps, 'status' | 'appearance'> {
  children?: React.ReactNode;
  title?: string;
  onPress?: () => void;
  variant?: Variant;
  size?: 'small' | 'medium' | 'large';
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
}

const appearanceFor = (variant: Variant) => {
  switch (variant) {
    case 'outline':
      return 'outline' as const;
    case 'ghost':
      return 'ghost' as const;
    default:
      return 'filled' as const;
  }
};

const statusFor = (variant: Variant) => {
  switch (variant) {
    case 'secondary':
      return 'basic' as const;
    case 'danger':
      return 'danger' as const;
    default:
      return 'primary' as const;
  }
};

export default function KittenButton({ children, title, variant = 'primary', size = 'medium', style, loading = false, ...rest }: Props) {
  const appearance = appearanceFor(variant);
  const status = statusFor(variant);

  const sizeMap: Record<typeof size, KittenBtnProps['size']> = {
    small: 'small',
    medium: 'medium',
    large: 'large',
  };

  return (
    <KittenBtn
      appearance={appearance}
      status={status}
      size={sizeMap[size]}
      style={style}
      disabled={Boolean(rest.disabled) || loading}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={status === 'primary' ? COLORS.white : COLORS.primary} />
      ) : (
        children ?? title
      )}
    </KittenBtn>
  );
}
