export type AppColors = {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  muted: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  border: string;
  tabBackground: string;
  tabShadow: string;
  accentSoft: string;
};

export const LIGHT_COLORS: AppColors = {
  background: '#F5F7FB',
  surface: '#FFFFFF',
  primary: '#1F2A37',
  secondary: '#4B5563',
  muted: '#90A0B5',
  accent: '#0E7490',
  success: '#0F9D58',
  warning: '#C67C12',
  error: '#DC3D3D',
  border: '#DDE5EE',
  tabBackground: '#FFFFFF',
  tabShadow: '#0B13241A',
  accentSoft: '#E2F3F8',
};

export const DARK_COLORS: AppColors = {
  background: '#0E131A',
  surface: '#161D27',
  primary: '#E6EDF7',
  secondary: '#A6B2C2',
  muted: '#7F90A6',
  accent: '#4FAFCB',
  success: '#38C172',
  warning: '#D5A436',
  error: '#FF6B6B',
  border: '#253243',
  tabBackground: '#121A24',
  tabShadow: '#00000055',
  accentSoft: '#1D3442',
};

// Backward-compatible static palette for files not yet migrated to `useAppTheme`.
export const COLORS: AppColors = LIGHT_COLORS;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
};
