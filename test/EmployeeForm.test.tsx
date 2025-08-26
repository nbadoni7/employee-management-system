import React from "react";
import { render, screen, waitFor, fireEvent, act, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import EmployeeForm from "../src/features/employees/components/EmployeeForm";
import { IEmployee } from "../src/features/employees/types";

const validInitial: IEmployee = {
    id: "1",
    first_name: "Alicia",         // satisfy min length
    last_name: "Anderson",        // satisfy length
    email_address: "alice@example.com",
    phone_number: "+6591234567",  // valid SG pattern
    gender: "Female",
    date_of_birth: dayjs("1990-05-12"),
    joined_date: dayjs("2020-08-01"),
};

function renderForm(props: Partial<React.ComponentProps<typeof EmployeeForm>> = {}) {
    const onSubmit = props.onSubmit ?? jest.fn();
    const initialValues = props.initialValues ?? validInitial;
    return {
        onSubmit,
        ...render(
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <EmployeeForm
                    initialValues={initialValues as any}
                    onSubmit={onSubmit}
                    submitting={props.submitting}
                    apiError={props.apiError}
                    onDirty={props.onDirty}
                />
            </LocalizationProvider>
        ),
    };
}

describe("EmployeeForm (unit)", () => {
    beforeEach(() => {
        jest.useRealTimers();
    });

    test("happy path: valid initial values -> submit calls onSubmit", async () => {
        const { onSubmit } = renderForm();

        // Submit the <form> directly (runs RHF + Zod, wrapped in act by RTL)
        const form = screen.getByTestId("employee-form");
        await act(async () => {
            fireEvent.submit(form);
            await Promise.resolve(); // flush microtasks
        });

        // Cast to Jest mock for .mock / called matchers
        const onSubmitMock = onSubmit as unknown as jest.Mock;
        expect(onSubmitMock).toHaveBeenCalledTimes(1);
        expect(onSubmitMock.mock.calls[0][0]).toEqual(expect.any(Object));
    });

    test("onDirty fires when editing fields when submitting=false", async () => {
        const onDirty = jest.fn();
        renderForm({ onDirty, submitting: false });

        await userEvent.type(screen.getByTestId("first-name"), "X");
        expect(onDirty).toHaveBeenCalled();
    });

    test("onDirty does not fire when submitting=true and submit disabled", async () => {
        const onDirty = jest.fn();
        renderForm({ onDirty: onDirty, submitting: true });

        await userEvent.type(screen.getByTestId("first-name"), "Y");
        expect(onDirty).not.toHaveBeenCalled();
        expect(screen.getByTestId("submit")).toBeDisabled();
    });

    test("Reset restores the initial values", async () => {
        renderForm();

        const first = screen.getByTestId("first-name") as HTMLInputElement;
        await userEvent.type(first, "Z");
        expect(first.value.endsWith("Z")).toBe(true);

        await userEvent.click(screen.getByTestId("reset"));
        expect(first.value).toBe(validInitial.first_name);
    });

    test("apiError renders error alert content", async () => {
        renderForm({ apiError: "Boom goes the dynamite" });
        const alert = await screen.findByTestId("api-error");
        +       expect(alert).toHaveTextContent(/Boom goes the dynamite/i);
    });

    test("validation blocks submit and flags the invalid field", async () => {
        const onSubmit = jest.fn();
        // invalid first name (too short for your schema)
        const bad: IEmployee = { ...validInitial, first_name: "Abc" };

        renderForm({ initialValues: bad, onSubmit });

        const form = screen.getByTestId("employee-form");
        await act(async () => {
            fireEvent.submit(form);
            await Promise.resolve();
        });

        // no submit, field marked invalid
        expect(onSubmit).not.toHaveBeenCalled();
        const first = screen.getByTestId("first-name");
        expect(first).toHaveAttribute("aria-invalid", "true");
    });

    test("radio group toggles Female <-> Male", async () => {
        renderForm({ initialValues: { ...validInitial, gender: "Male" } });

        const male = within(screen.getByTestId("gender-male")).getByRole("radio");
        const female = within(screen.getByTestId("gender-female")).getByRole("radio");
        expect(male).toBeChecked();

        await userEvent.click(female);
        expect(female).toBeChecked();
        expect(male).not.toBeChecked();
    });

    test("date pickers render with null value when initial dates are undefined", async () => {
        const init: IEmployee = {
            ...validInitial,
            date_of_birth: null,
            joined_date: null,
        };
        renderForm({ initialValues: init });

        const dob = screen.getByTestId("dob") as HTMLInputElement;
        const joined = screen.getByTestId("joined") as HTMLInputElement;
        // MUI DatePicker renders empty input when value is null
        expect(dob.value).toBe("");
        expect(joined.value).toBe("");
    });

    test("prop change triggers reset(initialValues) effect and updates inputs", async () => {
        const { onSubmit } = { onSubmit: jest.fn() };
        const { rerender } = render(
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <EmployeeForm initialValues={validInitial as any} onSubmit={onSubmit} />
            </LocalizationProvider>
        );

        const first = screen.getByTestId("first-name") as HTMLInputElement;
        expect(first.value).toBe("Alicia");

        // Re-render with new initial values -> effect should reset form
        const nextInitial: IEmployee = { ...validInitial, first_name: "Beatriz" };
        rerender(
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <EmployeeForm initialValues={nextInitial as any} onSubmit={onSubmit} />
            </LocalizationProvider>
        );

        await waitFor(() => expect(first.value).toBe("Beatriz"));
    });
});
