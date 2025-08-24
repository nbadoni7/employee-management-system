import * as React from "react";
import { useBlocker, useBeforeUnload } from "react-router-dom";

export default function useUnsavedChangesPrompt(
  when: boolean,
  onConfirm?: () => void
) {
  // Warn on tab close/reload only
  useBeforeUnload(
    React.useCallback(
      (e: BeforeUnloadEvent) => {
        if (!when) return;
        e.preventDefault();
        e.returnValue = "";
      },
      [when]
    )
  );

  const blocker = useBlocker(when);

  // Prevent duplicate prompts (StrictMode/effect re-runs/rapid state changes)
  const promptingRef = React.useRef(false);

  React.useEffect(() => {
    if (!when) return;
    if (blocker.state !== "blocked") return;
    if (promptingRef.current) return; // already showing a dialog

    promptingRef.current = true;

    const ok = window.confirm(
      "Form has been modified. You will lose your unsaved changes. Are you sure you want to close this form?"
    );

    if (ok) {
      onConfirm?.();
      blocker.proceed();
    } else {
      blocker.reset();
    }

    // release the guard after the navigation decision completes
    // (setTimeout avoids immediate re-run loops)
    setTimeout(() => {
      promptingRef.current = false;
    }, 0);
  }, [when, blocker, onConfirm]);
}
