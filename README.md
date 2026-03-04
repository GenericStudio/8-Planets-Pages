# Cutsie Planet Explorer

A starter Three.js planet explorer with cute planets and a GitHub Pages deployment workflow that runs on pushes and PRs.

## Local development

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173>.

Use the in-app planet panel (top-right) to jump to Mercury through Neptune.

## GitHub Pages + PR builds

The workflow in `.github/workflows/pages.yml` builds a static Pages artifact in GitHub Actions and deploys it through GitHub Pages on:

- pushes to `main`
- pull requests targeting `main` (with preview deployments)
- manual workflow dispatch

For pull requests, the workflow posts/updates a comment with the preview URL so reviewers can open the page directly from the MR.

> Pages source should be set to **GitHub Actions** in repository settings.
