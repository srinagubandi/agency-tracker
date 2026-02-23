/**
 * SSA UI Kit theme configuration.
 * We extend the main theme with Health Scale Digital brand colors.
 */
import { mainTheme } from '@ssa-ui-kit/core';

// Health Scale Digital brand colors
// Primary blue: #2E6DA4 (from the logo)
export const hsdTheme = {
  ...mainTheme,
  colors: {
    ...((mainTheme as any).colors || {}),
    primary: '#2E6DA4',
    primaryDark: '#1d4f7a',
    primaryLight: '#4a8fc4',
  },
};

export default hsdTheme;
