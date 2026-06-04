import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
} from '@mui/material';

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: any;
}

const EditUserModal = ({ open, onClose, onSuccess, user }: EditUserModalProps) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    role: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        username: user.username || '',
        role: user.role || 'user',
        isActive: user.isActive ?? true,
      });
    }
  }, [user]);

  const handleChange = (e: any) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation UpdateUser($id: String!, $email: String, $username: String, $fullName: String, $role: String, $isActive: Boolean) {
              updateUser(id: $id, email: $email, username: $username, fullName: $fullName, role: $role, isActive: $isActive) {
                id
              }
            }
          `,
          variables: {
            id: user.id,
            ...formData,
          },
        }),
      });

      const result = await response.json();
      if (result.errors) {
        alert(result.errors[0].message);
      } else {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit User</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <TextField
            name="fullName"
            label="Full Name"
            fullWidth
            value={formData.fullName}
            onChange={handleChange}
            required
          />
          <TextField
            name="email"
            label="Email Address"
            type="email"
            fullWidth
            value={formData.email}
            onChange={handleChange}
            required
          />
          <TextField
            name="username"
            label="Username"
            fullWidth
            value={formData.username}
            onChange={handleChange}
            required
          />
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select name="role" value={formData.role} label="Role" onChange={handleChange}>
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="supervisor">Supervisor</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                color="primary"
              />
            }
            label="Active Account"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" loading={loading}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditUserModal;
