import { mainDrawerWidth } from 'lib/constants';

export const fontFamilies = ['Plus Jakarta Sans', 'Roboto', 'Inter', 'Poppins'] as const;

export type FontFamily = (typeof fontFamilies)[number];

export interface Config {
  assetsDir: string;
  sidenavCollapsed: boolean;
  openNavbarDrawer: boolean;
  drawerWidth: number;
  fontFamily: FontFamily;
  theme: string;
}

export const initialConfig: Config = {
  assetsDir: process.env.VITE_ASSET_BASE_URL ?? '',
  sidenavCollapsed: false,
  openNavbarDrawer: false,
  drawerWidth: mainDrawerWidth.full,
  fontFamily: fontFamilies[0],
  theme: 'default-light',
};

export const defaultAuthCredentials = {
  email: 'demo@moa-portal.com',
  password: 'password123',
};
