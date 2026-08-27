/**
 * BRANDING Talento — fuente única de verdad.
 * Logo oficial: assets/brand/logo.png (puerta azul + marco naranja).
 *
 * Colores muestreados del logo:
 * - Azul puerta: #1A94DD
 * - Naranja marco: #F99011
 *
 * Ver docs/BRANDING.md
 */

/** Logo oficial instalado en assets/brand/logo.png */
export const USE_CUSTOM_LOGO = true;

export const BrandMeta = {
  appName: 'Talento',
  tagline: 'Sistema de gestión de empleo local inteligente',
  organizerName: 'Organizador / Comunidad',
  logoAssetHint: 'assets/brand/logo.png',
};

export const BrandColors = {
  primary: '#1A94DD',
  primaryDark: '#0E6FA8',
  primaryLight: '#3BA8E5',
  accent: '#F99011',
  accentSoft: '#FFF1DE',
  success: '#1B7A4E',
  warning: '#F99011',
  danger: '#B91C1C',
  background: '#F3F8FC',
  surface: '#FFFFFF',
  text: '#0F1C24',
  textSecondary: '#4A6270',
  textOnPrimary: '#FFFFFF',
  border: '#C9D9E4',
  muted: '#E4EEF5',
};

/** UX rural: áreas táctiles generosas (≥ 56px) */
export const TouchTargets = {
  min: 56,
  large: 64,
  input: 56,
  iconHit: 48,
  tabBarIcon: 28,
};
