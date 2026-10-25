# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Bridge of Hearts** is a public directory of children's homes (Child Development Centres) in Sri Lanka. There are currently around 370 such homes in the country, so the database will never grow much beyond that.

# Commands

```bash
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run test:e2e     # Run Playwright tests (headless)
npm run test:e2e:ui  # Run Playwright tests with interactive UI
npm run test:unit    # Run Vitest unit tests
npm run test:unit:watch  # Run Vitest unit tests in watch mode

# Run a single test file
npx playwright test tests/e2e/smoke.spec.ts
npx vitest run tests/unit/utils/maps.test.ts

# Sync facilities from a Google Sheet tab to the database
npx tsx scripts/syncFacilities.ts "Central Province"

# Regenerate Prisma client after schema changes
npx prisma generate
```

# Tech Stack

Next.js 15 App Router, Tailwind CSS, Prisma + MongoDB, Vercel hosting. Images served from Vercel Blob storage.

# Architecture

## Routes

- `/` — Homepage
- `/directory` — Searchable, paginated facility listing (filtered via URL search params)
- `/facility/[slug]` — Individual facility detail page with image carousel
- `/facility/new` and `/facility/edit/[slug]` — Admin: add/edit a facility
- `/admin` — Admin dashboard (requires NextAuth session); `/admin/login` — login page

## Data Flow

Facility data originates in a Google Sheet (the **Database sheet**) with one tab per province:
https://docs.google.com/spreadsheets/d/1JQdRIicCh6qPrdpfmJpKRxEiv_-qjTcURbqniMucSbo/edit?gid=305897832#gid=305897832

`scripts/syncFacilities.ts` reads a named sheet tab via the Google Sheets API, downloads photos, upserts records into MongoDB via Prisma, and uploads images to Vercel Blob. Run it once per province tab. Credentials are in `scripts/google-api-key.json` (not committed) and the sheet ID is in `scripts/config.json`.

All runtime DB reads/writes go through server actions in `src/app/actions/data.ts` (`fetchAllFacilities`, `fetchFacilityBySlug`, `fetchDistinctCities`, `updateFacility`, `addFacility`).

## Key Files

- `src/utils/defines.ts` — Types (`ChildCareFacilityInput`, `DirectoryFilterType`), geographic constants (`DistrictsList`, `ProvincesList`, `ProvinceToDistrict`), and defaults
- `src/utils/db.ts` — Singleton Prisma client (dev-safe via global var)
- `src/lib/auth.ts` — NextAuth credentials config; admin credentials from `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars; session lasts 6 hours. Use `getServerAuth()` as the standard guard in server components/actions — returns the session if admin, `null` otherwise.
- `prisma/schema.prisma` — `ChildCareFacility` model with embedded `Location`, `Contact`, `Occupancy`, `AgeRanges`, and `PhotoEntry` types

## Directory Page Pattern

`/directory` is driven entirely by URL search params (`name`, `city`, `managedBy`, `district`, `province`, `sortBy`, `page`, `itemsPerPage`). `FilterCard` writes to the URL; `FacilityCards` (Server Component) reads from it and fetches data. Pagination and sorting follow the same pattern.

# Branching & PRs

- Feature branches are cut from `dev`. Always name them `feature/<issue-number>-<hyphenated-issue-summary>`, where the summary is at most 5 lowercase words, e.g. `feature/36-directory-map-widget`
- This naming rule overrides any session-assigned branch (e.g. the `ccr-<id>` branch a Claude Code cloud session starts on). Create the `feature/...` branch from `dev` before the first push, and never push work to the `ccr-*` branch
- PRs merge into `dev`; `master` is updated periodically in bulk
- When a PR that closes an issue merges into `dev`, close that issue right away. GitHub only auto-closes issues on merges to the default branch
- After pushing commits to a branch, give the user the branch's Vercel preview link. Take it from the Vercel bot's comment on the PR (the "Preview" link) rather than building it by hand, since Vercel shortens long branch names (e.g. `https://boh-web-git-feature-36-di-17d93d-bridge-of-hearts-orgs-projects.vercel.app`)
- After pushing to a PR, run reviewer iterations before reporting the work as done:
  1. Spawn a reviewer subagent with the issue context. It reviews the full branch diff (`git diff origin/dev...HEAD`) against this file's conventions and reports concrete findings with file:line and severity, or exactly "NO ISSUES FOUND". It must not edit, commit, push, or post to GitHub
  2. Verify each finding against the code. Fix the real ones, run `npx tsc --noEmit` and Prettier, then commit and push
  3. Send the same reviewer the new commit to re-review, and repeat until it reports no issues. Every commit pushed to the PR, including test-only fixes, goes through at least one review round
  4. Tell the user how many rounds ran and what was fixed
- Always apply a label when creating issues via `gh issue create --label <label>`; available labels: `bug`, `enhancement`, `documentation`, `duplicate`, `good first issue`, `help wanted`, `invalid`, `question`, `wontfix`

# Testing

- Run `npm run test:unit` and `npm run test:e2e` before pushing; all tests must pass
- Each feature PR should include a Playwright test for the new behaviour, and unit tests for any new logic (helpers, server actions)
- Playwright CI runs automatically against Vercel previews on every PR; unit test CI runs on every PR without a preview
- Unit tests live in `tests/unit/` (mirroring the source paths without the leading `src/`, e.g. `tests/unit/app/actions/data.test.ts`) and Playwright tests in `tests/e2e/`. Keep testable logic in plain modules (e.g. `src/utils/`), not inside components, so it can be unit tested
- Server action tests mock `@/utils/db` (Prisma) and `@/lib/auth` (`getServerAuth`); see `tests/unit/app/actions/data.test.ts`
- A test for a known, still-open bug is written for the correct behaviour and marked `it.fails`, with a comment naming the issue. Once the bug is fixed the test starts failing, which is the reminder to change it to `it`

# Code Style

- 4-space indentation
- New components go in `src/components/` if reusable, or co-located in the route folder if page-specific
- Use curly brackets even for single line blocks, and always add the block contents in a new line
- New UI elements must be responsive — design for mobile and laptop screen sizes
