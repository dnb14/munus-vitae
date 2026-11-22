import { useBackend } from "../backend/BackendContext";

export function SignIn() {
  const backend = useBackend();

  return (
    <main className="sign-in">
      <h1 className="sign-in__title">Munus Vitae</h1>
      <button type="button" className="button button--accent" onClick={() => backend.signInWithGoogle()}>
        Sign in with Google
      </button>
    </main>
  );
}
