# Cutsie Planet Explorer

A starter Three.js planet explorer with cute planets and a GitHub Pages deployment workflow that runs on pushes and PRs.

## Local development

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173>.

## GitHub Pages + PR builds

The workflow in `.github/workflows/pages.yml` copies `index.html` and `src/` into a `dist/` artifact, then deploys through GitHub Pages on:

- pushes to `main`
- pull requests targeting `main`
- manual workflow dispatch
