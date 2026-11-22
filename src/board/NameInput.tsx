import { useState } from "react";

type Props = {
  label: string;
  initialValue?: string;
  /** Called with the trimmed name. Empty names never reach here. */
  onSave(name: string): void;
  onCancel(): void;
};

/**
 * An in-place text input for naming things. Enter saves, Escape cancels.
 * An empty name is rejected: Enter does nothing, and leaving the input cancels.
 */
export function NameInput({ label, initialValue = "", onSave, onCancel }: Props) {
  const [value, setValue] = useState(initialValue);
  const [finished, setFinished] = useState(false);

  function finish(save: boolean) {
    if (finished) return;
    const name = value.trim();
    if (save && !name) return;
    setFinished(true);
    if (save) onSave(name);
    else onCancel();
  }

  return (
    <input
      className="name-input"
      aria-label={label}
      value={value}
      autoFocus
      onChange={(event) => setValue(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          finish(true);
        } else if (event.key === "Escape") {
          event.preventDefault();
          finish(false);
        }
      }}
      onBlur={() => (value.trim() ? finish(true) : finish(false))}
    />
  );
}
