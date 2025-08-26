import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Stack, Button
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Employee } from '../types';

interface Props {
  rows?: Employee[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function EmployeeTable({ rows, onAdd, onEdit, onDelete }: Props) {
  return (
    <Stack spacing={2} data-testid="employee-table">
      <Stack direction="row" justifyContent="flex-end">
        <Button onClick={onAdd} data-testid="add-employee">Add Employee</Button>
      </Stack>
      <TableContainer component={Paper}>
        <Table size="small" aria-label="employees">
          <TableHead>
            <TableRow>
              <TableCell>First</TableCell>
              <TableCell>Last</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>DOB (MM/DD/YYYY)</TableCell>
              <TableCell>Joined (MM/DD/YYYY)</TableCell>
              <TableCell width={120} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(rows ?? []).map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>{r.first_name}</TableCell>
                <TableCell>{r.last_name}</TableCell>
                <TableCell>{r.email_address}</TableCell>
                <TableCell>{r.phone_number}</TableCell>
                <TableCell>{r.gender}</TableCell>
                <TableCell>{new Date(r.date_of_birth as any).toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                })}</TableCell>
                <TableCell>{new Date(r.joined_date as any).toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                })}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => onEdit(r.id)} data-testid={`edit-${r.id}`} aria-label={`edit-${r.id}`}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => onDelete(r.id)} data-testid={`delete-${r.id}`} aria-label={`delete-${r.id}`}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {(!rows || rows.length === 0) && (
              <TableRow><TableCell colSpan={8} align="center">No employees yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}