import { KeyboardSensor, PointerSensor, useSensor, useSensors, type KeyboardCoordinateGetter } from "@dnd-kit/core";

/**
 * The drag sensors the board uses: mouse/touch via pointer events, and
 * keyboard (focus a drag handle, Space to pick up, arrows to move, Space to
 * drop, Escape to cancel). Where the arrow keys go is up to `coordinateGetter`.
 */
export function useDragSensors(coordinateGetter: KeyboardCoordinateGetter) {
  return useSensors(
    // A small distance before a drag starts, so a plain click stays a click.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter }),
  );
}

export type ArrowKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";

export function isArrowKey(code: string): code is ArrowKey {
  return code === "ArrowUp" || code === "ArrowDown" || code === "ArrowLeft" || code === "ArrowRight";
}
