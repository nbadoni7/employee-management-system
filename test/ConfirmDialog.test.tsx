import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmDialog from "../src/components/ConfirmDialog";

describe("ConfirmDialog", () => {
    test("renders title, text, and actions when open=true", async () => {
        const onCancel = jest.fn();
        const onConfirm = jest.fn();

        render(
            <ConfirmDialog
                open
                title="Delete employee"
                text="Are you sure you want to delete this employee?"
                onCancel={onCancel}
                onConfirm={onConfirm}
            />
        );

        // container + content
        expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
        expect(screen.getByText("Delete employee")).toBeInTheDocument();
        expect(
            screen.getByText("Are you sure you want to delete this employee?")
        ).toBeInTheDocument();

        // actions present
        expect(screen.getByTestId("confirm-cancel")).toBeInTheDocument();
        expect(screen.getByTestId("confirm-ok")).toBeInTheDocument();

        // no handlers fired yet
        expect(onCancel).not.toHaveBeenCalled();
        expect(onConfirm).not.toHaveBeenCalled();
    });

    test("does not render when open=false", () => {
        render(
            <ConfirmDialog
                open={false}
                title="Hidden"
                text="Hidden"
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
            />
        );
        expect(screen.queryByTestId("confirm-dialog")).toBeNull();
    });

    test("clicking Cancel calls onCancel only", async () => {
        const onCancel = jest.fn();
        const onConfirm = jest.fn();
        render(
            <ConfirmDialog
                open
                title="Confirm"
                text="Text"
                onCancel={onCancel}
                onConfirm={onConfirm}
            />
        );

        await userEvent.click(screen.getByTestId("confirm-cancel"));
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    test("clicking OK calls onConfirm only", async () => {
        const onCancel = jest.fn();
        const onConfirm = jest.fn();
        render(
            <ConfirmDialog
                open
                title="Confirm"
                text="Text"
                onCancel={onCancel}
                onConfirm={onConfirm}
            />
        );

        await userEvent.click(screen.getByTestId("confirm-ok"));
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onCancel).not.toHaveBeenCalled();
    });

    test("pressing Escape triggers onCancel via onClose", async () => {
        const onCancel = jest.fn();
        render(
            <ConfirmDialog
                open
                title="Confirm"
                text="Text"
                onCancel={onCancel}
                onConfirm={jest.fn()}
            />
        );

        const dialog = screen.getByRole("dialog");

        // Focus the dialog root and dispatch Escape inside act
        act(() => {
            (dialog as HTMLElement).focus?.();
            fireEvent.keyDown(dialog, { key: "Escape", code: "Escape", keyCode: 27, charCode: 27 });
        });

        expect(onCancel).toHaveBeenCalledTimes(1);
    });
});