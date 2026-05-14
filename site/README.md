# pi-epicflow — marketing site

Vite + React + Tailwind site for [pi-epicflow](https://github.com/shankar029/pi-epicflow), deployed to
[`https://shankar029.github.io/pi-epicflow/`](https://shankar029.github.io/pi-epicflow/)
via [`.github/workflows/deploy-site.yml`](../.github/workflows/deploy-site.yml) on every push to `main`
that touches `site/**`.

## Local dev

```bash
npm install
npm run dev          # http://localhost:5173/pi-epicflow/
npm run build        # writes dist/
npm run preview      # serve dist/ locally
```

## Structure

```
site/
├── index.html               # <head>: title, OG/twitter meta, theme-color
├── src/
│   ├── main.tsx             # React entry
│   ├── App.tsx              # single-page layout (Navbar, Hero, Benefits, …)
│   └── index.css            # Tailwind config + theme tokens
├── vite.config.ts           # base: '/pi-epicflow/'
└── package.json
```

Theme tokens (defined in `index.css` via Tailwind `@theme`):
`vibrant-green`, `vibrant-green-hover`, `surface`, `surface-container`,
`slate-surface`, `slate-border`, `slate-background`, `text-muted`.

## Updating content for a release

1. Bump the version badge in `App.tsx` `Navbar` (`v0.X` chip).
2. If there's a new headline feature, edit `Hero` subtitle and the `WhatsNew`
   section (or replace it entirely for a major release).
3. If the architecture changes, update `ArchitectureDiagram` nodes.
4. Build locally (`npm run build`) and eyeball `dist/index.html` for size
   sanity (~1.5 KB gzip is current baseline).
5. Commit; GH Actions deploys on push to `main`.

## License

Apache-2.0 (site code). The project itself is MIT.
