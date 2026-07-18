# MyRoomeo

Personality-driven roommate matching — a static marketing site plus a 12-question roommate type quiz with scrapbook-style results, profile builder, and share/compare flows.

**Brand:** MyRoomeo · Logo: `assets/brand/logo02.svg`  
**Repo:** [github.com/c4han-star/Roomeo](https://github.com/c4han-star/Roomeo) (private)

## What's in the repo

| Page | File | Purpose |
|------|------|---------|
| Landing | [`index.html`](index.html) | Hero, six roomie type cards, trust section, CTA into quiz |
| Quiz app | [`quiz.html`](quiz.html) | Intro → 12 questions → results → optional profile → waitlist |

### Quiz flow (all client-side)

1. **Intro** — start the quiz  
2. **12 questions** — each maps votes to one of six types (see [scoring doc](docs/quiz-scoring-logic-en.md))  
3. **Results** — scrapbook-style report: quote, roast, six folder sections, compatibility, share CTAs  
4. **Profile builder** (optional, 4 steps + waitlist)  
   - Logistics (city, budget, neighborhoods via Leaflet)  
   - Living habits & sliders  
   - Identity reveal + roommate card preview  
   - Trust / verification toggles  
5. **Waitlist** — name + email, success confirmation, share & compare while waiting  

No backend yet — answers, profile, and waitlist state live in `sessionStorage` only.

### Six roomie types

`beaver` · `bunny` · `cat` · `fox` · `owl` · `turtle`

Use type slugs in preview URLs below (e.g. `#turtle` → The Turtle result page).

## Run locally

Opening HTML via `file://` can break asset paths and maps. Serve from the project root:

```bash
python3 -m http.server 8765
```

| URL | What you see |
|-----|----------------|
| http://127.0.0.1:8765/ | Landing page |
| http://127.0.0.1:8765/quiz.html | Quiz intro |
| http://127.0.0.1:8765/quiz.html#turtle | Results for **The Turtle** (no quiz required) |
| http://127.0.0.1:8765/quiz.html#beaver | Results for **The Beaver** |
| http://127.0.0.1:8765/quiz.html?previewResult=owl | Design / Figma capture preview (results page) |

Other type slugs: `bunny`, `cat`, `fox`, `owl`.

With Node.js:

```bash
npx --yes serve -l 8765
```

## Stack

Static **HTML / CSS / JavaScript** — no build step, no bundler.

| Dependency | Use |
|------------|-----|
| [Google Fonts](https://fonts.google.com/) | Fraunces + Roboto |
| [Leaflet](https://leafletjs.com/) | Neighborhood picker on profile step 1 |
| [html2canvas](https://html2canvas.hertzen.com/) | Export share / compare story cards as PNG |

## Documentation

Product and engineering notes live in [`docs/`](docs/):

| Doc | What it covers |
|-----|----------------|
| [result page.md](docs/result%20page.md) | Quiz flow, results UI, share/compare modals, profile — aligned with `quiz.html` |
| [quiz-scoring-logic-en.md](docs/quiz-scoring-logic-en.md) | Type assignment algorithm and full vote mapping |

UI copy and layout source of truth: [`index.html`](index.html) and [`quiz.html`](quiz.html).

## Asset layout

| Path | Contents |
|------|----------|
| `assets/brand/` | `logo02.svg` (nav), `logo.svg` |
| `assets/site/` | Landing imagery, trust backgrounds, share QR placeholder |
| `assets/quiz/questions/` | `quiz cover.png`, `q1.png`–`q12` (q4, q10 are `.jpg`) |
| `assets/characters/` | Type avatars: `beaver.png` … `turtle.png` |
| `assets/result-hero/` | Result hero mascots per type (transparent PNG) |
| `assets/roommate-type-cards/` | Six illustrated cards on landing `#types` |
| `assets/journal-props/` | Result-page folder sticker SVGs (`deco-folder-1` … `6`) |
| `assets/figma-quiz-final/` | Legacy Figma export vectors |
| `assets/quiz-result-1-0/` | Legacy result SVG assets |
| `docs/` | Product + design Markdown (not loaded by pages) |

## Repository access

This GitHub repository is **private**. Invite collaborators under **Settings → Collaborators** (or **Manage access**).

## Contributing

1. Clone the repo and run a local static server (see above).  
2. Edit `index.html` and/or `quiz.html` directly.  
3. Push to `main` or open a PR — there is no CI or build step to run locally.
