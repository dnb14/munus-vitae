import { KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

/**
 * The drag sensors every sortable list on the board uses: mouse/touch via
 * pointer events, and keyboard (focus a drag handle, Space to pick up, arrows
 * to move, Space to drop, Escape to cancel).
 */
export function useDragSensors() {
  return useSensors(
    // A small distance before a drag starts, so a plain click on a handle stays a click.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}
