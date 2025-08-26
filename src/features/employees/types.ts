import { Dayjs } from "dayjs";

export type Gender = 'Male' | 'Female';

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email_address: string;
  phone_number: string;
  gender: Gender;
  date_of_birth: Dayjs | null; // Dayjs
  joined_date: Dayjs | null;   // Dayjs
}

export type IEmployee = Employee;

export type EmployeeUpsert = Omit<Employee, 'id'>;