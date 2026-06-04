/* eslint-disable @typescript-eslint/no-empty-interface */
import { PaletteOptions } from '@mui/material/styles';
import { cssVarRgba, generatePaletteChannel } from 'lib/utils';
import {
  basic,
  blue,
  grey as colorGrey,
  green,
  teal,
  moaBlue,
  amber,
  moaOrange,
  moaRed,
  lightBlue,
  orange,
  purple,
  red,
} from 'theme/palette/colors';

export type PaletteColorKey =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral'
  | 'sidebar';

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

declare module '@mui/material/styles' {
  interface Color {
    950: string;
    '50Channel': string;
    '100Channel': string;
    '200Channel': string;
    '300Channel': string;
    '400Channel': string;
    '500Channel': string;
    '600Channel': string;
    '700Channel': string;
    '800Channel': string;
    '900Channel': string;
    '950Channel': string;
  }

  interface PaletteColor {
    lighter: string;
    darker: string;
  }

  interface SimplePaletteColorOptions extends Partial<PaletteColor> {}

  interface PaletteColorChannel {
    lighterChannel: string;
    darkerChannel: string;
  }

  interface Palette {
    neutral: PaletteColor;
    tertiary: PaletteColor;
    sidebar: PaletteColor;
    grey: Color;
    chGrey: Color;
    chRed: Color;
    chBlue: Color;
    chGreen: Color;
    chOrange: Color;
    chLightBlue: Color;
    dividerLight: string;
    menuDivider: string;
  }

  interface PaletteOptions extends DeepPartial<Palette> {}

  interface CssVarsPalette {
    neutral: PaletteColorChannel;
    tertiary: PaletteColorChannel;
    sidebar: PaletteColorChannel;
  }

  interface PaletteCommonChannel {
    blackChannel: string;
    whiteChannel: string;
  }

  interface PaletteTextChannel {
    disabledChannel: string;
  }

  interface PaletteActionChannel {
    disabledChannel: string;
    hoverChannel: string;
    focusChannel: string;
    disabledBackgroundChannel: string;
  }

  interface TypeBackground {
    elevation1: string;
    elevation2: string;
    elevation3: string;
    elevation4: string;
    menu: string;
    menuElevation1: string;
    menuElevation2: string;
    elevation1Channel: string;
    elevation2Channel: string;
    elevation3Channel: string;
    elevation4Channel: string;
    menuChannel: string;
    menuElevation1Channel: string;
    menuElevation2Channel: string;
  }

  interface ColorSystemOptions {
    shadows: string[];
  }
}

const common = generatePaletteChannel({ white: basic.white, black: basic.black });
const grey = generatePaletteChannel(colorGrey);

const primary = generatePaletteChannel({
  lighter: green[50],
  light: green[400],
  main: green[500],
  dark: green[700],
  darker: green[900],
  contrastText: common.white,
});
const secondary = generatePaletteChannel({
  lighter: teal[50],
  light: teal[400],
  main: teal[500],
  dark: teal[700],
  darker: teal[900],
  contrastText: common.white,
});
const tertiary = generatePaletteChannel({
  lighter: moaBlue[50],
  light: moaBlue[400],
  main: moaBlue[500],
  dark: moaBlue[700],
  darker: moaBlue[900],
  contrastText: common.white,
});
const error = generatePaletteChannel({
  lighter: moaRed[50],
  light: moaRed[400],
  main: moaRed[500],
  dark: moaRed[700],
  darker: moaRed[900],
  contrastText: common.white,
});
const warning = generatePaletteChannel({
  lighter: amber[50],
  light: amber[400],
  main: amber[500],
  dark: amber[700],
  darker: amber[900],
  contrastText: common.white,
});
const success = generatePaletteChannel({
  lighter: green[50],
  light: green[400],
  main: green[500],
  dark: green[700],
  darker: green[900],
  contrastText: common.white,
});
const info = generatePaletteChannel({
  lighter: moaOrange[50],
  light: moaOrange[400],
  main: moaOrange[500],
  dark: moaOrange[700],
  darker: moaOrange[900],
  contrastText: common.white,
});
const neutral = generatePaletteChannel({
  lighter: grey[100],
  light: grey[400],
  main: grey[500],
  dark: grey[700],
  darker: grey[900],
  contrastText: common.white,
});
const sidebar = generatePaletteChannel({
  lighter: green[700],
  light: green[800],
  main: green[900], // #154735
  dark: green[950],
  darker: green[950],
  contrastText: '#DEEDE6', // Sidebar Foreground
});

const action = generatePaletteChannel({
  active: grey[500],
  hover: grey[100],
  selected: grey[100],
  disabled: grey[400],
  disabledBackground: grey[200],
  focus: grey[300],
});
const divider = grey[200];
const menuDivider = cssVarRgba(grey['200Channel'], 0.5);
const dividerLight = cssVarRgba(grey['100Channel'], 0.6);
const text = generatePaletteChannel({
  primary: grey[900], // #111827
  secondary: grey[500], // #6B7280
  disabled: grey[400],
});
const background = generatePaletteChannel({
  elevation1: basic.white,
  elevation2: grey[50],
  elevation3: grey[100],
  elevation4: grey[200],
  menu: basic.white,
  menuElevation1: grey[50],
  menuElevation2: grey[100],
  default: '#F9FAFB', // Content area background
});
const chGrey = grey;
const chRed = generatePaletteChannel(moaRed);
const chBlue = generatePaletteChannel(blue);
const chGreen = generatePaletteChannel(green);
const chOrange = generatePaletteChannel(moaOrange);
const chLightBlue = generatePaletteChannel(lightBlue);

export const paletteOptions: PaletteOptions = {
  common,
  grey,
  primary,
  secondary,
  tertiary,
  sidebar,
  error,
  warning,
  success,
  info,
  neutral,
  action,
  divider,
  dividerLight,
  menuDivider,
  text,
  background,
  chGrey,
  chRed,
  chBlue,
  chGreen,
  chOrange,
  chLightBlue,
};
