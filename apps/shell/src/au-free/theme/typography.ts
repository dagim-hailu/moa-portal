import { TypographyVariantsOptions } from '@mui/material/styles';
import { FontFamily, initialConfig } from 'config';

const createTypography = (
  fontFamily: FontFamily = initialConfig.fontFamily,
): TypographyVariantsOptions => ({
  fontFamily: ['Inter', 'Noto Sans Ethiopic', 'sans-serif'].join(','),
  h1: {
    fontWeight: 700,
    fontSize: '2rem', // 32px
    lineHeight: 1.2,
  },
  h2: {
    fontWeight: 600,
    fontSize: '1.5rem', // 24px
    lineHeight: 1.3,
  },
  h3: {
    fontWeight: 600,
    fontSize: '1.25rem', // 20px
    lineHeight: 1.4,
  },
  h4: {
    fontWeight: 600,
    fontSize: '1.125rem', // 18px
    lineHeight: 1.4,
  },
  h5: {
    fontWeight: 600,
    fontSize: '1rem', // 16px
    lineHeight: 1.4,
  },
  h6: {
    fontWeight: 600,
    fontSize: '0.875rem', // 14px
    lineHeight: 1.4,
  },
  subtitle1: {
    fontWeight: 500,
    fontSize: '1rem', // 16px
    lineHeight: 1.5,
  },
  subtitle2: {
    fontWeight: 500,
    fontSize: '0.875rem', // 14px
    lineHeight: 1.5,
  },
  body1: {
    fontWeight: 400,
    fontSize: '1rem', // 16px
    lineHeight: 1.5,
  },
  body2: {
    fontWeight: 400,
    fontSize: '0.875rem', // 14px
    lineHeight: 1.5,
  },
  button: {
    fontWeight: 500,
    fontSize: '0.875rem', // 14px
    lineHeight: 1,
    textTransform: 'none',
  },
  caption: {
    fontWeight: 400,
    fontSize: '0.75rem', // 12px
    lineHeight: 1.5,
  },
  overline: {
    fontWeight: 400,
    fontSize: '0.75rem', // 12px
    lineHeight: 1.5,
    textTransform: 'uppercase',
  },
});

export default createTypography;
