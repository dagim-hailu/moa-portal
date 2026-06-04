"use client";

import { MouseEvent, useCallback, useState } from 'react';
import {
  Box,
  Button,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Radio,
  Typography,
  radioClasses,
} from '@mui/material';
import { presetOptions } from 'data/color-presets';
import IconifyIcon from 'components/base/IconifyIcon';
import { useSettingsContext } from 'providers/SettingsProvider';

const ThemeToggler = () => {
  const { config, setConfig } = useSettingsContext();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleThemeChange = (themeValue: string) => {
    setConfig({ theme: themeValue });
    handleMenuClose();
  };

  return (
    <>
      <Button color="neutral" variant="soft" shape="circle" onClick={handleMenuOpen}>
        <IconifyIcon icon="material-symbols-light:palette-outline" sx={{ fontSize: 22 }} />
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 280,
            },
          },
        }}
      >
        {presetOptions.map((option) => {
          const isActive = option.value === config.theme;
          const themeColors = [
            option.colors.primary,
            option.colors.success,
            option.colors.warning,
            option.colors.error,
            option.colors.secondary,
            option.colors.neutral,
          ];

          return (
            <MenuItem
              key={option.value}
              onClick={() => handleThemeChange(option.value)}
              selected={isActive}
              sx={{
                py: 0.5,
                px: 2,
              }}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                <Radio
                  checked={isActive}
                  value={option.value}
                  checkedIcon={
                    <IconifyIcon
                      fontSize={24}
                      icon="material-symbols-light:check-circle"
                      sx={{ color: 'primary.main', fontSize: '24px !important' }}
                    />
                  }
                  sx={{
                    p: 0,
                    ...(isActive && {
                      [`&.${radioClasses.root}`]: {
                        ml: -0.5,
                      },
                      '&:hover': {
                        backgroundColor: 'transparent',
                      },
                    }),
                  }}
                />
              </ListItemIcon>

              <ListItemText>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'primary.main' : 'text.primary',
                  }}
                >
                  {option.label}
                </Typography>
              </ListItemText>
              <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
                {themeColors.map((color, i) => (
                  <Box
                    key={i}
                    sx={{
                      width: 12,
                      height: 12,
                      bgcolor: color,
                      borderRadius: 0.5,
                    }}
                  />
                ))}
              </Box>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

export default ThemeToggler;
