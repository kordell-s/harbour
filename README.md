# Harbour

Broker-led yacht visit coordination prototype for Anguilla.

## Deploy to Vercel

Import `kordell-s/harbour` into Vercel and deploy branch `main`. Keep the Root Directory at the repository root (`.`). The included `vercel.json` selects the static site in `harbour/dist` with no install or build step. No environment variables are needed.

Framework preset: **Other**. Output directory: **harbour/dist**. Routes use URL hashes, so no server rewrite is required.

## Run locally

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory harbour/dist
```

Open http://127.0.0.1:8000/#home.

## Verify

```sh
node --check harbour/dist/app.js
node --check harbour/dist/documents.js
node --test harbour/tests/workflow.test.cjs
```

See [app documentation](harbour/README.md) and the [demo guide](harbour/DEMO-GUIDE.md). Editable Remotion video source lives in `harbour/video`; dependencies and rendered exports are excluded from Git.

This is a fictional, session-only demo. Reloading resets changes. Authority actions are simulated; there is no authentication, backend, payment processing or government integration.
