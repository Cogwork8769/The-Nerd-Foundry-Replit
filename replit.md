# The Nerd Foundry

The Nerd Foundry is a welcoming home for nerdy hobbies and communities, with a public landing page and auth-ready member workspace. The first active hobby suites are Cubing, D&D, and Magic: The Gathering.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/the-nerd-foundry/src/App.tsx` — public landing page, Clerk auth routes, member dashboard, hobby routes, and settings shell
- `artifacts/the-nerd-foundry/src/modules/cubing.tsx` — Cubing timer, sessions, solves, statistics, practice, profile, cube collection, and attended competition logbook
- `artifacts/the-nerd-foundry/src/modules/dnd.tsx` — Character Forge, Campaign Forge, World Forge, and DM Kit
- `artifacts/the-nerd-foundry/src/modules/mtg.tsx` — Deck Forge, Collection Forge, Playtest Lab, and Custom Card Forge
- `artifacts/the-nerd-foundry/src/index.css` — shared palette, typography, grid textures, and motion
- `artifacts/the-nerd-foundry/public/logo.svg` — branded auth and app mark
- `artifacts/api-server/src/app.ts` — shared Express server and Clerk middleware/proxy wiring
- `.local/skills/clerk-auth/references/setup-and-customization.md` — auth integration source of truth

## Architecture decisions

- Clerk owns authentication and browser sessions; no local password or token implementation is used.
- The base route remains a public landing page for signed-out visitors and routes authenticated members to the dashboard.
- The first release focuses on the brand and account foundation; hobby tools, communities, and field notes remain intentionally future surfaces.
- Cubing, D&D, and Magic: The Gathering are the first functional hobby modules. Their first-version records persist in member-scoped browser localStorage while the broader platform data model is still being shaped.
- Games & Systems and Make & Create are intentionally deferred and should not be added to active module navigation until explicitly requested.

## Product

- Responsive public landing page for The Nerd Foundry
- Branded Clerk sign-in and sign-up flows
- Authenticated member dashboard with onboarding and product horizon
- Functional Cubing, D&D, and Magic: The Gathering hobby workbenches
- Account settings through the embedded Clerk profile surface

## User preferences

No additional preferences recorded.

## Gotchas

- The frontend and API workflows are managed artifacts; restart the exact managed workflows after auth or toolchain changes.
- The API server must mount the Clerk proxy before body parsers for production custom-domain support.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
