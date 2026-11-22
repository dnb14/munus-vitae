import type { User } from "../backend/backend";
import { TopBar } from "./TopBar";

/** The signed-in page: the top bar, the Day row (60%) and the Category row (40%). */
export function Board({ user }: { user: User }) {
  return (
    <div className="board">
      <TopBar user={user} />
      <section className="day-row" aria-label="Day row" />
      <section className="category-row" aria-label="Category row" />
    </div>
  );
}
