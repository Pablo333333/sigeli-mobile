import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme';
import { USE_CUSTOM_LOGO } from '../theme/brand';

type Props = {
  size?: number;
  variant?: 'mark' | 'full';
  light?: boolean;
  style?: ViewStyle;
};

const logoSource = USE_CUSTOM_LOGO
  ? require('../../../assets/brand/logo.png')
  : null;

/**
 * Logo oficial Talento (puerta).
 * Si USE_CUSTOM_LOGO=false, muestra escudo provisional.
 */
export function BrandLogo({ size = 72, variant = 'mark', light = false, style }: Props) {
  const fg = light ? Theme.colors.textOnPrimary : Theme.colors.primary;

  if (USE_CUSTOM_LOGO && logoSource) {
    return (
      <View style={[styles.wrap, style]}>
        <View
          style={[
            styles.logoPlate,
            {
              width: size,
              height: size,
              borderRadius: size * 0.18,
            },
          ]}
        >
          <Image
            source={logoSource}
            style={{ width: size * 0.92, height: size * 0.92 }}
            resizeMode="contain"
          />
        </View>
        {variant === 'full' && (
          <>
            <Text style={[styles.name, { color: fg }]}>{Theme.brand.appName}</Text>
            <Text
              style={[
                styles.org,
                { color: light ? 'rgba(255,255,255,0.8)' : Theme.colors.textSecondary },
              ]}
            >
              {Theme.brand.organizerName}
            </Text>
          </>
        )}
      </View>
    );
  }

  const bg = light ? 'rgba(255,255,255,0.14)' : Theme.colors.accentSoft;
  return (
    <View style={[styles.wrap, style]}>
      <View
        style={[
          styles.mark,
          {
            width: size,
            height: size,
            borderRadius: size * 0.22,
            backgroundColor: bg,
          },
        ]}
      >
        <Ionicons name="shield-checkmark" size={size * 0.48} color={fg} />
      </View>
      {variant === 'full' && (
        <>
          <Text style={[styles.name, { color: fg }]}>{Theme.brand.appName}</Text>
          <Text
            style={[
              styles.org,
              { color: light ? 'rgba(255,255,255,0.75)' : Theme.colors.textSecondary },
            ]}
          >
            {Theme.brand.organizerName}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  logoPlate: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mark: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    marginTop: 10,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  org: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
  },
});
