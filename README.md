# GitCommitMe

GitCommitMe is a playful developer-dating concept rendered as a single-page HTML/CSS/JavaScript experience. It mirrors the supplied hero mock (hero headline, feature cards, swipe deck, CTA buttons) while delivering the three core stories:

1. **GitHub sync** – personal “Connect GitHub” modal that fetches a public profile + repositories via the GitHub REST API (no backend required). Tokens are optional and only stored for the browser session.
2. **Enriched profile cards & match preferences** – your GitHub snapshot, top languages and repos, plus a modal to pin up to five must-have skills and two collaboration styles (persisted with `localStorage`).
3. **Affinity scoring & queue ordering** – a swipe deck seeded from `data/candidates.json`, scored on shared languages/skills/collab modes, with badge explanations and animated CTA buttons like the mock.

Everything runs statically, so you can open it in any modern browser without Python, Node, or build tooling.


## Key files

| Path | Purpose |
| --- | --- |
| `index.html` | Markup for the hero, feature cards, swipe deck, and modal scaffolding. |
| `styles.css` | All layout/styling, matching the provided UI: gradients, cards, modals, and swipe controls. |
| `app.js` | Vanilla JS that handles GitHub fetches, local/session storage, preference pills, affinity scoring, and modal interactions. |
| `data/candidates.json` | Sample developer profiles used for the swipe deck and affinity calculation. |

## Feature highlights

- **GitHub Snapshot** – Fetches profile info plus up to 100 repos, calculates top languages, and displays the latest stats with a “Last synced” timestamp.
- **Preference Modals** – Users can add/remove skills and collaboration modes (max 5/2) with pill UIs; values persist via `localStorage`.
- **Swipe Intelligence** – Candidates are scored 0–100 with badges explaining why they surfaced (shared languages, skill overlap, collaboration fit). The deck updates instantly when preferences change.
- **Toast + CTA parity** – The hero, feature grid, CTA buttons, and swipe actions mimic the supplied design, including smooth scrolling for “Start Matching” and “Learn More”.

