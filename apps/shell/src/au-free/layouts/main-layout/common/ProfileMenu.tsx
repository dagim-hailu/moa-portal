"use client";

import { PropsWithChildren, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  Link,
  ListItemIcon,
  MenuItem,
  MenuItemProps,
  Stack,
  Switch,
  SxProps,
  Typography,
  listClasses,
  listItemIconClasses,
  paperClasses,
} from '@mui/material';
import Menu from '@mui/material/Menu';
import { users } from 'data/users';
import paths from 'routes/paths';
import IconifyIcon from 'components/base/IconifyIcon';
import StatusAvatar from 'components/base/StatusAvatar';

import { useSession } from 'providers/SessionProvider';
import { useRouter } from 'next/navigation';

interface ProfileMenuItemProps extends MenuItemProps {
  icon: string;
  href?: string;
  sx?: SxProps;
}

const ProfileMenu = () => {
  const { session } = useSession();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  if (!session) return null;

  const displayName = session.fullName ?? session.username;
  const initial = displayName.charAt(0).toUpperCase();

  const menuButton = (
    <Button
      color="neutral"
      variant="text"
      shape="circle"
      onClick={handleClick}
      sx={{
        height: 44,
        width: 44,
      }}
    >
      <StatusAvatar
        alt={displayName}
        status="online"
        sx={{
          width: 40,
          height: 40,
          border: 2,
          borderColor: 'background.paper',
        }}
      >
        {initial}
      </StatusAvatar>
    </Button>
  );
  return (
    <>
      {menuButton}
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        transformOrigin={{
          horizontal: 'right',
          vertical: 'top',
        }}
        anchorOrigin={{
          horizontal: 'right',
          vertical: 'bottom',
        }}
        sx={{
          [`& .${paperClasses.root}`]: { minWidth: 320 },
          [`& .${listClasses.root}`]: { py: 0 },
        }}
      >
        <Stack
          sx={{
            alignItems: 'center',
            gap: 2,
            px: 3,
            py: 2,
          }}
        >
          <StatusAvatar
            status="online"
            sx={{ width: 80, height: 80 }}
          >
            {initial}
          </StatusAvatar>
          <Stack sx={{ alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {displayName}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {session.email}
            </Typography>
          </Stack>
        </Stack>
        <Divider />
        <Box sx={{ p: 1 }}>
          <ProfileMenuItem icon="material-symbols:person-outline" href="/admin/account">
            Profile
          </ProfileMenuItem>
          <ProfileMenuItem icon="material-symbols:settings-outline" href="/settings">
            Settings
          </ProfileMenuItem>
          <Divider sx={{ my: 1 }} />
          <ProfileMenuItem 
            icon="material-symbols:logout" 
            onClick={handleLogout}
            sx={{ color: 'error.main' }}
          >
            Logout
          </ProfileMenuItem>
        </Box>
      </Menu>
    </>
  );
};

const ProfileMenuItem = ({
  icon,
  onClick,
  children,
  href,
  sx,
}: PropsWithChildren<ProfileMenuItemProps>) => {
  const linkProps = href ? { component: Link, href, underline: 'none' } : {};
  return (
    <MenuItem onClick={onClick} {...linkProps} sx={{ gap: 1, ...sx }}>
      <ListItemIcon
        sx={{
          [`&.${listItemIconClasses.root}`]: { minWidth: 'unset !important' },
        }}
      >
        <IconifyIcon icon={icon} sx={{ color: 'text.secondary' }} />
      </ListItemIcon>
      {children}
    </MenuItem>
  );
};

export default ProfileMenu;

const demoUser = {
  id: 0,
  email: 'guest@mail.com',
  name: 'Guest',
  avatar: users[13].avatar,
  designation: 'Merchant Captian ',
};
