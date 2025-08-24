import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import { store } from "./app/store";
import App from "./App";
import "./styles.css";
import EmployeeListPage from "./features/employees/EmployeeListPage";
import EmployeeFormPage from "./features/employees/EmployeeFormPage";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<App />}>
      <Route path="/" element={<EmployeeListPage />} />
      <Route path="/employee/add" element={<EmployeeFormPage />} />
      <Route path="/employee/edit/:id" element={<EmployeeFormPage />} />
    </Route>
  )
);

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <RouterProvider router={router} />
      </LocalizationProvider>
    </ThemeProvider>
  </Provider>
);
