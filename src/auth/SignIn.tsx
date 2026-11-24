import { useBackend } from "../backend/BackendContext";
import { LogoMark } from "../board/icons";

export function SignIn() {
  const backend = useBackend();

  return (
    <main className="sign-in">
      <LogoMark size={40} />
      <h1 className="sign-in__title">Munus Vitae</h1>
      <p className="sign-in__tagline">Your days and everything else, on ruled paper.</p>
      <button type="button" className="button button--accent" onClick={() => backend.signInWithGoogle()}>
        Sign in with Google
      </button>
    </main>
  );
}
