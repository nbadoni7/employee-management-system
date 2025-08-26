// test/EmployeeListPage.test.tsx
import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmployeeListPage from "../src/features/employees/EmployeeListPage";
import * as api from "../src/services/employeesApi";
import { IEmployee } from "../src/features/employees/types";
import dayjs from "dayjs";

// --- Hard-mock the data layer to avoid fetch/SSR warnings ---
jest.mock("../src/services/employeesApi", () => ({
  __esModule: true,
  useGetEmployeesQuery: jest.fn(),
  useDeleteEmployeeMutation: jest.fn(),
}));

// --- Hard-mock the router to avoid TextEncoder issues ---
const mockNavigate = jest.fn();
const mockLocation: { state: any } = { state: null };
jest.mock("react-router-dom", () => ({
  __esModule: true,
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

// ---- helpers ----

// Mutable dataset that the hook will read each render
let DATA: IEmployee[] = [];

function setupApi({
  initial = [] as IEmployee[],
  isFetching = false,
  error = undefined as any,
  deleteReject = false,
}) {
  DATA = [...initial];

  (api.useGetEmployeesQuery as jest.Mock).mockReturnValue({
    data: DATA,
    isFetching,
    error,
  });

  const delFn = jest.fn((id: string) => ({
    unwrap: deleteReject
      ? () => Promise.reject(new Error("boom"))
      : () => {
        // mutate backing store so the next render shows updated rows
        DATA = DATA.filter((e) => e.id !== id);
        return Promise.resolve({});
      },
  }));

  (api.useDeleteEmployeeMutation as jest.Mock).mockReturnValue([
    delFn,
    { isError: deleteReject, isLoading: false },
  ]);

  return { delFn };
}
const sampleRow: IEmployee = {
  id: "1",
  first_name: "Afirst",
  last_name: "Alast",
  email_address: "a@example.com",
  phone_number: "92345678",
  gender: "Male",
  date_of_birth: dayjs("1990-05-12"),
  joined_date: dayjs("2020-08-01"),
};

describe("EmployeeListPage (integration with real components)", () => {
  afterEach(() => {
    jest.clearAllMocks();
    mockLocation.state = null;
  });

  test("renders table and navigates on Add/Edit", async () => {
    setupApi({ initial: [sampleRow] });
    render(<EmployeeListPage />);

    // EmployeeTable present
    expect(screen.getByTestId("employee-table")).toBeInTheDocument();

    // Add flow
    await userEvent.click(screen.getByTestId("add-employee"));
    expect(mockNavigate).toHaveBeenCalledWith("/employee/add");

    // Edit flow (uses data-testid we added to the IconButton)
    await userEvent.click(screen.getByTestId("edit-1"));
    expect(mockNavigate).toHaveBeenCalledWith("/employee/edit/1");
  });

  test("delete -> confirm success shows success snackbar and closes dialog", async () => {
    const { delFn } = setupApi({ initial: [sampleRow] });
    render(<EmployeeListPage />);

    // Open confirm dialog
    await userEvent.click(screen.getByTestId("delete-1"));

    expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();

    // Confirm deletion
    await userEvent.click(screen.getByTestId("confirm-ok"));
    expect(delFn).toHaveBeenCalledWith("1");

    // the list re-renders and the deleted row’s controls are gone
    await waitFor(async () => {
      // Snackbar shows success
      expect(await screen.findByText(/Deleted successfully/i)).toBeInTheDocument();

      // Dialog has closed
      expect(screen.queryByTestId("confirm-dialog")).not.toBeInTheDocument();
    });
  });

  test("delete -> confirm failure shows error snackbar and closes dialog", async () => {
    const { delFn } = setupApi({ initial: [sampleRow], deleteReject: true });
    render(<EmployeeListPage />);

    await userEvent.click(screen.getByTestId("delete-1"));
    await userEvent.click(screen.getByTestId("confirm-ok"));
    expect(delFn).toHaveBeenCalledWith("1");

    // the list re-renders and the deleted row’s controls are gone
    await waitFor(async () => {
      expect(await screen.findByText(/Delete failed/i)).toBeInTheDocument();
      expect(screen.queryByTestId("confirm-dialog")).not.toBeInTheDocument();
    });
  });

  test("cancel in confirm dialog closes it without mutating", async () => {
    const { delFn } = setupApi({ initial: [sampleRow] });
    render(<EmployeeListPage />);

    await userEvent.click(screen.getByTestId("delete-1"));
    await userEvent.click(screen.getByTestId("confirm-cancel"));

    expect(delFn).not.toHaveBeenCalled();

    // the list re-renders and the deleted row’s controls are gone
    await waitFor(async () => {
      expect(screen.queryByTestId("confirm-dialog")).not.toBeInTheDocument();
    });
  });

  test("shows loading and error states", async () => {
    // loading
    setupApi({ isFetching: true });
    render(<EmployeeListPage />);
    expect(screen.getByTestId("loading")).toBeInTheDocument();

    // error
    setupApi({ error: { status: 500 } });
    render(<EmployeeListPage />);
    expect(await screen.findByTestId("load-error")).toBeInTheDocument();
  });

  test("flash message from router state shows snackbar and triggers replace navigation", async () => {
    setupApi({ initial: [sampleRow] });
    mockLocation.state = { flash: "Saved!" };

    render(<EmployeeListPage />);
    expect(await screen.findByText(/Saved!/i)).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith(".", { replace: true });
  });

  test("snackbar auto-hides after 3000ms (onClose)", async () => {
    // jest.useFakeTimers();
    setupApi({ initial: [sampleRow] });
    render(<EmployeeListPage />);

    // Open and confirm delete to show snackbar
    await userEvent.click(screen.getByTestId("delete-1"));
    expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("confirm-ok"));

    expect(await screen.findByTestId("snackbar")).toBeInTheDocument();

    // wait slightly longer than autoHide (3s) to let onClose + transition finish
    await act(async () => {
      // wait slightly longer than 3000ms to cover transition
      await new Promise((r) => setTimeout(r, 3500));
    });

    // Wait for the snackbar to be removed from the DOM
    await waitFor(() => {
      expect(screen.queryByTestId("snackbar")).not.toBeInTheDocument();
    });
  });
});
