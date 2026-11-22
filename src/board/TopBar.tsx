import type { User } from "../backend/backend";
import { useBackend } from "../backend/BackendContext";

export function TopBar({ user }: { user: User }) {
  const backend = useBackend();

  return (
    <header className="top-bar">
      <div className="top-bar__spacer" />
      <Avatar user={user} />
      <button type="button" className="button button--quiet" onClick={() => backend.signOut()}>
        Sign out
      </button>
    </header>
  );
}

function Avatar({ user }: { user: User }) {
  if (user.avatarUrl) {
    return <img className="avatar" src={user.avatarUrl} alt={user.name} referrerPolicy="no-referrer" />;
  }
  return (
    <span className="avatar avatar--initial" role="img" aria-label={user.name}>
      {user.name.charAt(0).toUpperCase()}
    </span>
  );
}
