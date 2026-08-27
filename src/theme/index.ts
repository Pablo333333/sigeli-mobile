import { BrandColors, BrandMeta, TouchTargets } from './brand';

export const Theme = {
  brand: BrandMeta,
  colors: {
    primary: BrandColors.primary,
    primaryDark: BrandColors.primaryDark,
    primaryLight: BrandColors.primaryLight,
    secondary: BrandColors.accent,
    accent: BrandColors.accent,
    accentSoft: BrandColors.accentSoft,
    success: BrandColors.success,
    warning: BrandColors.warning,
    danger: BrandColors.danger,
    background: BrandColors.background,
    surface: BrandColors.surface,
    text: BrandColors.text,
    textSecondary: BrandColors.textSecondary,
    textOnPrimary: BrandColors.textOnPrimary,
    border: BrandColors.border,
    muted: BrandColors.muted,
  },
  touch: TouchTargets,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 20,
    full: 9999,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
    },
    h2: {
      fontSize: 24,
      fontWeight: '700' as const,
    },
    body: {
      fontSize: 17,
      fontWeight: '400' as const,
    },
    caption: {
      fontSize: 14,
      fontWeight: '500' as const,
    },
    button: {
      fontSize: 18,
      fontWeight: '700' as const,
    },
  },
  /**
   * Estilos base de botón grande (campo / zonas rurales).
   * Uso: style={[Theme.button.primary, disabled && Theme.button.disabled]}
   */
  button: {
    minHeight: TouchTargets.min,
    largeHeight: TouchTargets.large,
    primary: {
      minHeight: TouchTargets.min,
      backgroundColor: BrandColors.primary,
      borderRadius: 14,
      paddingHorizontal: 20,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    secondary: {
      minHeight: TouchTargets.min,
      backgroundColor: BrandColors.accent,
      borderRadius: 14,
      paddingHorizontal: 20,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    outline: {
      minHeight: TouchTargets.min,
      backgroundColor: BrandColors.surface,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: BrandColors.primary,
      paddingHorizontal: 20,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    disabled: {
      opacity: 0.55,
    },
  },
};
