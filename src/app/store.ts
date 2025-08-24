import { configureStore } from '@reduxjs/toolkit';
import { employeesApi } from '../services/employeesApi';

export const store = configureStore({
  reducer: { [employeesApi.reducerPath]: employeesApi.reducer },
  middleware: (gDM) => gDM().concat(employeesApi.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;