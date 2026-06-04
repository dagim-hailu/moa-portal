"use client";

import { useState, useCallback } from "react";
import { Box, Stack, Typography, Button, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Container } from "@mui/material";
import IconifyIcon from "components/base/IconifyIcon";
import { useRouter } from "next/navigation";
import AddAppModal from "./AddAppModal";
import EditAppModal from "./EditAppModal";
import DashboardMenu from "components/common/DashboardMenu";

export default function AppRegistryClient({ initialApps }: { initialApps: any[] }) {
  const [apps, setApps] = useState(initialApps);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [editingApp, setEditingApp] = useState<any>(null);
  const router = useRouter();

  const fetchApps = useCallback(async () => {
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query {
              applications {
                id
                slug
                nameEn
                nameAm
                descriptionEn
                descriptionAm
                routePath
                isActive
                searchEnabled
                assignedUsers
              }
            }
          `,
        }),
      });
      const result = await response.json();
      setApps(result.data.applications || []);
      router.refresh();
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  }, [router]);

  const handleToggleActive = async (app: any) => {
    try {
      await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation ToggleApplication($slug: String!, $isActive: Boolean!) {
              toggleApplication(slug: $slug, isActive: $isActive)
            }
          `,
          variables: {
            slug: app.slug,
            isActive: !app.isActive,
          },
        }),
      });
      fetchApps();
    } catch (error) {
      console.error('Error toggling application status:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack
        sx={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h1" sx={{ mb: 1, color: 'text.primary' }}>
            App Registry
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Manage and register digital applications for the MOA Portal.
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<IconifyIcon icon="material-symbols:add-rounded" />}
          onClick={() => setOpenAddModal(true)}
          sx={{ borderRadius: 2, px: 4 }}
        >
          Register App
        </Button>
      </Stack>

      <Card sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: (theme) => theme.shadows[1] }}>
        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead sx={{ bgcolor: 'background.elevation2' }}>
              <TableRow>
                <TableCell sx={{ py: 2, fontWeight: 600 }}>Application</TableCell>
                <TableCell sx={{ py: 2, fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ py: 2, fontWeight: 600 }}>Users</TableCell>
                <TableCell sx={{ py: 2, fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {apps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 10 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No applications registered yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                apps.map((app) => (
                  <TableRow key={app.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ py: 2.5 }}>
                      <Stack sx={{ flexDirection: 'row', spacing: 2, alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 1.5,
                            bgcolor: 'primary.lighter',
                            color: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2,
                          }}
                        >
                          <IconifyIcon icon="material-symbols:grid-view-outline" fontSize={24} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {app.nameEn}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            /{app.slug} • {app.routePath}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ py: 2.5 }}>
                      <Chip
                        label={app.isActive ? 'Active' : 'Inactive'}
                        color={app.isActive ? 'success' : 'default'}
                        size="small"
                        variant="soft"
                        sx={{ fontWeight: 600, borderRadius: 1 }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 2.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {app.assignedUsers} users
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 2.5 }}>
                      <DashboardMenu
                        menuItems={[
                          {
                            label: 'Edit',
                            onClick: () => setEditingApp(app),
                          },
                          {
                            label: app.isActive ? 'Deactivate' : 'Activate',
                            onClick: () => handleToggleActive(app),
                            sx: { color: app.isActive ? 'error.main' : 'success.main' },
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <AddAppModal
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        onSuccess={fetchApps}
      />

      <EditAppModal
        open={Boolean(editingApp)}
        app={editingApp}
        onClose={() => setEditingApp(null)}
        onSuccess={fetchApps}
      />
    </Container>
  );
}
