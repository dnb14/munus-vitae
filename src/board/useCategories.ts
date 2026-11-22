import { generateKeyBetween } from "fractional-indexing";
import { useCallback, useEffect, useState } from "react";
import type { Category } from "../backend/backend";
import { useBackend } from "../backend/BackendContext";

/**
 * Loads the user's Categories in order and saves changes. Changes show
 * immediately; handling a failed save comes with ticket 09.
 */
export function useCategories() {
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
  }, [backend]);

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
      void backend.createCategory(category);
    },
    [backend, categories],
  );

  const renameCategory = useCallback(
    (id: string, name: string) => {
      setCategories((current) => current && current.map((c) => (c.id === id ? { ...c, name } : c)));
      void backend.renameCategory(id, name);
    },
    [backend],
  );

  /** Deletes straight away. The confirmation for Categories with Tasks comes in ticket 05. */
  const deleteCategory = useCallback(
    (id: string) => {
      setCategories((current) => current && current.filter((c) => c.id !== id));
      void backend.deleteCategory(id);
    },
    [backend],
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
      void backend.moveCategory(id, position);
    },
    [backend, categories],
  );

  return { categories, createCategory, renameCategory, deleteCategory, moveCategory };
}
