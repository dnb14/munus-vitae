import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

type Props = {
  /** The question, e.g. "Delete Groceries and its 2 tasks?". */
  question: string;
  confirmLabel: string;
  onConfirm(): void;
  onCancel(): void;
};

/** A modal yes/no question. Cancel has focus first; Escape or a click outside cancels. */
export function ConfirmDialog({ question, confirmLabel, onConfirm, onCancel }: Props) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  // The latest onCancel, so the effect below runs once per opening rather than on every render.
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancelRef.current();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, []);

  return createPortal(
    <div className="dialog-backdrop" onPointerDown={(event) => event.target === event.currentTarget && onCancel()}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby={titleId}>
        <p id={titleId} className="dialog__question">
          {question}
        </p>
        <div className="dialog__actions">
          <button ref={cancelRef} type="button" className="button button--quiet" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="button button--accent dialog__confirm" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
