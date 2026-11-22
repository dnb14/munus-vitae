# 01: Walking skeleton

**What to build:** The smallest app that runs end to end against the in-memory backend. Signed out, I see a sign-in screen. After signing in (simulated by the in-memory backend), I see the page: a really slim top bar with my avatar and a Sign out button, and below it an empty Day row taking 60% of the height and an empty Category row taking 40%. Signing out returns me to the sign-in screen. This ticket sets up the project (Vite + React + TypeScript), the test setup (Vitest + Testing Library + jsdom), the **Backend** interface with its **in-memory backend**, and the first app-level test, which sets the pattern every later ticket follows (see the spec's Testing Decisions).

**Blocked by:** None (can start immediately).

**Status:** done

- [x] The app builds and runs locally with one dev command; tests run with one test command
- [x] A Backend interface exists for sign-in session state (current user, sign in, sign out); the in-memory backend implements it, and the app only reaches data through this interface
- [x] Signed out: a sign-in screen with a "Sign in with Google" button
- [x] Signed in: a really slim top bar with avatar and Sign out, a Day row region (60% of the height below the bar) and a Category row region (40%)
- [x] Sign out returns to the sign-in screen
- [x] An app-level test renders the whole app against the in-memory backend, signs in, checks the page, signs out, and checks the sign-in screen, finding elements by role, label and text only
- [x] The accent colour #FD8A8A is defined once as a theme value (light and dark) for later tickets to use
