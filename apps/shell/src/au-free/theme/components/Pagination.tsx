import { ComponentsVariants, PaginationProps, Theme, paginationItemClasses } from '@mui/material';
import { Components, PaletteColor, PaletteColorChannel } from '@mui/material/styles';
import { cssVarRgba } from 'lib/utils';
import { PaletteColorKey } from 'theme/palette';
import IconifyIcon from 'components/base/IconifyIcon';

declare module '@mui/material/Pagination' {
  interface PaginationPropsVariantOverrides {
    solid: true;
  }
  interface PaginationPropsColorOverrides {
    neutral: true;
    warning: true;
    info: true;
    error: true;
    success: true;
  }
}
declare module '@mui/material/PaginationItem' {
  interface PaginationItemPropsVariantOverrides {
    solid: true;
  }
  interface PaginationItemPropsColorOverrides {
    neutral: true;
    warning: true;
    info: true;
    error: true;
    success: true;
  }
}

const paginationSolidColors: PaletteColorKey[] = [
  'neutral',
  'primary',
  'secondary',
  'info',
  'success',
  'warning',
  'error',
];

const FirstIcon = () => (
  <IconifyIcon icon="material-symbols:keyboard-double-arrow-left-rounded" fontSize={20} />
);
const LastIcon = () => (
  <IconifyIcon icon="material-symbols:keyboard-double-arrow-right-rounded" fontSize={20} />
);
const NextIcon = () => <IconifyIcon icon="material-symbols:chevron-right-rounded" fontSize={20} />;
const previousIcon = () => (
  <IconifyIcon icon="material-symbols:chevron-left-rounded" fontSize={20} />
);

const paginationCustomVariants: any = paginationSolidColors.map(
  (color) => ({
    props: { variant: 'solid' as const, color: color as PaginationProps['color'] },
    style: ({ theme }: { theme: Theme }) => {
      const paletteColor = theme.vars.palette[color as keyof Theme['vars']['palette']] as any;
      return {
        [`&.${paginationItemClasses.selected}, &.${paginationItemClasses.selected}:hover`]: {
          backgroundColor: paletteColor?.dark,
          color: paletteColor?.contrastText,
        },
      };
    },
  }),
);

const Pagination: Components<Omit<Theme, 'components'>>['MuiPagination'] = {
  defaultProps: {
    shape: 'rounded',
  },
};

export const PaginationItem: Components<Omit<Theme, 'components'>>['MuiPaginationItem'] = {
  variants: paginationCustomVariants || [],
  defaultProps: {
    slots: {
      next: NextIcon,
      previous: previousIcon,
      first: FirstIcon,
      last: LastIcon,
    },
  },
  styleOverrides: {
    root: ({ theme }) => {
      return {
        fontSize: '14px',
        fontWeight: 500,
        borderRadius: '8px',
        '&:hover': {
          backgroundColor: theme.vars.palette.background.elevation1,
        },
        [`&.${paginationItemClasses.selected}`]: {
          backgroundColor: theme.vars.palette.background.elevation2,
          fontWeight: 700,
        },
      };
    },
  },
};
export default Pagination;
