import * as React from "react";
import {
  Container,
  Typography,
  Snackbar,
  Alert,
  Stack,
  Button,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import EmployeeForm from "./components/EmployeeForm";
import {
  useAddEmployeeMutation,
  useUpdateEmployeeMutation,
  useGetEmployeeQuery,
} from "../../services/employeesApi";
import useUnsavedChangesPrompt from "../../hooks/useUnsavedChangesPrompt";
import type { EmployeeFormValues } from "../../schema/employeeSchema";
import dayjs from "dayjs";

const EMPTY: EmployeeFormValues = {
  first_name: "",
  last_name: "",
  email_address: "",
  phone_number: "",
  gender: "Male",
  date_of_birth: null,
  joined_date: null,
};

export default function EmployeeFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { data: existing, isFetching } = useGetEmployeeQuery(id!, {
    skip: !isEdit,
  });
  const [create, createState] = useAddEmployeeMutation();
  const [update, updateState] = useUpdateEmployeeMutation();

  const [dirty, setDirty] = React.useState(false);
  useUnsavedChangesPrompt(
    dirty && !createState.isSuccess && !updateState.isSuccess,
    () => setDirty(false)
  );

  const initialValues = React.useMemo<EmployeeFormValues>(() => {
    if (isEdit && existing) {
      return {
        first_name: existing.first_name,
        last_name: existing.last_name,
        email_address: existing.email_address,
        phone_number: existing.phone_number,
        gender: existing.gender === "Female" ? "Female" : "Male",
        date_of_birth: dayjs(existing.date_of_birth),
        joined_date: dayjs(existing.joined_date),
      };
    }
    return EMPTY;
  }, [isEdit, existing]);

  const saving = createState.isLoading || updateState.isLoading;
  const apiError =
    (createState.error as any)?.data?.message ||
    (updateState.error as any)?.data?.message;

  const submit = async (payload: any) => {
    try {
      if (isEdit) await update({ id: id!, ...payload }).unwrap();
      else await create(payload).unwrap();
      setDirty(false);
      setTimeout(() => {
        navigate("/", {
          state: {
            flash: isEdit
              ? "Employee updated successfully"
              : "Employee created successfully",
          },
        });
      }, 0);
    } catch {
      /* error snackbar below */
    }
  };

  return (
    <Container sx={{ py: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6">
          {isEdit ? "Edit Employee" : "Add Employee"}
        </Typography>
        <Button variant="outlined" onClick={() => navigate("/")}>
          Back
        </Button>
      </Stack>

      {!isEdit || (isEdit && !isFetching) ? (
        <EmployeeForm
          initialValues={initialValues}
          onSubmit={submit}
          submitting={saving}
          apiError={apiError}
          onDirty={() => setDirty(true)}
        />
      ) : (
        <div>Loading…</div>
      )}

      <Snackbar
        open={!!(createState.isError || updateState.isError)}
        autoHideDuration={4000}
      >
        <Alert severity="error">Failed to save. Please try again.</Alert>
      </Snackbar>
    </Container>
  );
}
