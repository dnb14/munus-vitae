# React + Vite frontend, Supabase backend, hosted on Vercel

Munus Vitae is a single-user web app that needs Google sign-in, sync across devices and live updates between open tabs, but doesn't need to work offline. We chose a React + TypeScript single-page app built with Vite and hosted on Vercel, with Supabase (hosted Postgres, Google OAuth, Realtime) as the whole backend, so there's no custom server. Firebase was the main alternative. We preferred Supabase for its relational data model and SQL access. The backend is the part that would be costly to swap later.
