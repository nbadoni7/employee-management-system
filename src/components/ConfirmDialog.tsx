import {
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button
} from '@mui/material';

interface Props {
  open: boolean;
  title: string;
  text: string;
  onCancel: () => void;
  onConfirm: () => void;
}
export default function ConfirmDialog({ open, title, text, onCancel, onConfirm }: Props) {
  return (
    <Dialog open={open} onClose={onCancel} data-testid="confirm-dialog">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent><DialogContentText>{text}</DialogContentText></DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onCancel} data-testid="confirm-cancel">Cancel</Button>
        <Button onClick={onConfirm} data-testid="confirm-ok">OK</Button>
      </DialogActions>
    </Dialog>
  );
}