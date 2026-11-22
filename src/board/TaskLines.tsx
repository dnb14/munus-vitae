import { useEffect, useRef, useState } from "react";
import type { Task } from "../backend/backend";
import { emptyLineCount, isOverdue, matchesTagFilter } from "./boardModel";
import { deadlineLabel, type CalendarDate } from "./dates";

/** What every Task line needs from the Board, the same in every column. */
export type TaskLineActions = {
  today: CalendarDate;
  /** The Tag the page is filtered by, or null. */
  activeTag: string | null;
  /** Ticks (true) or unticks (false) a Task. */
  onSetDone(taskId: string, done: boolean): void;
  /** Opens the Task editor. */
  onEdit(taskId: string): void;
  /** Filters the page by a Tag. */
  onPickTag(tag: string): void;
};

type Props = {
  /** The column's contents from the Board model. A new Task snaps in after the unfinished ones. */
  contents: { unfinished: Task[]; done: Task[] };
  onAdd(title: string): void;
  taskActions: TaskLineActions;
};

/**
 * A column's body, ruled into Lines like notebook paper. Tasks fill Lines from
 * the top; clicking any empty Line opens an input on the Line a new Task
 * snaps to. The column scrolls when full, always keeping one empty Line.
 */
export function TaskLines({ contents: { unfinished, done }, onAdd, taskActions }: Props) {
  const [adding, setAdding] = useState(false);
  const [containerRef, height] = useHeight<HTMLDivElement>();

  const emptyLines = emptyLineCount(height, unfinished.length + done.length, adding);

  return (
    <div className="lines" ref={containerRef}>
      <ol className="lines__tasks">
        {unfinished.map((task) => (
          <TaskLine key={task.id} task={task} actions={taskActions} />
        ))}
        {adding && (
          <li className="line" role="presentation">
            <NewTaskInput onAdd={onAdd} onClose={() => setAdding(false)} />
          </li>
        )}
        {done.map((task) => (
          <TaskLine key={task.id} task={task} actions={taskActions} />
        ))}
      </ol>
      {Array.from({ length: emptyLines }, (_, i) => (
        <button
          key={i}
          type="button"
          className="line line--empty"
          aria-label="Add a task"
          // Every empty Line opens the same input, so only the first is in the tab order.
          tabIndex={i === 0 ? 0 : -1}
          onClick={() => setAdding(true)}
        />
      ))}
    </div>
  );
}

/**
 * One Task on its Line. The checkbox shows on hover or keyboard focus; a Done
 * Task is crossed out and greyed all the time. Clicking the text opens the
 * editor. A Deadline shows as a date badge, red once it has passed while the
 * Task isn't Done; Tags show as chips that filter the page. When a Tag filter
 * is on, Tasks without that Tag are dimmed.
 */
function TaskLine({ task, actions }: { task: Task; actions: TaskLineActions }) {
  const overdue = isOverdue(task, actions.today);
  const dimmed = !matchesTagFilter(task, actions.activeTag);
  return (
    <li
      className={["line", "task-line", task.done && "task-line--done", dimmed && "task-line--dimmed"]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        type="checkbox"
        className="task-line__checkbox"
        aria-label={`Done: ${task.title}`}
        checked={task.done}
        onChange={(event) => actions.onSetDone(task.id, event.target.checked)}
      />
      <button
        type="button"
        className="task-line__title"
        aria-label={`Edit ${task.title}`}
        onClick={() => actions.onEdit(task.id)}
      >
        {task.title}
      </button>
      {task.deadline && (
        <span
          className={["deadline-badge", overdue && "deadline-badge--overdue"].filter(Boolean).join(" ")}
          title={`${overdue ? "Overdue" : "Deadline"}: ${deadlineLabel(task.deadline)}`}
        >
          {deadlineLabel(task.deadline)}
        </span>
      )}
      {task.tags.map((tag) => (
        <button
          key={tag}
          type="button"
          className="tag-chip"
          aria-label={`Filter by tag ${tag}`}
          aria-pressed={actions.activeTag === tag}
          onClick={() => actions.onPickTag(tag)}
        >
          {tag}
        </button>
      ))}
    </li>
  );
}

/** Enter saves and stays open for the next Task; Escape, or Enter or leaving with nothing typed, closes it. */
function NewTaskInput({ onAdd, onClose }: { onAdd(title: string): void; onClose(): void }) {
  const [value, setValue] = useState("");
  const closed = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.scrollIntoView?.({ block: "nearest" });
  });

  function close() {
    if (closed.current) return;
    closed.current = true;
    onClose();
  }

  return (
    <input
      ref={inputRef}
      className="line__input"
      aria-label="New task"
      value={value}
      autoFocus
      onChange={(event) => setValue(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          const title = value.trim();
          if (!title) return close();
          onAdd(title);
          setValue("");
        } else if (event.key === "Escape") {
          event.preventDefault();
          close();
        }
      }}
      onBlur={() => {
        if (closed.current) return;
        const title = value.trim();
        if (title) onAdd(title);
        close();
      }}
    />
  );
}

/** The element's current inner height, kept up to date as it resizes. 0 where nothing is laid out. */
function useHeight<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!element) return;
    const measure = () => setHeight(element.getBoundingClientRect().height);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return [setElement, height] as const;
}
