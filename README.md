# Outbreak Investigation Simulator

Practice field epidemiology on fictional outbreaks: confirm the outbreak, set a case definition, read the epidemic curve, interpret a real case-control odds-ratio table, choose control measures, and write the report.

**Live demo:** https://outbreak-investigation-simulator.randomthingsonlineatsk.workers.dev (Cloudflare Workers)

> This is a fictional, educational demonstration. All outbreaks, people and data are made up. Do not use it for real patient data, clinical decisions or public-health action.

## Features
- 30 curated fictional outbreaks, plus Endless Practice and "Fresh numbers" re-rolls
- Guided and Expert difficulty, optional time pressure, hints
- Case definitions, epidemic curves, spot maps, odds ratios with 95% CI, bias and power cards
- This Week challenge, Department, Self-Check, Flashcards, Curve gallery and quiz, OR calculator, Glossary
- Badges, skills certificate (PNG/SVG), one-page skills summary (PDF), Word field report with Methods appendix
- Leaderboard and sync codes (shared when a Convex backend is connected; otherwise stored in the browser)

## Run locally
```bash
npm install --legacy-peer-deps
npm run dev
```
Without a backend the leaderboard and sync codes use browser storage, so everything works offline.

## Optional shared backend (Convex)
```bash
npx convex dev --configure new   # project name: outbreak-investigation-simulator
npx convex deploy                # prints your production .convex.cloud URL
```
Set `VITE_CONVEX_URL` to that URL as a build variable, then rebuild. The shared leaderboard and cross-device sync then use Convex.

## Deploy on Cloudflare Workers
- Build variable: `NITRO_PRESET=node-server`
- Build command: `npm install --legacy-peer-deps && npm run build`
- Deploy command: `npx wrangler deploy --assets .output/public --name outbreak-investigation-simulator --compatibility-date 2026-01-01`

## Tech stack
TanStack Start, React, Tailwind CSS v4, Convex (optional), docx, pdf-lib. Originally built on Macaly and moved to GitHub and Cloudflare.

## Attribution
Created by **Khan Gulrez Shagufa Fazal Ahmed**.

If you reuse or adapt this project, please credit the original author and link back to https://github.com/randomthingsonlineatsk-cloud/outbreak-investigation-simulator. The Apache License 2.0 requires you to keep the `LICENSE` and `NOTICE` files with any copy you distribute.

## License
Licensed under the [Apache License 2.0](LICENSE). Copyright 2026 Khan Gulrez Shagufa Fazal Ahmed.
