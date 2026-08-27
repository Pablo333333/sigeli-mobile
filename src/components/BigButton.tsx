import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Theme } from '../theme';

type Variant = 'primary' | 'secondary' | 'outline';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  large?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
};

/** Botón accesible para uso en campo (altura ≥ 56 / 64). */
export function BigButton({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  large,
  style,
  textStyle,
  icon,
}: Props) {
  const base =
    variant === 'secondary'
      ? Theme.button.secondary
      : variant === 'outline'
        ? Theme.button.outline
        : Theme.button.primary;

  const textColor =
    variant === 'outline' ? Theme.colors.primary : Theme.colors.textOnPrimary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        base,
        large && { minHeight: Theme.touch.large },
        (disabled || loading) && Theme.button.disabled,
        styles.row,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  text: {
    ...Theme.typography.button,
  },
});
