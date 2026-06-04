"use client";

import { RefObject, useMemo, useState, useEffect } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import {
  DataGrid,
  GRID_CHECKBOX_SELECTION_COL_DEF,
  GridColDef,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import { GridApiCommunity } from '@mui/x-data-grid/internals';
import dayjs from 'dayjs';
import DashboardMenu from 'components/common/DashboardMenu';
import DataGridPagination from 'components/pagination/DataGridPagination';
import EditUserModal from './EditUserModal';

interface UsersTableProps {
  apiRef: RefObject<GridApiCommunity | null>;
  filterButtonEl: HTMLButtonElement | null;
}

const UsersTable = ({ apiRef, filterButtonEl }: UsersTableProps) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query {
              portalUsers {
                id
                email
                username
                fullName
                role
                isActive
                createdAt
              }
            }
          `,
        }),
      });
      const result = await response.json();
      setUsers(result.data.portalUsers || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (user: any) => {
    try {
      await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation UpdateUser($id: String!, $isActive: Boolean) {
              updateUser(id: $id, isActive: $isActive) {
                id
              }
            }
          `,
          variables: {
            id: user.id,
            isActive: !user.isActive,
          },
        }),
      });
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const columns: GridColDef<any>[] = useMemo(
    () => [
      {
        ...GRID_CHECKBOX_SELECTION_COL_DEF,
        width: 64,
      },
      {
        field: 'avatar',
        headerName: 'Avatar',
        width: 64,
        sortable: false,
        filterable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams<any>) => (
          <Tooltip title={params.row.fullName}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: 14,
              }}
            >
              {params.row.fullName.charAt(0).toUpperCase()}
            </Avatar>
          </Tooltip>
        ),
      },
      {
        field: 'fullName',
        headerName: 'Name',
        minWidth: 160,
        flex: 1,
      },
      {
        field: 'email',
        headerName: 'Email',
        minWidth: 230,
        flex: 1,
        renderCell: (params: GridRenderCellParams<any>) => (
          <Link href={`mailto:${params.row.email}`} variant="body2">
            {params.row.email}
          </Link>
        ),
      },
      {
        field: 'isActive',
        headerName: 'Status',
        width: 120,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params: GridRenderCellParams<any>) => (
          <Chip
            label={params.row.isActive ? 'Active' : 'Inactive'}
            color={params.row.isActive ? 'success' : 'default'}
            size="small"
          />
        ),
      },
      {
        field: 'role',
        headerName: 'Role',
        width: 130,
        renderCell: (params: GridRenderCellParams<any>) => (
          <Chip 
            label={params.row.role} 
            size="small" 
            variant="outlined"
            sx={{ textTransform: 'capitalize' }}
          />
        ),
      },
      {
        field: 'username',
        headerName: 'Username',
        width: 150,
      },
      {
        field: 'createdAt',
        headerName: 'Created At',
        width: 180,
        renderCell: (params: GridRenderCellParams<any>) => (
          <Typography variant="body2">
            {dayjs(params.row.createdAt).format('MMM DD, YYYY')}
          </Typography>
        ),
      },
      {
        field: 'action',
        headerName: '',
        filterable: false,
        sortable: false,
        width: 60,
        align: 'right',
        headerAlign: 'right',
        renderCell: (params: GridRenderCellParams<any>) => (
          <DashboardMenu
            menuItems={[
              {
                label: 'Edit',
                onClick: () => setEditingUser(params.row),
              },
              {
                label: params.row.isActive ? 'Deactivate' : 'Activate',
                onClick: () => handleToggleActive(params.row),
                sx: { color: params.row.isActive ? 'error.main' : 'success.main' },
              },
            ]}
          />
        ),
      },
    ],
    [],
  );

  return (
    <Box sx={{ width: 1 }}>
      <Card sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: (theme) => theme.shadows[1] }}>
        <DataGrid
          rowHeight={64}
          rows={users}
          loading={loading}
          apiRef={apiRef}
          columns={columns}
          pageSizeOptions={[8]}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 8,
              },
            },
          }}
          checkboxSelection
          disableRowSelectionOnClick
          slots={{
            basePagination: (props) => <DataGridPagination showFullPagination {...props} />,
          }}
          slotProps={{
            panel: {
              target: filterButtonEl,
            },
          }}
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeader': {
              bgcolor: 'background.elevation2',
              py: 2,
            },
            '& .MuiDataGrid-cell': {
              py: 2.5,
            },
          }}
        />
      </Card>
      <EditUserModal
        open={Boolean(editingUser)}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSuccess={fetchUsers}
      />
    </Box>
  );
};

export default UsersTable;
