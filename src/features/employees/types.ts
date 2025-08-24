export type Gender = 'Male' | 'Female';

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email_address: string;
  phone_number: string;
  gender: Gender;
  date_of_birth: string; // ISO
  joined_date: string;   // ISO
}

export type EmployeeUpsert = Omit<Employee, 'id'>;