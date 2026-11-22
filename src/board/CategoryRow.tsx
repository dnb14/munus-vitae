import { closestCenter, DndContext, type Announcements, type DragEndEvent } from "@dnd-kit/core";
import { horizontalListSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import type { Category, Task } from "../backend/backend";
import { categoryTaskCount, columnContents } from "./boardModel";
import { CategoryMenu } from "./CategoryMenu";
import { ConfirmDialog } from "./ConfirmDialog";
import { useDragSensors } from "./dragAndDrop";
import { NameInput } from "./NameInput";
import { TaskLines } from "./TaskLines";
import { useCategories } from "./useCategories";

type Props = {
  tasks: Task[];
  onAddTask(categoryId: string, title: string): void;
  onSetDone(taskId: string, done: boolean): void;
  onClearDone(categoryId: string): void;
  /** Called after a Category is deleted, so its Tasks leave the screen too. */
  onCategoryDeleted(categoryId: string): void;
};

/** The Category row: one column per Category, in order, then "+ Add category". */
export function CategoryRow({ tasks, onAddTask, onSetDone, onClearDone, onCategoryDeleted }: Props) {
  const { categories, createCategory, renameCategory, deleteCategory, moveCategory } = useCategories();
  const sensors = useDragSensors();
  // The Category waiting for "Delete <name> and its N tasks?" to be answered.
  const [confirmingDelete, setConfirmingDelete] = useState<Category | null>(null);
  if (!categories) return null;

  function deleteNow(id: string) {
    deleteCategory(id);
    onCategoryDeleted(id);
  }

  function requestDelete(category: Category) {
    if (categoryTaskCount(tasks, category.id) === 0) deleteNow(category.id);
    else setConfirmingDelete(category);
  }

  const nameOf = (id: string | number) => categories.find((c) => c.id === id)?.name ?? "Category";
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${nameOf(active.id)} is over ${nameOf(over.id)}.` : `${nameOf(active.id)} is not over a Category.`,
    onDragEnd: ({ active, over }) =>
      over ? `Dropped ${nameOf(active.id)} at ${nameOf(over.id)}.` : `Dropped ${nameOf(active.id)}.`,
    onDragCancel: ({ active }) => `Cancelled moving ${nameOf(active.id)}.`,
  };

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id || !categories) return;
    const toIndex = categories.findIndex((c) => c.id === over.id);
    moveCategory(String(active.id), toIndex);
  }

  return (
    <div className="category-row__columns">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        accessibility={{ announcements }}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={categories.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
          {categories.map((category) => (
            <CategoryColumn
              key={category.id}
              category={category}
              tasks={tasks}
              onAddTask={(title) => onAddTask(category.id, title)}
              onSetDone={onSetDone}
              onClearDone={() => onClearDone(category.id)}
              onRename={(name) => renameCategory(category.id, name)}
              onDelete={() => requestDelete(category)}
            />
          ))}
        </SortableContext>
      </DndContext>
      <AddCategoryColumn onCreate={createCategory} />
      {confirmingDelete && (
        <ConfirmDialog
          question={deleteQuestion(confirmingDelete.name, categoryTaskCount(tasks, confirmingDelete.id))}
          confirmLabel="Delete"
          onConfirm={() => {
            setConfirmingDelete(null);
            deleteNow(confirmingDelete.id);
          }}
          onCancel={() => setConfirmingDelete(null)}
        />
      )}
    </div>
  );
}

function deleteQuestion(name: string, taskCount: number): string {
  return `Delete ${name} and its ${taskCount} ${taskCount === 1 ? "task" : "tasks"}?`;
}

type ColumnProps = {
  category: Category;
  tasks: Task[];
  onAddTask(title: string): void;
  onSetDone(taskId: string, done: boolean): void;
  onClearDone(): void;
  onRename(name: string): void;
  onDelete(): void;
};

function CategoryColumn({ category, tasks, onAddTask, onSetDone, onClearDone, onRename, onDelete }: ColumnProps) {
  const place = { categoryId: category.id };
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });
  const [renaming, setRenaming] = useState(false);

  return (
    <div
      ref={setNodeRef}
      className={["category-column", isDragging && "category-column--dragging"].filter(Boolean).join(" ")}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      role="group"
      aria-label={category.name}
    >
      <div className="category-column__header">
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="button button--quiet button--icon category-column__handle"
          {...attributes}
          {...listeners}
          aria-label={`Move ${category.name}`}
          title="Drag to reorder"
        >
          <span aria-hidden="true">⠿</span>
        </button>
        {renaming ? (
          <NameInput
            label="Category name"
            initialValue={category.name}
            onSave={(name) => {
              setRenaming(false);
              if (name !== category.name) onRename(name);
            }}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <h2 className="category-column__title">
            <button type="button" className="category-column__name" title="Rename" onClick={() => setRenaming(true)}>
              {category.name}
            </button>
          </h2>
        )}
        <CategoryMenu categoryName={category.name} onClearDone={onClearDone} onDelete={onDelete} />
      </div>
      <TaskLines contents={columnContents(tasks, place)} onAdd={onAddTask} onSetDone={onSetDone} />
    </div>
  );
}

function AddCategoryColumn({ onCreate }: { onCreate(name: string): void }) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="category-column category-column--add">
      {adding ? (
        <div className="category-column__header">
          <NameInput
            label="New category name"
            onSave={(name) => {
              setAdding(false);
              onCreate(name);
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      ) : (
        <button type="button" className="button button--quiet category-column__add" onClick={() => setAdding(true)}>
          + Add category
        </button>
      )}
    </div>
  );
}
