import { Platform } from 'react-native';

const tintColorLight = '#171717';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#262626',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#737373',
    tabIconDefault: '#737373',
    tabIconSelected: tintColorLight,
    primary: '#171717',
    secondary: '#F5F5F5',
    muted: '#A3A3A3',
    border: '#E5E5E5',
    error: '#EF4444',
  },
  dark: {
    text: '#FAFAFA',
    background: '#0A0A0A',
    tint: tintColorDark,
    icon: '#A3A3A3',
    tabIconDefault: '#A3A3A3',
    tabIconSelected: tintColorDark,
    primary: '#FAFAFA',
    secondary: '#171717',
    muted: '#737373',
    border: '#262626',
    error: '#F87171',
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
