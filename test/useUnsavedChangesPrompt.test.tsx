import React from "react";
import { render, act } from "@testing-library/react";
import useUnsavedChangesPrompt from "../src/hooks/useUnsavedChangesPrompt";

// ---- Types for our mocked blocker ----
type MockBlocker = {
    state: "blocked" | "unblocked";
    proceed: jest.Mock<void, []>;
    reset: jest.Mock<void, []>;
};

// ---- Hoist-safe captured variables (must be prefixed with 'mock') ----
let mockBlocker: MockBlocker;
let mockBeforeUnloadHandler: ((e: any) => void) | null = null;

// ---- Mock just what we need from react-router-dom ----
jest.mock("react-router-dom", () => ({
    __esModule: true,
    // capture the handler the hook registers; we will call it in tests
    useBeforeUnload: (handler: (e: any) => void) => {
        mockBeforeUnloadHandler = handler;
    },
    // return whatever the current mockBlocker is
    useBlocker: (_when: boolean) => mockBlocker,
}));

// ---- Harness to mount the hook under test ----
function Harness(props: { when: boolean; onConfirm?: () => void }) {
    useUnsavedChangesPrompt(props.when, props.onConfirm);
    return null;
}

describe("useUnsavedChangesPrompt", () => {
    const realConfirm = window.confirm;

    beforeEach(() => {
        jest.useRealTimers();
        window.confirm = realConfirm;
        mockBeforeUnloadHandler = null;
        mockBlocker = {
            state: "unblocked",
            proceed: jest.fn(),
            reset: jest.fn(),
        };
    });

    afterAll(() => {
        window.confirm = realConfirm;
    });

    test("beforeunload: when=false does nothing; when=true prevents unload", () => {
        // when=false
        render(<Harness when={false} />);
        if (mockBeforeUnloadHandler) {
            const ev1: any = { preventDefault: jest.fn(), returnValue: undefined };
            mockBeforeUnloadHandler(ev1);
            expect(ev1.preventDefault).not.toHaveBeenCalled();
            expect(ev1.returnValue).toBeUndefined();
        }

        // re-render with when=true
        render(<Harness when={true} />);
        expect(typeof mockBeforeUnloadHandler).toBe("function");
        const ev2: any = { preventDefault: jest.fn(), returnValue: undefined };
        mockBeforeUnloadHandler!(ev2);
        expect(ev2.preventDefault).toHaveBeenCalledTimes(1);
    });

    test("blocked navigation + confirm=true => calls onConfirm and blocker.proceed()", () => {
        const onConfirm = jest.fn();
        window.confirm = jest.fn(() => true);

        const { rerender } = render(<Harness when={true} onConfirm={onConfirm} />);

        // simulate router blocking a navigation
        mockBlocker = { ...mockBlocker, state: "blocked" };
        rerender(<Harness when={true} onConfirm={onConfirm} />);

        expect(window.confirm).toHaveBeenCalledTimes(1);
        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(mockBlocker.proceed).toHaveBeenCalledTimes(1);
        expect(mockBlocker.reset).not.toHaveBeenCalled();
    });

    test("blocked navigation + confirm=false => calls blocker.reset()", () => {
        const onConfirm = jest.fn();
        window.confirm = jest.fn(() => false);

        const { rerender } = render(<Harness when={true} onConfirm={onConfirm} />);
        mockBlocker = { ...mockBlocker, state: "blocked" };
        rerender(<Harness when={true} onConfirm={onConfirm} />);

        expect(window.confirm).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
        expect(mockBlocker.reset).toHaveBeenCalledTimes(1);
        expect(mockBlocker.proceed).not.toHaveBeenCalled();
    });

    test("re-entrancy guard: prompts only once until guard releases, then prompts again", () => {
        jest.useFakeTimers();
        const onConfirm = jest.fn();
        window.confirm = jest.fn(() => true);

        const { rerender } = render(<Harness when={true} onConfirm={onConfirm} />);

        // 1) first block -> prompt
        mockBlocker = { ...mockBlocker, state: "blocked" };
        rerender(<Harness when={true} onConfirm={onConfirm} />);
        expect(window.confirm).toHaveBeenCalledTimes(1);
        expect(mockBlocker.proceed).toHaveBeenCalledTimes(1);

        // 2) immediately blocked again -> NO prompt due to guard
        mockBlocker = { ...mockBlocker, state: "blocked" };
        rerender(<Harness when={true} onConfirm={onConfirm} />);
        expect(window.confirm).toHaveBeenCalledTimes(1);

        // 3) release guard (hook uses setTimeout(0))
        act(() => {
            jest.advanceTimersByTime(1);
        });

        // 4) blocked again -> prompt again
        mockBlocker = { ...mockBlocker, state: "blocked" };
        rerender(<Harness when={true} onConfirm={onConfirm} />);
        expect(window.confirm).toHaveBeenCalledTimes(2);
        expect(mockBlocker.proceed).toHaveBeenCalledTimes(2);
    });

    test("does not prompt when when=false even if blocker.state is 'blocked'", () => {
        window.confirm = jest.fn(() => true);
        const { rerender } = render(<Harness when={false} />);
        mockBlocker = { ...mockBlocker, state: "blocked" };
        rerender(<Harness when={false} />);

        expect(window.confirm).not.toHaveBeenCalled();
        expect(mockBlocker.proceed).not.toHaveBeenCalled();
        expect(mockBlocker.reset).not.toHaveBeenCalled();
    });

    test("does nothing when blocker.state !== 'blocked'", () => {
        window.confirm = jest.fn(() => true);
        render(<Harness when={true} />);
        // still unblocked; the effect’s branch is a no-op
        expect(window.confirm).not.toHaveBeenCalled();
        expect(mockBlocker.proceed).not.toHaveBeenCalled();
        expect(mockBlocker.reset).not.toHaveBeenCalled();
    });
});