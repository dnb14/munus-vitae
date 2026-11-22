import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Task, TaskDetails } from "../backend/backend";
import { withTag } from "./boardModel";

type Props = {
  task: Task;
  /** A Task in a Past day: its details show, but nothing can change and there's no Delete. */
  readOnly?: boolean;
  /** Saves changed details. Unchanged details and an empty title are ignored by the caller. */
  onChange(changes: Partial<TaskDetails>): void;
  onDelete(): void;
  onClose(): void;
};

/**
 * A small modal editor for one Task: title, Deadline, Notes and Tags, plus
 * Delete. Changes save as they're made, with no save button: the Deadline and
 * Tags straight away, the title and Notes when their field is left or the
 * editor closes. Escape, Close or a click outside closes it.
 */
export function TaskEditor({ task, readOnly: readOnlyNow = false, onChange, onDelete, onClose }: Props) {
  // Fixed when the editor opens: a Task that becomes a Past day's while open (at midnight) still saves its edits.
  const [readOnly] = useState(readOnlyNow);
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [newTag, setNewTag] = useState("");

  function saveTitle() {
    if (title.trim()) onChange({ title: title.trim() });
    else setTitle(task.title); // An empty title is rejected.
  }

  function saveNotes() {
    onChange({ notes: notes.trim() ? notes : null });
  }

  function addTag() {
    if (newTag.trim()) onChange({ tags: withTag(task.tags, newTag) });
    setNewTag("");
  }

  function close() {
    if (!readOnly) {
      saveTitle();
      saveNotes();
      addTag();
    }
    onClose();
  }

  // Put focus back where it was (the Task's text) when the editor closes.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    return () => {
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, []);

  // Close reads the drafts, so the backdrop listener must see the latest close.
  const closeRef = useRef(close);
  closeRef.current = close;

  return createPortal(
    <div className="dialog-backdrop" onPointerDown={(event) => event.target === event.currentTarget && closeRef.current()}>
      <div
        className="dialog task-editor"
        role="dialog"
        aria-modal="true"
        aria-label={readOnly ? "Task details" : "Edit task"}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            close();
          }
        }}
      >
        <label className="task-editor__field">
          <span className="task-editor__label">Title</span>
          <input
            className="task-editor__input"
            value={title}
            autoFocus
            readOnly={readOnly}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={() => !readOnly && saveTitle()}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !readOnly) {
                event.preventDefault();
                saveTitle();
              }
            }}
          />
        </label>

        <div className="task-editor__field">
          <label className="task-editor__label" htmlFor={`deadline-${task.id}`}>
            Deadline
          </label>
          <div className="task-editor__deadline">
            <input
              id={`deadline-${task.id}`}
              className="task-editor__input"
              type="date"
              disabled={readOnly}
              value={task.deadline ?? ""}
              onChange={(event) => onChange({ deadline: event.target.value || null })}
            />
            {task.deadline && !readOnly && (
              <button type="button" className="button button--quiet" onClick={() => onChange({ deadline: null })}>
                Clear deadline
              </button>
            )}
          </div>
        </div>

        <label className="task-editor__field">
          <span className="task-editor__label">Notes</span>
          <textarea
            className="task-editor__input task-editor__notes"
            rows={4}
            value={notes}
            readOnly={readOnly}
            onChange={(event) => setNotes(event.target.value)}
            onBlur={() => !readOnly && saveNotes()}
          />
        </label>

        <div className="task-editor__field">
          <span className="task-editor__label" id={`tags-${task.id}`}>
            Tags
          </span>
          <ul className="task-editor__tags" aria-labelledby={`tags-${task.id}`}>
            {task.tags.map((tag) => (
              <li key={tag} className="tag-chip tag-chip--editable">
                {tag}
                {!readOnly && (
                  <button
                    type="button"
                    className="tag-chip__remove"
                    aria-label={`Remove tag ${tag}`}
                    onClick={() => onChange({ tags: task.tags.filter((t) => t !== tag) })}
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
          {!readOnly && (
            <input
              className="task-editor__input"
              aria-label="Add tag"
              placeholder="Add a tag and press Enter"
              value={newTag}
              onChange={(event) => setNewTag(event.target.value)}
              onBlur={addTag}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === ",") {
                  event.preventDefault();
                  addTag();
                }
              }}
            />
          )}
        </div>

        <div className="dialog__actions">
          {!readOnly && (
            <button type="button" className="button button--quiet task-editor__delete" onClick={onDelete}>
              Delete
            </button>
          )}
          <span className="top-bar__spacer" />
          <button type="button" className="button button--accent dialog__confirm" onClick={close}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
