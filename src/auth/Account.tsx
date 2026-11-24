import type { User } from "../backend/backend";
import { useBackend } from "../backend/BackendContext";
import { LogoMark } from "../board/icons";
import { SignIn } from "./SignIn";

/** The account page, at /account: who is signed in and Sign out, or Sign in when nobody is. */
export function Account({ user }: { user: User | null }) {
  const backend = useBackend();
  if (!user) return <SignIn />;

  return (
    <main className="sign-in">
      <LogoMark size={40} />
      <h1 className="sign-in__title">Munus Vitae</h1>
      <div className="account">
        <Avatar user={user} />
        <span className="account__name">{user.name}</span>
      </div>
      <button type="button" className="button button--accent" onClick={() => backend.signOut()}>
        Sign out
      </button>
      <a className="account__back" href="/">
        Back to the board
      </a>
    </main>
  );
}

function Avatar({ user }: { user: User }) {
  if (user.avatarUrl) {
    return <img className="avatar" src={user.avatarUrl} alt="" referrerPolicy="no-referrer" />;
  }
  return (
    <span className="avatar avatar--initial" aria-hidden="true">
      {user.name.charAt(0).toUpperCase()}
    </span>
  );
}
