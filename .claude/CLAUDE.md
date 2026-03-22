# Design Guide

- Always make sure that new UI elements are responsive to screen sizes. Especially for mobile and laptop.

# Branching & PRs

- Feature branches are cut from `dev`, named `feature/<issue-number>-short-description`
- PRs merge into `dev`; `master` is updated periodically in bulk

# Testing

- Run `npm run test:e2e` before pushing; all tests must pass
- Each feature PR should include a Playwright test for the new behaviour
- Playwright CI runs automatically against Vercel previews on every PR

# Tech Stack

- Next.js 15 App Router, Tailwind CSS, Prisma + MongoDB, Vercel hosting
- Images served from Vercel Blob storage

# Code Style

- 4-space indentation
- New components go in `src/components/` if reusable, or co-located in the route folder if page-specific
