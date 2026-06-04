"use client";

import { useState } from 'react';
import {
  Button,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Typography,
} from '@mui/material';
import Menu from '@mui/material/Menu';
import { languages } from 'data/languages';
import IconifyIcon from 'components/base/IconifyIcon';

import { useRouter } from 'next/navigation';

const LanguageMenu = () => {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (locale: string) => {
    document.cookie = `moa_locale=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`;
    handleMenuClose();
    router.refresh();
  };

  // Get current locale from cookie
  const currentLocale = typeof document !== 'undefined' 
    ? document.cookie.split('; ').find(row => row.startsWith('moa_locale='))?.split('=')[1] || 'en'
    : 'en';

  const currentLanguage = languages.find(l => l.locale === currentLocale) || languages[0];

  return (
    <>
      <Button color="neutral" variant="text" shape="circle" onClick={handleMenuOpen}>
        <IconifyIcon icon={currentLanguage.icon} sx={{ fontSize: 24 }} />
      </Button>

      <Menu
        anchorEl={anchorEl}
        id="language-menu"
        open={menuOpen}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {languages.map((language) => (
          <MenuItem
            key={language.shortLabel}
            onClick={() => handleLanguageChange(language.locale)}
            selected={language.locale === currentLocale}
            sx={{ minWidth: 200 }}
          >
            <ListItemIcon>
              <IconifyIcon icon={language.icon} sx={{ fontSize: 24 }} />
            </ListItemIcon>

            <ListItemText
              primary={language.label}
              slotProps={{
                primary: { sx: { fontSize: 14 } },
              }}
            />

            <Typography
              variant="subtitle2"
              sx={{
                color: 'text.secondary',
                fontWeight: 'normal',
              }}
            >
              {language.currencySymbol}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageMenu;
