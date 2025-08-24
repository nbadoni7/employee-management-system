import { z } from "zod";
import dayjs, { type Dayjs } from "dayjs";
import { sgPhoneRegex } from "../utils/phone";

// validate Dayjs or null; mark required and valid
const dayjsRequired = z.custom<Dayjs | null>(
  (v) => dayjs.isDayjs(v) && v.isValid(),
  {
    message: "Required",
  }
);

// Define Gender type once
type Gender = "Male" | "Female";

// Zod-agnostic gender validator (no enum/literal)
const genderSchema = z
  .string()
  .refine((v): v is Gender => v === "Male" || v === "Female", {
    message: "Select gender",
  }) as unknown as z.ZodType<Gender>;

export const employeeSchema = z
  .object({
    first_name: z.string().min(6, "Min 6 chars").max(10, "Max 10 chars"),
    last_name: z.string().min(6, "Min 6 chars").max(10, "Max 10 chars"),
    email_address: z.string().email("Invalid email"),
    phone_number: z
      .string()
      .regex(sgPhoneRegex, "Enter a valid Singapore number"),
    gender: genderSchema,
    date_of_birth: dayjsRequired,
    joined_date: dayjsRequired,
  })
  .refine(
    (d) =>
      !d.date_of_birth || !d.joined_date || d.joined_date > d.date_of_birth,
    {
      path: ["joined_date"],
      message: "Joined date must be after Date of Birth",
    }
  );

export type EmployeeFormValues = z.input<typeof employeeSchema>;
export type EmployeeParsedValues = z.output<typeof employeeSchema>;

export const toApiPayload = (v: EmployeeFormValues) => ({
  ...v,
  date_of_birth: (v.date_of_birth as Dayjs).toDate().toISOString(),
  joined_date: (v.joined_date as Dayjs).toDate().toISOString(),
});
