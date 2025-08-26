import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmployeeTable from "../src/features/employees/components/EmployeeTable";

// helper to render with spies
function renderTable(rows?: any[]) {
    const onAdd = jest.fn();
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    render(<EmployeeTable rows={rows} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} />);
    return { onAdd, onEdit, onDelete };
}

describe("EmployeeTable", () => {
    test("renders empty state when rows is undefined and Add button triggers handler", async () => {
        const { onAdd } = renderTable(undefined);

        // table wrapper + accessible name
        expect(screen.getByTestId("employee-table")).toBeInTheDocument();
        expect(screen.getByRole("table", { name: /employees/i })).toBeInTheDocument();

        // empty state branch
        expect(screen.getByText(/No employees yet/i)).toBeInTheDocument();

        // Add
        await userEvent.click(screen.getByTestId("add-employee"));
        expect(onAdd).toHaveBeenCalledTimes(1);
    });

    test("renders empty state when rows is [] (explicit empty array)", () => {
        renderTable([]);
        expect(screen.getByText(/No employees yet/i)).toBeInTheDocument();
    });

    test("renders rows with formatted dates, and Edit/Delete call handlers with correct ids", async () => {
        const rows = [
            {
                id: "1",
                first_name: "Ada",
                last_name: "Lovelace",
                email_address: "ada@example.com",
                phone_number: "91234567",
                gender: "Female",
                // ISO strings are accepted; component formats via toLocaleDateString("en-US", {2-digit})
                date_of_birth: "1990-05-12T00:00:00.000Z",
                joined_date: "2020-08-01T00:00:00.000Z",
            },
            {
                id: "2",
                first_name: "Alan",
                last_name: "Turing",
                email_address: "alan@example.com",
                phone_number: "92345678",
                gender: "Male",
                date_of_birth: "1985-01-03T00:00:00.000Z",
                joined_date: "2010-02-04T00:00:00.000Z",
            },
        ];

        const { onEdit, onDelete } = renderTable(rows);

        // headers exist
        expect(screen.getByText("First")).toBeInTheDocument();
        expect(screen.getByText("Last")).toBeInTheDocument();
        expect(screen.getByText("Email")).toBeInTheDocument();
        expect(screen.getByText("Phone")).toBeInTheDocument();
        expect(screen.getByText("Gender")).toBeInTheDocument();
        expect(screen.getByText(/DOB \(MM\/DD\/YYYY\)/i)).toBeInTheDocument();
        expect(screen.getByText(/Joined \(MM\/DD\/YYYY\)/i)).toBeInTheDocument();

        // row content
        expect(screen.getByText("Ada")).toBeInTheDocument();
        expect(screen.getByText("Lovelace")).toBeInTheDocument();
        expect(screen.getByText("ada@example.com")).toBeInTheDocument();
        expect(screen.getByText("91234567")).toBeInTheDocument();
        expect(screen.getByText("Female")).toBeInTheDocument();

        expect(screen.getByText("Alan")).toBeInTheDocument();
        expect(screen.getByText("Turing")).toBeInTheDocument();
        expect(screen.getByText("alan@example.com")).toBeInTheDocument();
        expect(screen.getByText("92345678")).toBeInTheDocument();
        expect(screen.getByText("Male")).toBeInTheDocument();

        // date formatting (MM/DD/YYYY)
        expect(screen.getByText("05/12/1990")).toBeInTheDocument();
        expect(screen.getByText("08/01/2020")).toBeInTheDocument();
        expect(screen.getByText("01/03/1985")).toBeInTheDocument();
        expect(screen.getByText("02/04/2010")).toBeInTheDocument();

        // actions: edit first row, delete second row
        await userEvent.click(screen.getByTestId("edit-1"));
        await userEvent.click(screen.getByTestId("delete-2"));

        expect(onEdit).toHaveBeenCalledTimes(1);
        expect(onEdit).toHaveBeenCalledWith("1");
        expect(onDelete).toHaveBeenCalledTimes(1);
        expect(onDelete).toHaveBeenCalledWith("2");

        // when rows are present, empty-state row is not rendered
        expect(screen.queryByText(/No employees yet/i)).toBeNull();
    });
});