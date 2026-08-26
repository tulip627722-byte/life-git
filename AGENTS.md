# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Prototype-specific decisions

- The selected visual source of truth is `/Users/tulip.yu/Documents/ChatGPT/项目/life-git-demo/qa/source-design.png`.
- Match its warm paper background, deep forest ink, brick-red commit action, left README identity rail, pixel typography, timeline density, and taped release-card character.
- The demo is an interactive single-page HTML experience: top navigation switches Overview, Timeline, Repository, and Release views.
- The timeline main line and its commit nodes must open each commit detail.
- The core flow is create Commit → preserve raw content locally → update Overview, Timeline, and Contribution Graph.
- Keep AI enrichment optional and structurally separate from the preserved raw note.
- The interface language is Simplified Chinese and the displayed personal name is `Tulip`; keep Git vocabulary recognizable while explaining it through Chinese UI copy.
- Life Git is now a single-owner product: Tulip manages a private console and visitors see only explicitly published projects and files.
- GitHub is read-only. Project README files are displayed exactly as imported and are never changed by AI.
- The profile `/README.md` is Tulip's evolving self-introduction. AI may draft it from public projects and Life Commits, but publishing always requires Tulip's confirmation and retains version history.
- Project and file visibility are separate. New GitHub imports and uploads default to private; sensitive paths, dependencies, binaries, and oversized files are blocked from preview and AI context.
- Production persistence uses the Sites Worker with logical bindings `DB` (D1) and `FILES` (R2). Local preview keeps a clearly labeled browser-backed fallback so the product flow remains testable without credentials.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
