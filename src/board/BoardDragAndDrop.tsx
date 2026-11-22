import {
  closestCenter,
  DndContext,
  DragOverlay,
  pointerWithin,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { useCallback, useRef, useState, type ReactNode } from "react";
import type { Category, Task } from "../backend/backend";
import {
  keyboardStart,
  keyboardStep,
  keyboardTarget,
  type DropTarget,
  type KeyboardDrop,
  type Place,
} from "./boardModel";
import { dayColumnFullLabel } from "./dates";
import { isArrowKey, useDragSensors } from "./dragAndDrop";

/** What each draggable or droppable on the board is, carried in its dnd-kit `data`. */
export type DragData = { type: "task" } | { type: "category" } | { type: "column"; place: Place };

/** The droppable id of a column's body, which takes Tasks dropped on its empty space. */
export function columnDropId(place: Place): string {
  return "day" in place ? `column:day:${place.day}` : `column:category:${place.categoryId}`;
}

type Props = {
  tasks: Task[];
  categories: Category[];
  /** Every column showing, in reading order: the Day columns, then the Categories. */
  places: Place[];
  onMoveTask(taskId: string, target: DropTarget): void;
  onMoveCategory(id: string, toIndex: number): void;
  children: ReactNode;
};

/** Where an arrow key has taken the item picked up by keyboard. */
type KeyboardDrag =
  { type: "task"; taskId: string; drop: KeyboardDrop } | { type: "category"; id: string; index: number };

/**
 * The one drag-and-drop context for the whole board, so Tasks can move
 * between the Day row and the Category row and Categories can be reordered.
 * Dragging with a pointer finds the drop target from where the pointer is.
 * Dragging with the keyboard walks the drop targets in a fixed order instead
 * (see `keyboardStep`), so it never depends on how the page is laid out.
 */
export function BoardDragAndDrop({ tasks, categories, places, onMoveTask, onMoveCategory, children }: Props) {
  const board = useRef({ tasks, categories, places });
  board.current = { tasks, categories, places };
  const keyboardDrag = useRef<KeyboardDrag | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const keyboardTargetId = useCallback((drag: KeyboardDrag): UniqueIdentifier | null => {
    const { tasks, categories, places } = board.current;
    if (drag.type === "category") return categories[drag.index]?.id ?? null;
    const target = keyboardTarget(tasks, drag.taskId, places[drag.drop.placeIndex], drag.drop.index);
    return "taskId" in target ? target.taskId : columnDropId(target.place);
  }, []);

  const coordinateGetter: KeyboardCoordinateGetter = useCallback(
    (event, { context, currentCoordinates }) => {
      const drag = keyboardDrag.current;
      if (!drag || !isArrowKey(event.code)) return undefined;
      event.preventDefault();
      const { tasks, categories, places } = board.current;
      if (drag.type === "task") {
        drag.drop = keyboardStep(tasks, drag.taskId, places, drag.drop, event.code);
      } else if (event.code === "ArrowLeft" || event.code === "ArrowRight") {
        const index = drag.index + (event.code === "ArrowLeft" ? -1 : 1);
        drag.index = Math.min(Math.max(index, 0), categories.length - 1);
      }
      const id = keyboardTargetId(drag);
      const rect = id === null ? undefined : context.droppableRects.get(id);
      // The target is fixed by the walk above; moving there only shows it.
      return rect ? { x: rect.left, y: rect.top } : { ...currentCoordinates };
    },
    [keyboardTargetId],
  );
  const sensors = useDragSensors(coordinateGetter);

  const collisionDetection: CollisionDetection = useCallback(
    (args) => {
      const drag = keyboardDrag.current;
      if (drag) {
        const id = keyboardTargetId(drag);
        return id === null ? [] : [{ id }];
      }
      const draggingType = typeOf(args.active.data.current);
      const containers = args.droppableContainers.filter((container) => {
        const type = typeOf(container.data.current);
        return draggingType === "category" ? type === "category" : type === "task" || type === "column";
      });
      if (draggingType === "category") return closestCenter({ ...args, droppableContainers: containers });
      const under = pointerWithin({ ...args, droppableContainers: containers });
      if (under.length > 0) {
        // The pointer is over a column's body and maybe a Task in it: the Task wins.
        const overTask = under.filter(
          (collision) => typeOf(collision.data?.droppableContainer?.data.current) === "task",
        );
        return overTask.length > 0 ? overTask : under;
      }
      return closestCenter({ ...args, droppableContainers: containers });
    },
    [keyboardTargetId],
  );

  function onDragStart({ active, activatorEvent }: DragStartEvent) {
    const type = typeOf(active.data.current);
    const id = String(active.id);
    if (type === "task") setDraggingTaskId(id);
    keyboardDrag.current = null;
    if (!(activatorEvent instanceof KeyboardEvent)) return;
    const { tasks, categories, places } = board.current;
    if (type === "task") {
      const drop = keyboardStart(tasks, id, places);
      if (drop) keyboardDrag.current = { type: "task", taskId: id, drop };
    } else if (type === "category") {
      keyboardDrag.current = {
        type: "category",
        id,
        index: categories.findIndex((c) => c.id === id),
      };
    }
  }

  function finish() {
    keyboardDrag.current = null;
    setDraggingTaskId(null);
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    finish();
    if (!over) return;
    const type = typeOf(active.data.current);
    const overData = over.data.current as DragData | undefined;
    if (type === "task") {
      if (overData?.type === "task") onMoveTask(String(active.id), { taskId: String(over.id) });
      else if (overData?.type === "column") onMoveTask(String(active.id), { place: overData.place });
    } else if (type === "category" && overData?.type === "category" && active.id !== over.id) {
      onMoveCategory(
        String(active.id),
        board.current.categories.findIndex((c) => c.id === over.id),
      );
    }
  }

  const announcements = useAnnouncements(tasks, categories);
  const draggingTask = tasks.find((task) => task.id === draggingTaskId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      accessibility={{ announcements }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={finish}
    >
      {children}
      {/* Mounted only while a Task is dragged, so dragging a Category still moves the column itself. */}
      {draggingTask && (
        <DragOverlay dropAnimation={null}>
          <div className="line task-line task-line--overlay" aria-hidden="true">
            {draggingTask.title}
          </div>
        </DragOverlay>
      )}
    </DndContext>
  );
}

function typeOf(data: unknown): DragData["type"] | undefined {
  return (data as DragData | undefined)?.type;
}

/** What screen readers hear while something is dragged. */
function useAnnouncements(tasks: Task[], categories: Category[]): Announcements {
  function nameOf(id: UniqueIdentifier, data: unknown): string {
    const d = data as DragData | undefined;
    if (d?.type === "column") {
      return "day" in d.place
        ? dayColumnFullLabel(d.place.day)
        : (categories.find((c) => c.id === (d.place as { categoryId: string }).categoryId)?.name ?? "Category");
    }
    if (d?.type === "category") return categories.find((c) => c.id === id)?.name ?? "Category";
    return tasks.find((t) => t.id === id)?.title ?? "Task";
  }
  return {
    onDragStart: ({ active }) => `Picked up ${nameOf(active.id, active.data.current)}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${nameOf(active.id, active.data.current)} is over ${nameOf(over.id, over.data.current)}.`
        : `${nameOf(active.id, active.data.current)} is not over a drop target.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `Dropped ${nameOf(active.id, active.data.current)} at ${nameOf(over.id, over.data.current)}.`
        : `Dropped ${nameOf(active.id, active.data.current)}.`,
    onDragCancel: ({ active }) => `Cancelled moving ${nameOf(active.id, active.data.current)}.`,
  };
}
