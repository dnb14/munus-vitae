import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "./icons";

type Props = {
  categoryName: string;
  onClearDone(): void;
  onDelete(): void;
};

/** The ⋯ menu on a Category header. Escape or a click elsewhere closes it. */
export function CategoryMenu({ categoryName, onClearDone, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    firstItemRef.current?.focus();

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="category-menu" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        className="button button--quiet button--icon"
        aria-label={`More actions for ${categoryName}`}
        title="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <MoreVertical />
      </button>
      {open && (
        <div className="category-menu__items" role="menu" aria-label={`Actions for ${categoryName}`}>
          <button
            ref={firstItemRef}
            type="button"
            role="menuitem"
            className="category-menu__item"
            onClick={() => {
              setOpen(false);
              onClearDone();
            }}
          >
            Clear done
          </button>
          <button
            type="button"
            role="menuitem"
            className="category-menu__item"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
