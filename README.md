# Friendsgiving 2026

A standalone invitation and shared RSVP planner for dinner with friends. Built with React, TypeScript, Tailwind CSS, Vite, and Supabase. The date and location are decided by the group.

## Local development

Use Node 24. Run `npm ci`, then `npm run dev`. Run `npm run build` to type-check and build the static site.

## Connect an RSVP database

1. Use a dedicated Supabase project. Run [supabase/schema.sql](supabase/schema.sql) once in its SQL Editor with the Data API and Realtime enabled.
2. Copy `.env.example` to `.env.local` and enter the project URL and browser-safe **publishable** key. Restart the dev server.
3. For GitHub Pages, set the same values as repository Actions **variables** and rerun the GitHub Pages workflow. The site is built into `dist` and deployed by GitHub Actions.

Without these values the invitation and planner remain available for preview. The RSVP submit button stays disabled and the results explain that the database is pending.

## Data and editing

The public response table stores one atomic ballot per normalized name with one stable guest color. Dates are deduplicated and constrained to December 1–15. The read-only public results update through Supabase Realtime, with a 15-second polling fallback.

The private schema stores an edit-token hash separate from public results. A participant's edit URL uses a fragment so the bearer token is omitted from ordinary navigation requests. Save your private edit link to edit on another device. Updates require that token and the latest revision to avoid overwriting another edit. The session draft only preserves unfinished inputs in the current tab.

The invitation and shared answers are readable by anyone with the site URL, as requested for the group dashboard. The site asks search engines to skip indexing.
