# CatAgree

**Card sorting workshops where the team writes the cards.**

A facilitated, async tool for content architecture. Participants don't just sort a list someone else wrote. They help build it. Admins drive the group through gated phases on the team's own schedule, and the workshop ends with a validated content map ready for stakeholders.

![CatAgree landing page](https://raw.githubusercontent.com/jp206100/CatAgree/4acaa7503c39333ba5693ec5b140239a4ce8ac62/public/blog-screenshots/hero-landing.png)

## Why CatAgree

Traditional card sorting tools are great at the mechanics (drag, drop, generate a dendrogram), but they treat the participant as a sorter. You learn the most from a team not by watching them sort a fixed list, but by seeing *what they think belongs on it at all*, and which items they argue over.

CatAgree is built around that.

- **Participants contribute, they don't just sort.** Cards and categories come from the team. Surface and converge on a shared vocabulary instead of testing one you've already written.
- **Async and phased by default.** Four gated phases run at the team's pace. No calendar Tetris. No ninety-minute Zoom marathons.
- **The admin is a facilitator, not an observer.** A dedicated cockpit gives the admin explicit control over when each phase opens and closes, because real workshops have a facilitator for a reason.
- **The output is a deliverable.** Workshops end with an exportable content map ready for stakeholders, not a CSV of co-occurrence scores you still have to interpret.

## A workshop, end to end

A CatAgree session moves through four gated phases. Each phase opens, collects input, and closes, either on a deadline you set or when you decide the group is ready to advance.

### A quiet dashboard for long-running work

A workshop in CatAgree is a long-running thing, measured in days or weeks rather than minutes. The dashboard is built around *which session needs me right now*, not a feed of every participant action.

![CatAgree dashboard](https://raw.githubusercontent.com/jp206100/CatAgree/4acaa7503c39333ba5693ec5b140239a4ce8ac62/public/blog-screenshots/body-dashboard.png)

### A cockpit for facilitating, not just monitoring

Once a workshop is in flight, the cockpit surfaces the current phase, who has contributed, what's still outstanding, and a single primary action, usually "close this phase and advance the group."

![CatAgree workshop cockpit](https://raw.githubusercontent.com/jp206100/CatAgree/4acaa7503c39333ba5693ec5b140239a4ce8ac62/public/blog-screenshots/body-workshop-cockpit.png)

## Status

CatAgree is being built in the open. Authentication, the dashboard shell, and the workshop cockpit are in place; participant-facing flows and export are next. Read [the first-look post](./blog-drafts/first-look-at-catagree.md) for the longer story behind the project.

## Built with

- [Next.js 16](https://nextjs.org) (App Router, React 19)
- [Convex](https://convex.dev) for the backend, database, and real-time sync
- [Convex Auth](https://labs.convex.dev/auth) for authentication
- [Tailwind CSS v4](https://tailwindcss.com) with Radix primitives
- TypeScript, ESLint, pnpm

## Running locally

Prerequisites: Node 20+, pnpm, and a Convex account.

```bash
pnpm install
npx convex dev      # provisions a Convex deployment and writes env vars
pnpm dev            # starts Next.js on http://localhost:3000
```

On first run, `npx convex dev` walks you through linking a Convex project and populates `.env.local` with `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL`. Keep it running in a second terminal alongside `pnpm dev` so schema and function changes hot-reload.

### Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Run the Next.js dev server |
| `pnpm build` | Deploy Convex functions and build the Next.js app |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint |

### Project layout

```
app/                Next.js App Router routes
  (auth)/           Sign-in and sign-up
  (protected)/      Authenticated routes (dashboard, workshops)
  api/auth/         Convex Auth route handler
components/         UI primitives and feature components
convex/             Schema, queries, mutations, auth config
lib/                Shared client utilities
middleware.ts       Auth-aware route protection
```

## License

MIT © 2026 Justin Parra. See [LICENSE](./LICENSE).
