# Phish Detector

A frontend-only phishing URL detector with a cyberpunk/hacker-style interface.

Live analysis is done in the browser using heuristic checks. No backend is required.

## Features

- Advanced URL risk analysis (0-100 score)
- Result classification: `SAFE`, `SUSPICIOUS`, `PHISHING`
- Gradient risk meter (green -> yellow -> red)
- Animated cyber-intelligence scan sequence
- Website preview simulator (domain, protocol, impersonation guess)
- Learning mode: why a URL is suspicious
- Threat history (last 10 scans via `localStorage`)
- Random cybersecurity awareness tips
- Optional hacker mode (sound + visual effects)
- Matrix background + glassmorphism neon UI

## Project Structure

- `index.html` -> layout and panel structure
- `styles.css` -> theme, glassmorphism panels, responsiveness
- `analysis.js` -> phishing heuristic engine
- `ui.js` -> animations, rendering, matrix effect, sounds
- `storage.js` -> localStorage history handling
- `main.js` -> app controller and event orchestration

## Run Locally

Open `index.html` directly in your browser.

Optional: run with a local server for cleaner dev workflow.

## Deploy to GitHub Pages

1. Push your code to `main` branch.
2. Open GitHub repo -> `Settings` -> `Pages`.
3. Under **Source**, choose:
   - `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
4. Save.
5. Wait 1-2 minutes and open:
   - `https://arush7376.github.io/phish-detector/`

## Update Workflow

```bash
git add .
git commit -m "Describe your feature"
git push
```

GitHub Pages will redeploy automatically after push.

## Notes

- This is an educational heuristic detector, not a replacement for enterprise threat intelligence.
- False positives/negatives are possible.
- You can tune weights in `analysis.js` as you add more features.
