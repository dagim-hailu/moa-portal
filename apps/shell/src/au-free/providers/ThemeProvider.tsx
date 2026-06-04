"use client";

import { PropsWithChildren, useMemo } from 'react';
import { CssBaseline, ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material';
import { themeOverrides } from 'theme/theme';
import createTypography from 'theme/typography';
import { useSettingsContext } from './SettingsProvider';
import { presetOptions } from 'data/color-presets';

const ThemeProvider = ({ children }: PropsWithChildren) => {
  const {
    config: { fontFamily, theme: themeValue },
  } = useSettingsContext();

  const typography = useMemo(() => createTypography(fontFamily), [fontFamily]);

  const theme = useMemo(() => {
    const preset = presetOptions.find((p) => p.value === themeValue) || presetOptions[0];
    const isDark = themeValue.includes('dark') || preset.mode === 'dark';
    const basePalette = isDark 
      ? themeOverrides.colorSchemes.dark.palette 
      : themeOverrides.colorSchemes.light.palette;
    
    return createTheme({
      typography,
      ...themeOverrides,
      palette: {
        ...basePalette,
        primary: {
          ...basePalette.primary,
          main: preset.colors.primary,
        },
        secondary: {
          ...basePalette.secondary,
          main: preset.colors.secondary,
        },
        error: {
          ...basePalette.error,
          main: preset.colors.error,
        },
        warning: {
          ...basePalette.warning,
          main: preset.colors.warning,
        },
        success: {
          ...basePalette.success,
          main: preset.colors.success,
        },
        neutral: {
          ...basePalette.neutral,
          main: preset.colors.neutral,
        },
      },
    });
  }, [fontFamily, themeValue]);

  return (
    <MuiThemeProvider disableTransitionOnChange theme={theme} modeStorageKey="moa-portal-mode">
      <CssBaseline enableColorScheme />
      {children}
    </MuiThemeProvider>
  );
};

export default ThemeProvider;
