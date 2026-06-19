export const Theme = {
  colors: {
    primary: '#1e40af', // Blue 800
    secondary: '#3b82f6', // Blue 500
    success: '#22c55e', // Green 500
    warning: '#f59e0b', // Amber 500
    danger: '#ef4444', // Red 500
    background: '#f8fafc', // Slate 50
    surface: '#ffffff',
    text: '#0f172a', // Slate 900
    textSecondary: '#64748b', // Slate 500
    border: '#e2e8f0', // Slate 200
  },
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
      fontSize: 16,
      fontWeight: '400' as const,
    },
    caption: {
      fontSize: 14,
      fontWeight: '500' as const,
    },
  }
};
