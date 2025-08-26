import * as React from "react";
import { Container, Snackbar, Alert } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import EmployeeTable from "./components/EmployeeTable";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  useGetEmployeesQuery,
  useDeleteEmployeeMutation,
} from "../../services/employeesApi";

export default function EmployeeListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data, isFetching, error } = useGetEmployeesQuery();
  const [del, delState] = useDeleteEmployeeMutation();

  const [toDelete, setToDelete] = React.useState<string | null>(null);
  const [snack, setSnack] = React.useState<string | null>(null);
  const [snackSeverity, setSnackSeverity] = React.useState<"success" | "error">(
    "success"
  );

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await del(toDelete).unwrap();
      setSnack("Deleted successfully");
    } catch {
      setSnack("Delete failed");
    } finally {
      setToDelete(null);
    }
  };

  // Pick up flash message from navigation state
  React.useEffect(() => {
    const st = location.state as { flash?: string } | null;
    if (st?.flash) {
      setSnack(st.flash);
      setSnackSeverity("success");
      // Clear the flash state so it doesn't reappear on back/forward
      navigate(".", { replace: true });
    }
  }, [location, navigate]);

  return (
    <Container sx={{ py: 3 }} data-testid="employee-list-page">
      <EmployeeTable
        rows={data}
        onAdd={() => navigate("/employee/add")}
        onEdit={(id) => navigate(`/employee/edit/${id}`)}
        onDelete={(id) => setToDelete(id)}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete Employee"
        text="Are you sure you want to delete this employee?"
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />

      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack(null)}
        data-testid="snackbar"
      >
        <Alert
          data-testid="snackbar-alert"
          severity={
            delState.isError || error || snackSeverity == "error"
              ? "error"
              : "success"
          }
        >
          {snack}
        </Alert>
      </Snackbar>

      {isFetching && <div aria-label="loading" data-testid="loading">Loading…</div>}
      {error && (
        <Alert sx={{ mt: 2 }} severity="error" data-testid="load-error">
          Failed to load. Try refresh.
        </Alert>
      )}
    </Container>
  );
}
