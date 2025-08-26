import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import EmployeeFormPage from "../src/features/employees/EmployeeFormPage";

// ---------- Mock ONLY non-UI modules ----------
// RTK Query hooks
jest.mock("../src/services/employeesApi", () => ({
    __esModule: true,
    useGetEmployeeQuery: jest.fn(),
    useAddEmployeeMutation: jest.fn(),
    useUpdateEmployeeMutation: jest.fn(),
}));
import {
    useGetEmployeeQuery,
    useAddEmployeeMutation,
    useUpdateEmployeeMutation,
} from "../src/services/employeesApi";

// Unsaved-changes prompt hook (mock so we can assert it's enabled)
jest.mock("../src/hooks/useUnsavedChangesPrompt", () => ({
    __esModule: true,
    default: jest.fn(),
}));
import useUnsavedChangesPrompt from "../src/hooks/useUnsavedChangesPrompt";
import { IEmployee } from "../src/features/employees/types";
import dayjs from "dayjs";

// Router hooks (use jest.fn to avoid out-of-scope capture)
const mockNavigate = jest.fn();
type Params = Record<string, string | undefined>;
const mockUseParams: jest.Mock<Params, []> = jest.fn(() => ({} as Params));
jest.mock("react-router-dom", () => ({
    __esModule: true,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
}));

// ---------- Helpers ----------
function renderWithProviders(ui: React.ReactElement) {
    return render(<LocalizationProvider dateAdapter={AdapterDayjs}>{ui}</LocalizationProvider>);
}

const EXISTING: IEmployee = {
    id: "1",
    first_name: "Alice 22",
    last_name: "Anderson",
    email_address: "alice@example.com",
    phone_number: "91234567",
    gender: "Female",
    date_of_birth: dayjs("1990-05-12"),
    joined_date: dayjs("2020-08-01"),
};

function setupAddMode(opts?: {
    createReject?: boolean;
    createState?: Partial<{ isLoading: boolean; isError: boolean }>;
}) {
    const { createReject = false, createState = {} } = opts ?? {};

    (useGetEmployeeQuery as jest.Mock).mockReturnValue({ data: undefined, isFetching: false });

    const createFn = jest.fn((payload: any) => ({
        unwrap: createReject
            ? () => Promise.reject(new Error("create failed"))
            : () => Promise.resolve({ id: "new-id", ...payload }),
    }));

    (useAddEmployeeMutation as jest.Mock).mockReturnValue([
        createFn,
        { isLoading: false, isError: false, ...createState },
    ]);

    (useUpdateEmployeeMutation as jest.Mock).mockReturnValue([
        jest.fn(),
        { isLoading: false, isError: false },
    ]);

    mockUseParams.mockReturnValue({}); // no id -> Add mode
    return { createFn };
}

function setupEditMode(opts?: {
    existing?: IEmployee;
    isFetching?: boolean;
    updateReject?: boolean;
    updateState?: Partial<{ isLoading: boolean; isError: boolean }>;
}) {
    const { existing = EXISTING, isFetching = false, updateReject = false, updateState = {} } =
        opts ?? {};

    (useGetEmployeeQuery as jest.Mock).mockReturnValue({ data: existing, isFetching });

    const updateFn = jest.fn((payload: any) => ({
        unwrap: updateReject
            ? () => Promise.reject(new Error("update failed"))
            : () => Promise.resolve(payload),
    }));

    (useUpdateEmployeeMutation as jest.Mock).mockReturnValue([
        updateFn,
        { isLoading: false, isError: false, ...updateState },
    ]);

    (useAddEmployeeMutation as jest.Mock).mockReturnValue([
        jest.fn(),
        { isLoading: false, isError: false },
    ]);

    mockUseParams.mockReturnValue({ id: existing.id });
    return { updateFn };
}

// Helper: for MUI X DatePicker, aria-invalid is on the wrapper (role="group")
const pickerGroup = (testId: string) =>
    screen.getByTestId(testId).closest('[role="group"]') as HTMLElement;

/** Type a date into MUI X DatePicker’s segmented inputs (MM/DD/YYYY). */
async function typePickerDate(testId: string, yyyy: string, mm: string, dd: string) {
    const group = pickerGroup(testId);
    const month = within(group).getByRole("spinbutton", { name: /month/i });
    const day = within(group).getByRole("spinbutton", { name: /day/i });
    const year = within(group).getByRole("spinbutton", { name: /year/i });

    // Focus each segment and type the value
    await userEvent.click(month);
    await userEvent.clear(month);       // works on contenteditable segments
    await userEvent.type(month, mm);

    await userEvent.click(day);
    await userEvent.clear(day);
    await userEvent.type(day, dd);

    await userEvent.click(year);
    await userEvent.clear(year);
    await userEvent.type(year, yyyy);

    // blur to commit
    await userEvent.tab();
}

afterEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReset();
});

// ---------- Tests ----------
describe("EmployeeFormPage (integration, real components)", () => {
    test("Add mode: shows title and Back navigates home", async () => {
        setupAddMode();
        renderWithProviders(<EmployeeFormPage />);

        expect(screen.getByText(/Add Employee/i)).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", { name: /back/i }));
        expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    test("Edit mode: prefilled and Submit calls update then navigates with flash", async () => {
        const { updateFn } = setupEditMode();
        renderWithProviders(<EmployeeFormPage />);

        expect(screen.getByText(/Edit Employee/i)).toBeInTheDocument();

        // No typing needed; initial values come from existing
        // Act: submit the form directly
        const form = screen.getByTestId("employee-form");
        await act(async () => {
            fireEvent.submit(form);            // triggers RHF + Zod sync & async work
            await Promise.resolve();           // let queued microtasks flush
        });

        expect(updateFn).toHaveBeenCalledTimes(1);
        expect(updateFn.mock.calls[0][0]).toEqual(
            expect.objectContaining({ id: "1", first_name: "Alice 22", last_name: "Anderson" })
        );

        // Navigates to "/" with a flash message
        await waitFor(() =>
            expect(mockNavigate).toHaveBeenCalledWith(
                "/",
                expect.objectContaining({
                    state: expect.objectContaining({ flash: expect.any(String) }),
                })
            )
        );
    });

    test("Edit mode: shows Loading… while fetching existing", async () => {
        setupEditMode({ isFetching: true });
        renderWithProviders(<EmployeeFormPage />);

        expect(screen.getByText(/Loading/i)).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /submit/i })).toBeNull();
    });

    test("shows error snackbar in Add mode", async () => {
        setupAddMode({ createState: { isError: true } });
        renderWithProviders(<EmployeeFormPage />);
        expect(
            await screen.findByText(/Failed to save\. Please try again\./i)
        ).toBeInTheDocument();
    });

    test("shows error snackbar in Edit mode", async () => {
        setupEditMode({ updateState: { isError: true } });
        renderWithProviders(<EmployeeFormPage />);
        expect(
            await screen.findByText(/Failed to save\. Please try again\./i)
        ).toBeInTheDocument();
    });

    test("Back button works in Edit mode", async () => {
        setupEditMode();
        renderWithProviders(<EmployeeFormPage />);

        await userEvent.click(screen.getByRole("button", { name: /back/i }));
        expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    // ---- NEW: Dirty tracking test ----
    test("Dirty tracking: typing in a field marks form dirty and enables unsaved-changes prompt", async () => {
        setupAddMode();
        renderWithProviders(<EmployeeFormPage />);

        // Type in First Name (EmployeeForm calls onDirty on any change)
        await userEvent.type(screen.getByLabelText(/first name/i), "X");

        // The page calls useUnsavedChangesPrompt(dirty && !createSuccess && !updateSuccess, ...)
        const calls = (useUnsavedChangesPrompt as jest.Mock).mock.calls;
        expect(calls.length).toBeGreaterThan(0);

        // The last call should have enabled === true
        const [enabled /*, onConfirm*/] = calls[calls.length - 1];
        expect(enabled).toBe(true);
    });

    test("Required fields block submit and flag inputs", async () => {
        const { createFn } = setupAddMode();
        renderWithProviders(<EmployeeFormPage />);

        // Submit without typing anything
        const form = screen.getByTestId("employee-form");
        await act(async () => {
            fireEvent.submit(form);
            await Promise.resolve();
        });

        // Mutation not called
        expect(createFn).not.toHaveBeenCalled();

        // Inputs should be marked invalid per zod resolver
        expect(screen.getByTestId("first-name")).toHaveAttribute("aria-invalid", "true");
        expect(screen.getByTestId("last-name")).toHaveAttribute("aria-invalid", "true");
        expect(screen.getByTestId("email")).toHaveAttribute("aria-invalid", "true");
        expect(screen.getByTestId("phone")).toHaveAttribute("aria-invalid", "true");
        // Date pickers: aria-invalid is on the wrapper (role="group"), not the hidden input
        expect(pickerGroup("dob")).toHaveAttribute("aria-invalid", "true");
        expect(pickerGroup("joined")).toHaveAttribute("aria-invalid", "true");
    });

    test("Invalid email blocks submit and shows error state", async () => {
        const { createFn } = setupAddMode();
        renderWithProviders(<EmployeeFormPage />);

        // Fill other fields with valid data
        await userEvent.clear(screen.getByTestId("first-name"));
        await userEvent.type(screen.getByTestId("first-name"), "Alice");
        await userEvent.clear(screen.getByTestId("last-name"));
        await userEvent.type(screen.getByTestId("last-name"), "Anderson");
        await userEvent.clear(screen.getByTestId("phone"));
        await userEvent.type(screen.getByTestId("phone"), "91234567");
        // valid dates (YYYY-MM-DD in the input)
        await typePickerDate("dob", "1990", "05", "12");
        await typePickerDate("joined", "2020", "08", "01");

        // Email invalid
        await userEvent.clear(screen.getByTestId("email"));
        await userEvent.type(screen.getByTestId("email"), "not-an-email");

        const form = screen.getByTestId("employee-form");
        await act(async () => {
            fireEvent.submit(form);
            await Promise.resolve();
        });

        expect(createFn).not.toHaveBeenCalled();
        expect(screen.getByTestId("email")).toHaveAttribute("aria-invalid", "true");
    });

    test("Invalid Singapore phone blocks submit and shows error state", async () => {
        const { createFn } = setupAddMode();
        renderWithProviders(<EmployeeFormPage />);

        // Fill everything valid except phone
        await userEvent.type(screen.getByTestId("first-name"), "Bob");
        await userEvent.type(screen.getByTestId("last-name"), "Builder");
        await userEvent.type(screen.getByTestId("email"), "bob@example.com");
        // valid dates (YYYY-MM-DD in the input)
        await typePickerDate("dob", "1991", "01", "02");
        await typePickerDate("joined", "2022", "03", "04");

        // Bad SG phone (must start with 6/8/9 and be 8 digits)
        await userEvent.clear(screen.getByTestId("phone"));
        await userEvent.type(screen.getByTestId("phone"), "7123456"); // too short + bad prefix

        const form = screen.getByTestId("employee-form");
        await act(async () => {
            fireEvent.submit(form);
            await Promise.resolve();
        });

        expect(createFn).not.toHaveBeenCalled();
        expect(screen.getByTestId("phone")).toHaveAttribute("aria-invalid", "true");
    });

    test("Joined date earlier than date of birth blocks submit (cross-field rule)", async () => {
        const { createFn } = setupAddMode();
        renderWithProviders(<EmployeeFormPage />);

        await userEvent.type(screen.getByTestId("first-name"), "Carol");
        await userEvent.type(screen.getByTestId("last-name"), "Cross");
        await userEvent.type(screen.getByTestId("email"), "carol@example.com");
        await userEvent.type(screen.getByTestId("phone"), "91234567");
        // Intentionally violate: joined date before dob
        await typePickerDate("dob", "2020", "08", "01");
        await typePickerDate("joined", "2010", "02", "04");

        const form = screen.getByTestId("employee-form");
        await act(async () => {
            fireEvent.submit(form);
            await Promise.resolve();
        });

        expect(createFn).not.toHaveBeenCalled();
        // Either date could be flagged depending on how the zod refinement is applied;
        // assert that at least one of them is invalid.
        // Date pickers: aria-invalid is on the wrapper (role="group"), not the hidden input
        const dobInvalid = pickerGroup("dob").getAttribute("aria-invalid") === "true";
        const joinedInvalid = pickerGroup("joined").getAttribute("aria-invalid") === "true";
        expect(dobInvalid || joinedInvalid).toBe(true);
    });
});
