import { horizontalListSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import type { Category, Task } from "../backend/backend";
import type { DragData } from "./BoardDragAndDrop";
import { categoryTaskCount, columnContents } from "./boardModel";
import { CategoryMenu } from "./CategoryMenu";
import { ConfirmDialog } from "./ConfirmDialog";
import { NameInput } from "./NameInput";
import { TaskLines, type TaskLineActions } from "./TaskLines";

type Props = {
  categories: Category[];
  onCreateCategory(name: string): void;
  onRenameCategory(id: string, name: string): void;
  onDeleteCategory(id: string): void;
  tasks: Task[];
  onAddTask(categoryId: string, title: string): void;
  taskActions: TaskLineActions;
  onClearDone(categoryId: string): void;
  /** Called after a Category is deleted, so its Tasks leave the screen too. */
  onCategoryDeleted(categoryId: string): void;
};

/**
 * The Category row: one column per Category, in order, then "+ Add category".
 * Categories are dragged by their header handle, within the Board's drag context.
 */
export function CategoryRow({
  categories,
  onCreateCategory,
  onRenameCategory,
  onDeleteCategory,
  tasks,
  onAddTask,
  taskActions,
  onClearDone,
  onCategoryDeleted,
}: Props) {
  // The Category waiting for "Delete <name> and its N tasks?" to be answered.
  const [confirmingDelete, setConfirmingDelete] = useState<Category | null>(null);

  function deleteNow(id: string) {
    onDeleteCategory(id);
    onCategoryDeleted(id);
  }

  function requestDelete(category: Category) {
    if (categoryTaskCount(tasks, category.id) === 0) deleteNow(category.id);
    else setConfirmingDelete(category);
  }

  return (
    <div className="category-row__columns">
      <SortableContext items={categories.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
        {categories.map((category) => (
          <CategoryColumn
            key={category.id}
            category={category}
            tasks={tasks}
            onAddTask={(title) => onAddTask(category.id, title)}
            taskActions={taskActions}
            onClearDone={() => onClearDone(category.id)}
            onRename={(name) => onRenameCategory(category.id, name)}
            onDelete={() => requestDelete(category)}
          />
        ))}
      </SortableContext>
      <AddCategoryColumn onCreate={onCreateCategory} />
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
  taskActions: TaskLineActions;
  onClearDone(): void;
  onRename(name: string): void;
  onDelete(): void;
};

function CategoryColumn({ category, tasks, onAddTask, taskActions, onClearDone, onRename, onDelete }: ColumnProps) {
  const place = { categoryId: category.id };
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
    data: { type: "category" } satisfies DragData,
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
      <TaskLines place={place} contents={columnContents(tasks, place)} onAdd={onAddTask} taskActions={taskActions} />
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
