# Leaderboard replica — approach

## Goal

Deliver a static GitHub Pages site that mirrors the internal leaderboard UI (header, filters, podium, sortable employee list as cards, expandable “Recent activity” blocks) without using any real company data.

**Security:** By design, this work did **not** rely on screenshots of the internal dashboard, exports of production data, or any other artefacts that could leak confidential information into the repo or into AI tooling. Requirements were inferred from written specs only; that reduces risk of accidental disclosure and keeps the public GitHub Pages artifact cleanly separated from sensitive systems.

## Tools and techniques

- **Cursor (Agent mode)** — Implementation was done primarily in **Cursor** using **Agent mode**: the agent scaffolded the static site structure, wired filters and rendering, and produced an initial **random mock dataset** (names, titles, `recentActivity` rows, activity counts). Follow-up prompts refined behaviour and layout until it matched the intended dashboard behaviour (podium styling, category-based scoring, card layout, tooltips, accessibility details). Deliberately **no** screenshots of internal tools and **no** real roster or metrics were pasted into prompts—only structural descriptions—consistent with the security approach above.

- **Plain HTML/CSS/JavaScript** — No build step. The app is easy to host on GitHub Pages from the repository root and easy to audit.

- **Mock data in JSON** — All names, titles, org codes `(CC.U#.G#)`, activity counts, and `recentActivity` rows (with per-row `points`) live in `data/employees.json`. Leaderboard totals are derived by summing those points (all rows for “total”, or rows in the selected category when filtering)—there is no separate `score` field. The UI loads this file with `fetch()`; there is no backend and no call to internal systems.

- **ES modules** — `js/app.js` uses `import.meta.url` to resolve the JSON path relative to the script, which works when the page is served over HTTP(S).

- **Client-side filtering and sorting** — After load, employees are filtered by year, quarter, category, and name (substring, case-insensitive), then sorted by **computed points descending**. The podium reflects the current top three of that filtered set; the list shows everyone in that set with serial numbers **1…n**.

- **Node.js for local dev** — A tiny static file server (`server.js`, `npm start`) serves the app over HTTP so `fetch` works locally, matching GitHub Pages.

- **Accessibility** — Expand/collapse uses `aria-expanded`, `aria-controls`, and `hidden` on the expanded region; list semantics use `role="list"` / `role="listitem"` where appropriate; podium avatars use empty `alt` when the name is shown beside the image.

## Data replacement

For **security and compliance**, nothing from a real internal leaderboard was copied into this repository or fed into model prompts: no live dashboard screenshots, no dumps of names or scores, and no internal URLs or identifiers. The dataset is **entirely synthetic**:

- **Names** — Common placeholder-style given names, not real employees.
- **Titles and org codes** — Fictional job titles and invented country/unit/group codes in the required format.
- **Photos** — [randomuser.me](https://randomuser.me) portrait URLs (stock-style avatars, not company assets).
- **Points and activities** — Per-activity `points` in `recentActivity`, per-type activity counts, and recent activity lines (including mixed category labels where useful for UI testing). No separate total field; the UI sums `points` for display.

This keeps the deliverable safe for public GitHub and aligned with responsible AI usage: no PII, no real org structure, no production figures, and no dependency on confidential source material from the original system.

## Deployment

The site is intended for **GitHub Pages** on the `crazy-poncho.github.io` repository: push `index.html`, `css/`, `js/`, and `data/` to the publishing branch (often `main`). The live URL will be `https://crazy-poncho.github.io/` once Pages is enabled and the build has finished.

## Local check

From the repo root, start the included Node.js static server and open the URL it prints (default `http://127.0.0.1:8080/`):

```bash
npm start
```

`PORT` is optional, e.g. `PORT=3000 npm start`. The `fetch` of `data/employees.json` will not work from a `file://` URL; use the server for local testing, which matches the GitHub Pages HTTP(S) runtime.
