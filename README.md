# airdribble slow-motion fork

This repository publishes the current upstream [manrajpannu/airdribble](https://github.com/manrajpannu/airdribble) frontend with one gameplay addition: an in-game **Game Speed** slider (0.10×–1.50×).

The GitHub Pages workflow:
1. clones the current upstream source;
2. applies a minimal speed-control patch using the upstream settings store, engine hook, and Radix/Shadcn slider;
3. adapts the Next frontend for static GitHub Pages export;
4. deploys the built site through GitHub Pages.

The simulator assets, UI, shaders, models, styling, and engine come from upstream. Model/license attribution remains upstream:
- airdribble: MIT © Manraj Pannu
- Octane, Fennec, Dominus & Ball models by Jako: CC BY 4.0

## Deployment

The workflow is in `.github/workflows/pages.yml`.

If GitHub Pages is not already enabled, choose **Settings → Pages → Source: GitHub Actions** once. After that, every push to `main` redeploys automatically.

Expected site URL:

https://jjjone05.github.io/airdribble-slowmo/

## Backend note

GitHub Pages is static hosting, so the Go account/leaderboard backend is not hosted here. The training simulator, local settings, 3D assets, controls, tutorial/freeplay, and speed control are built client-side.
