import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  FormControlLabel,
  Checkbox,
} from '@mui/material';

interface EditAppModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  app: any;
}

const EditAppModal = ({ open, onClose, onSuccess, app }: EditAppModalProps) => {
  const [formData, setFormData] = useState({
    slug: '',
    nameEn: '',
    nameAm: '',
    descriptionEn: '',
    descriptionAm: '',
    routePath: '',
    searchEnabled: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (app) {
      setFormData({
        slug: app.slug || '',
        nameEn: app.nameEn || '',
        nameAm: app.nameAm || '',
        descriptionEn: app.descriptionEn || '',
        descriptionAm: app.descriptionAm || '',
        routePath: app.routePath || '',
        searchEnabled: app.searchEnabled || false,
      });
    }
  }, [app]);

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
            mutation UpdateApplication($id: String!, $slug: String!, $nameEn: String!, $nameAm: String!, $descriptionEn: String!, $descriptionAm: String!, $routePath: String!, $searchEnabled: Boolean!) {
              updateApplication(id: $id, slug: $slug, nameEn: $nameEn, nameAm: $nameAm, descriptionEn: $descriptionEn, descriptionAm: $descriptionAm, routePath: $routePath, searchEnabled: $searchEnabled) {
                id
              }
            }
          `,
          variables: {
            id: app.id,
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
      console.error('Error updating application:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit Application</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <Stack direction="row" spacing={2}>
            <TextField
              name="slug"
              label="Slug (URL Key)"
              fullWidth
              value={formData.slug}
              onChange={handleChange}
              placeholder="e.g. dms"
              required
            />
            <TextField
              name="routePath"
              label="Internal Route"
              fullWidth
              value={formData.routePath}
              onChange={handleChange}
              placeholder="e.g. /apps/dms"
              required
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              name="nameEn"
              label="Name (English)"
              fullWidth
              value={formData.nameEn}
              onChange={handleChange}
              required
            />
            <TextField
              name="nameAm"
              label="Name (Amharic)"
              fullWidth
              value={formData.nameAm}
              onChange={handleChange}
              required
            />
          </Stack>
          <TextField
            name="descriptionEn"
            label="Description (English)"
            fullWidth
            multiline
            rows={2}
            value={formData.descriptionEn}
            onChange={handleChange}
            required
          />
          <TextField
            name="descriptionAm"
            label="Description (Amharic)"
            fullWidth
            multiline
            rows={2}
            value={formData.descriptionAm}
            onChange={handleChange}
            required
          />
          <FormControlLabel
            control={
              <Checkbox
                name="searchEnabled"
                checked={formData.searchEnabled}
                onChange={handleChange}
              />
            }
            label="Enable Universal Search Integration"
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

export default EditAppModal;
