import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Employee, EmployeeUpsert } from '../features/employees/types';

export const API_BASE_URL =
  'https://68a980b7b115e67576eb4f13.mockapi.io/api/v1';

export const employeesApi = createApi({
  reducerPath: 'employeesApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  tagTypes: ['Employee', 'Employees'],
  endpoints: (builder) => ({
    getEmployees: builder.query<Employee[], void>({
      query: () => '/employee',
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ id }) => ({ type: 'Employee' as const, id })),
            { type: 'Employees' as const, id: 'LIST' }
          ]
          : [{ type: 'Employees' as const, id: 'LIST' }]
    }),
    getEmployee: builder.query<Employee, string>({
      query: (id) => `/employee/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Employee', id }]
    }),
    addEmployee: builder.mutation<Employee, EmployeeUpsert>({
      query: (body) => ({ url: '/employee', method: 'POST', body }),
      invalidatesTags: [{ type: 'Employees', id: 'LIST' }]
    }),
    updateEmployee: builder.mutation<Employee, Partial<Employee> & { id: string }>({
      query: ({ id, ...body }) => ({ url: `/employee/${id}`, method: 'PUT', body }),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Employee', id: arg.id },
        { type: 'Employees', id: 'LIST' }
      ]
    }),
    deleteEmployee: builder.mutation<void, string>({
      query: (id) => ({ url: `/employee/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Employees', id: 'LIST' }]
    })
  })
});

export const {
  useGetEmployeesQuery,
  useGetEmployeeQuery,
  useAddEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation
} = employeesApi;