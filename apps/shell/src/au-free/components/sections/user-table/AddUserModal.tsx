import { useState } from 'react';
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
} from '@mui/material';

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddUserModal = ({ open, onClose, onSuccess }: AddUserModalProps) => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    fullName: '',
    role: 'user',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation CreateUser($email: String!, $username: String!, $fullName: String!, $role: String!, $password: String!) {
              createUser(email: $email, username: $username, fullName: $fullName, role: $role, password: $password) {
                id
              }
            }
          `,
          variables: formData,
        }),
      });

      const result = await response.json();
      if (result.errors) {
        alert(result.errors[0].message);
      } else {
        onSuccess();
        onClose();
        setFormData({
          email: '',
          username: '',
          fullName: '',
          role: 'user',
          password: '',
        });
      }
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add New User</DialogTitle>
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
          <TextField
            name="password"
            label="Password"
            type="password"
            fullWidth
            value={formData.password}
            onChange={handleChange}
            required
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" loading={loading}>
          Create User
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddUserModal;
