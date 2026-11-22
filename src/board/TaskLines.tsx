import { useEffect, useRef, useState } from "react";
import type { Task } from "../backend/backend";
import { emptyLineCount } from "./boardModel";

type Props = {
  /** The column's contents from the Board model. A new Task snaps in after the unfinished ones. */
  contents: { unfinished: Task[]; done: Task[] };
  onAdd(title: string): void;
};

/**
 * A column's body, ruled into Lines like notebook paper. Tasks fill Lines from
 * the top; clicking any empty Line opens an input on the Line a new Task
 * snaps to. The column scrolls when full, always keeping one empty Line.
 */
export function TaskLines({ contents: { unfinished, done }, onAdd }: Props) {
  const [adding, setAdding] = useState(false);
  const [containerRef, height] = useHeight<HTMLDivElement>();

  const emptyLines = emptyLineCount(height, unfinished.length + done.length, adding);

  return (
    <div className="lines" ref={containerRef}>
      <ol className="lines__tasks">
        {unfinished.map((task) => (
          <TaskLine key={task.id} task={task} />
        ))}
        {adding && (
          <li className="line" role="presentation">
            <NewTaskInput onAdd={onAdd} onClose={() => setAdding(false)} />
          </li>
        )}
        {done.map((task) => (
          <TaskLine key={task.id} task={task} />
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

function TaskLine({ task }: { task: Task }) {
  return <li className="line task-line">{task.title}</li>;
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
