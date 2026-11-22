/**
 * jsdom lays nothing out, so every element reports an all-zero rect. The drag
 * library moves things by keyboard using those rects, so tests need some
 * geometry. This fake places each element one step right of and below its
 * previous sibling, offset from its parent. Siblings therefore line up both
 * left-to-right and top-to-bottom in DOM order, and arrow keys move through
 * them in that order whichever way a list runs.
 */
const STEP = 100;

function fakeRect(element: Element): DOMRect {
  const parent = element.parentElement;
  const base = parent ? fakeRect(parent) : { left: 0, top: 0 };
  const index = parent ? Array.prototype.indexOf.call(parent.children, element) : 0;
  const left = base.left + index * STEP;
  const top = base.top + index * STEP;
  return DOMRect.fromRect({ x: left, y: top, width: STEP, height: STEP });
}

export function installFakeLayout() {
  Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return fakeRect(this);
  };
}
