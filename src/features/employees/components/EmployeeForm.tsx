import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  TextField,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stack,
  Alert,
  Grid,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  employeeSchema,
  toApiPayload,
  type EmployeeFormValues,
} from "../../../schema/employeeSchema";
import { Dayjs } from "dayjs";

interface Props {
  initialValues: EmployeeFormValues;
  onSubmit: (payload: any) => void | Promise<void>;
  submitting?: boolean;
  apiError?: string;
  onDirty?: () => void;
}

export default function EmployeeForm({
  initialValues,
  onSubmit,
  submitting,
  apiError,
  onDirty,
}: Props) {
  const {
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: initialValues,
  });

  React.useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  return (
    <Box
      component="form"
      onChangeCapture={() => {
        if (!submitting) onDirty?.();
      }}
      onSubmit={handleSubmit((v) => onSubmit(toApiPayload(v)))}
      sx={{ mt: 2 }}
    >
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="first_name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="First Name"
                error={!!errors.first_name}
                helperText={errors.first_name?.message}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="last_name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Last Name"
                error={!!errors.last_name}
                helperText={errors.last_name?.message}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="email_address"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Email"
                error={!!errors.email_address}
                helperText={errors.email_address?.message}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="phone_number"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Phone (+65…)"
                error={!!errors.phone_number}
                helperText={errors.phone_number?.message}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <RadioGroup row {...field}>
                <FormControlLabel
                  value="Male"
                  control={<Radio />}
                  label="Male"
                />
                <FormControlLabel
                  value="Female"
                  control={<Radio />}
                  label="Female"
                />
              </RadioGroup>
            )}
          />
          {errors.gender && (
            <span style={{ color: "#d32f2f", fontSize: 12 }}>
              {errors.gender.message}
            </span>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="date_of_birth"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Date of Birth"
                value={(field.value ?? null) as Dayjs | null}
                onChange={(v) => field.onChange(v)}
                slotProps={{
                  textField: {
                    error: !!errors.date_of_birth,
                    helperText: errors.date_of_birth?.message,
                  },
                }}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="joined_date"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Joined Date"
                value={(field.value ?? null) as Dayjs | null}
                onChange={(v) => field.onChange(v)}
                slotProps={{
                  textField: {
                    error: !!errors.joined_date,
                    helperText: errors.joined_date?.message,
                  },
                }}
              />
            )}
          />
        </Grid>

        {apiError && (
          <Grid size={{ xs: 12 }}>
            <Alert severity="error">{apiError}</Alert>
          </Grid>
        )}

        <Grid size={{ xs: 12 }}>
          <Stack direction="row" spacing={2}>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Submit"}
            </Button>
            <Button
              type="button"
              variant="outlined"
              onClick={() => reset(initialValues)}
            >
              Reset
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
