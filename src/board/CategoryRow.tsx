import { closestCenter, DndContext, type Announcements, type DragEndEvent } from "@dnd-kit/core";
import { horizontalListSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import type { Category } from "../backend/backend";
import { CategoryMenu } from "./CategoryMenu";
import { useDragSensors } from "./dragAndDrop";
import { NameInput } from "./NameInput";
import { useCategories } from "./useCategories";

/** The Category row: one column per Category, in order, then "+ Add category". */
export function CategoryRow() {
  const { categories, createCategory, renameCategory, deleteCategory, moveCategory } = useCategories();
  const sensors = useDragSensors();
  if (!categories) return null;

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
              onRename={(name) => renameCategory(category.id, name)}
              onDelete={() => deleteCategory(category.id)}
            />
          ))}
        </SortableContext>
      </DndContext>
      <AddCategoryColumn onCreate={createCategory} />
    </div>
  );
}

type ColumnProps = {
  category: Category;
  onRename(name: string): void;
  onDelete(): void;
};

function CategoryColumn({ category, onRename, onDelete }: ColumnProps) {
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
        <CategoryMenu categoryName={category.name} onDelete={onDelete} />
      </div>
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
