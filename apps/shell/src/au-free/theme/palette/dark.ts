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
} from 'theme/palette/colors';

const common = generatePaletteChannel({ white: basic.white, black: basic.black });
const grey = generatePaletteChannel(colorGrey);

const primary = generatePaletteChannel({
  lighter: green[200],
  light: green[400],
  main: green[500],
  dark: green[700],
  darker: green[900],
  contrastText: common.white,
});
const secondary = generatePaletteChannel({
  lighter: teal[200],
  light: teal[400],
  main: teal[500],
  dark: teal[700],
  darker: teal[900],
  contrastText: common.white,
});
const tertiary = generatePaletteChannel({
  lighter: moaBlue[200],
  light: moaBlue[400],
  main: moaBlue[500],
  dark: moaBlue[700],
  darker: moaBlue[900],
  contrastText: common.white,
});
const error = generatePaletteChannel({
  lighter: moaRed[200],
  light: moaRed[400],
  main: moaRed[500],
  dark: moaRed[700],
  darker: moaRed[900],
  contrastText: common.white,
});
const warning = generatePaletteChannel({
  lighter: amber[200],
  light: amber[400],
  main: amber[500],
  dark: amber[700],
  darker: amber[900],
  contrastText: common.white,
});
const success = generatePaletteChannel({
  lighter: green[200],
  light: green[400],
  main: green[500],
  dark: green[700],
  darker: green[900],
  contrastText: common.white,
});
const info = generatePaletteChannel({
  lighter: moaOrange[200],
  light: moaOrange[400],
  main: moaOrange[500],
  dark: moaOrange[700],
  darker: moaOrange[900],
  contrastText: common.white,
});
const neutral = generatePaletteChannel({
  lighter: grey[700],
  light: grey[600],
  main: grey[500],
  dark: grey[400],
  darker: grey[300],
  contrastText: common.white,
});
const sidebar = generatePaletteChannel({
  lighter: green[800],
  light: green[900],
  main: '#0B2D1F', // Darker green for dark mode sidebar
  dark: '#051A13',
  darker: '#02100C',
  contrastText: '#DEEDE6',
});

const action = generatePaletteChannel({
  active: grey[400],
  hover: cssVarRgba(grey['500Channel'], 0.08),
  selected: cssVarRgba(grey['500Channel'], 0.16),
  disabled: grey[600],
  disabledBackground: grey[800],
  focus: cssVarRgba(grey['500Channel'], 0.24),
});
const divider = cssVarRgba(grey['500Channel'], 0.2);
const menuDivider = cssVarRgba(grey['500Channel'], 0.1);
const dividerLight = cssVarRgba(grey['500Channel'], 0.05);
const text = generatePaletteChannel({
  primary: '#FFFFFF',
  secondary: grey[400],
  disabled: grey[600],
});
const background = generatePaletteChannel({
  elevation1: '#121212',
  elevation2: '#1E1E1E',
  elevation3: '#2C2C2C',
  elevation4: '#383838',
  menu: '#1E1E1E',
  menuElevation1: '#2C2C2C',
  menuElevation2: '#383838',
  default: '#0A0A0A',
});

export const darkPaletteOptions: PaletteOptions = {
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
};
