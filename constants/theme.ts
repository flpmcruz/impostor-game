/**
 * Theme configuration for El Impostor game
 * Fun, playful color palette for party game vibes
 */

import { Platform } from 'react-native';

export const GameColors = {
  // Primary palette - Fun and vibrant
  background: '#FFF8F0',      // Warm cream
  backgroundAlt: '#FEF3E7',   // Slightly darker cream
  card: '#FFFFFF',
  cardHighlight: '#FFF5EB',

  // Accent colors - Playful purple
  accent: '#8B5CF6',          // Fun purple
  accentLight: '#A78BFA',
  accentDark: '#7C3AED',

  // Secondary - Playful teal
  secondary: '#14B8A6',       // Teal
  secondaryLight: '#5EEAD4',

  // Text
  text: '#1E1B4B',            // Dark indigo
  textSecondary: '#4C4669',
  textMuted: '#9CA3AF',
  textLight: '#6B7280',

  // Interactive elements
  input: '#F9FAFB',
  inputBorder: '#E5E7EB',
  inputFocus: '#8B5CF6',

  // Status colors - Bright and fun
  success: '#10B981',         // Emerald
  successLight: '#D1FAE5',
  warning: '#F59E0B',         // Amber
  warningLight: '#FEF3C7',
  danger: '#EF4444',          // Red
  dangerLight: '#FEE2E2',

  // Role colors - Fun and distinct
  impostor: '#F43F5E',        // Rose
  impostorLight: '#FFE4E6',
  impostorGlow: 'rgba(244, 63, 94, 0.15)',
  citizen: '#10B981',         // Emerald
  citizenLight: '#D1FAE5',
  citizenGlow: 'rgba(16, 185, 129, 0.15)',

  // Fun pattern colors
  pattern1: '#FDE68A',        // Yellow
  pattern2: '#FBCFE8',        // Pink
  pattern3: '#BAE6FD',        // Light blue
  pattern4: '#C4B5FD',        // Light purple
  pattern5: '#A7F3D0',        // Light green

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.03)',
  overlayMedium: 'rgba(0, 0, 0, 0.06)',
};

export const Colors = {
  light: {
    text: GameColors.text,
    background: GameColors.background,
    tint: GameColors.accent,
    icon: GameColors.textMuted,
    tabIconDefault: GameColors.textMuted,
    tabIconSelected: GameColors.accent,
  },
  dark: {
    text: GameColors.text,
    background: GameColors.background,
    tint: GameColors.accent,
    icon: GameColors.textMuted,
    tabIconDefault: GameColors.textMuted,
    tabIconSelected: GameColors.accent,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  colored: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  }),
};
