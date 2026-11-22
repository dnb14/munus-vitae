import { generateKeyBetween } from "fractional-indexing";
import { useCallback, useEffect, useState } from "react";
import { byPosition, type Category } from "../backend/backend";
import { useBackend } from "../backend/BackendContext";
import type { SaveFailures } from "./useSaveFailures";

/**
 * Loads the user's Categories in order and saves changes. Changes show
 * immediately; when the Backend rejects one, `failures` counts it and this
 * reloads what is really saved.
 */
export function useCategories({ count: failureCount, watch }: SaveFailures) {
  const backend = useBackend();
  const [categories, setCategories] = useState<Category[] | null>(null);

  useEffect(() => {
    let active = true;
    backend.getCategories().then((loaded) => {
      if (active) setCategories(loaded);
    });
    return () => {
      active = false;
    };
  }, [backend, failureCount]);

  // Merge saved changes from every device, this one included.
  useEffect(
    () =>
      backend.subscribeToChanges((change) => {
        if (change.kind === "categorySaved") {
          const { category } = change;
          setCategories(
            (current) => current && [...current.filter((c) => c.id !== category.id), category].sort(byPosition),
          );
        } else if (change.kind === "categoryDeleted") {
          setCategories((current) => current && current.filter((c) => c.id !== change.id));
        }
      }),
    [backend],
  );

  const createCategory = useCallback(
    (name: string) => {
      if (!categories) return;
      const last = categories[categories.length - 1];
      const category: Category = {
        id: crypto.randomUUID(),
        name,
        position: generateKeyBetween(last?.position ?? null, null),
      };
      setCategories([...categories, category]);
      watch(backend.createCategory(category));
    },
    [backend, watch, categories],
  );

  const renameCategory = useCallback(
    (id: string, name: string) => {
      setCategories((current) => current && current.map((c) => (c.id === id ? { ...c, name } : c)));
      watch(backend.renameCategory(id, name));
    },
    [backend, watch],
  );

  /** Deletes a Category; the Backend deletes its Tasks with it. Confirming is the caller's job. */
  const deleteCategory = useCallback(
    (id: string) => {
      setCategories((current) => current && current.filter((c) => c.id !== id));
      watch(backend.deleteCategory(id));
    },
    [backend, watch],
  );

  /** Moves a Category to `toIndex` in the order. Only the moved Category gets a new position. */
  const moveCategory = useCallback(
    (id: string, toIndex: number) => {
      if (!categories) return;
      const others = categories.filter((c) => c.id !== id);
      const moved = categories.find((c) => c.id === id);
      if (!moved || categories[toIndex]?.id === id) return;
      const position = generateKeyBetween(others[toIndex - 1]?.position ?? null, others[toIndex]?.position ?? null);
      const updated = { ...moved, position };
      setCategories([...others.slice(0, toIndex), updated, ...others.slice(toIndex)]);
      watch(backend.moveCategory(id, position));
    },
    [backend, watch, categories],
  );

  return { categories, createCategory, renameCategory, deleteCategory, moveCategory };
}
