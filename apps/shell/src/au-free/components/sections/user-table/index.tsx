"use client";

import { ChangeEvent, MouseEvent, useCallback, useState } from 'react';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import { useGridApiRef } from '@mui/x-data-grid';
import IconifyIcon from 'components/base/IconifyIcon';
import StyledTextField from 'components/styled/StyledTextField';
import { Container, Typography } from '@mui/material';
import UsersTable from './UsersTable';
import FilterSection from './filters/FilterSection';
import AddUserModal from './AddUserModal';

const UserListContainer = () => {
  const [filterButtonEl, setFilterButtonEl] = useState<HTMLButtonElement | null>(null);
  const [openAddModal, setOpenAddModal] = useState(false);
  const apiRef = useGridApiRef();

  const handleOpenAddModal = () => setOpenAddModal(true);
  const handleCloseAddModal = () => setOpenAddModal(false);

  const handleSearch = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      apiRef.current?.setQuickFilterValues([e.target.value]);
    },
    [apiRef],
  );

  const handleToggleFilterPanel = (e: MouseEvent<HTMLButtonElement>) => {
    const clickedEl = e.currentTarget;

    if (filterButtonEl && filterButtonEl === clickedEl) {
      setFilterButtonEl(null);
      apiRef.current?.hideFilterPanel();

      return;
    }

    setFilterButtonEl(clickedEl);
    apiRef.current?.showFilterPanel();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack sx={{ mb: 4 }}>
        <Typography variant="h1" sx={{ mb: 1, color: 'text.primary' }}>
          User Management
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Manage portal users, roles, and account statuses.
        </Typography>
      </Stack>

      <Stack
        sx={{
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Stack direction="row" spacing={2} sx={{ width: { xs: 1, sm: 'auto' }, flexGrow: 1 }}>
          <StyledTextField
            id="search-box"
            type="search"
            size="medium"
            placeholder="Search user..."
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <IconifyIcon
                      icon="material-symbols:search-rounded"
                      sx={{
                        fontSize: 20,
                        color: 'text.secondary',
                      }}
                    />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              maxWidth: { sm: 320 },
            }}
            onChange={handleSearch}
          />
          <FilterSection apiRef={apiRef} handleToggleFilterPanel={handleToggleFilterPanel} />
        </Stack>

        <Button
          variant="contained"
          size="large"
          startIcon={<IconifyIcon icon="material-symbols:add-rounded" />}
          onClick={handleOpenAddModal}
          sx={{ borderRadius: 2, px: 4, width: { xs: 1, sm: 'auto' } }}
        >
          Add User
        </Button>
      </Stack>

      <UsersTable apiRef={apiRef} filterButtonEl={filterButtonEl} />

      <AddUserModal 
        open={openAddModal} 
        onClose={handleCloseAddModal} 
        onSuccess={() => {
          // The table should refresh via its internal state or window reload if needed
          window.location.reload(); 
        }} 
      />
    </Container>
  );
};

export default UserListContainer;
