# The Attic Desk

A small winter website: sixteen sentences worth keeping, seven plans worth
building, and one machine that serves no purpose whatsoever.

It is the companion piece to **My Little Home** and keeps the same look —
walnut, wine, brass and cream, everything lit by one lamp — but the content
is plain HTML, CSS and JavaScript, with nothing to install and nothing to build.

---

## The pages

| File | What it is |
| --- | --- |
| `index.html` | The front door: a hero image of the house in the snow, and an overview of the three rooms. |
| `quotes.html` | The notebook. Sixteen quotes, and a hero card that draws one of them at random. |
| `project.html` | The workbench. Seven project ideas, written on index cards. |
| `machine.html` | The machine. A useless contraption with a lever, and one small game it is actually good at. |
| `nav.html` | The one and only copy of the navigation. |
| `nav.js` | Fetches `nav.html` and drops it into every page. |
| `style.css` | Every style on the site. |
| `quotes.js` | Picks a quote at random for the hero card. |
| `machine.js` | The lever, and the game. |

---

## Running it

**Straight from the disk.** Double-click `index.html`. Everything works.

One caveat: when a page is opened as a `file://` address, the browser will not
let it read a neighbouring file, so `nav.js` cannot fetch `nav.html`. It falls
back to an identical copy of the same markup kept inside `nav.js`, and the menu
behaves exactly as it does on a server.

**Over a local server** (recommended, and how the site is meant to be seen):

```bash
cd my-site
python -m http.server 8000
# then open http://127.0.0.1:8000
```

On a server the navigation genuinely comes from `nav.html`, out of one file.

---

## The navigation is written once

The menu lives in `nav.html` and nowhere else. Every page has an empty
`<div data-nav></div>` in its header, and `nav.js` fills it in, then marks the
link for the page you are on.

Because the `file://` fallback means two copies of the markup exist, a small
tool keeps them honest:

```bash
node tools/check-nav.mjs
```

It fails if the copy in `nav.js` ever drifts away from `nav.html`.

---

## Checking the site

```bash
python tools/verify-site.py
```

This checks that the HTML tags balance on every page, that every link and
every image and font points at a file that actually exists, that no
placeholder text is left behind, that there are at least fifteen quotes and at
five plans, and that the two copies of the navigation still match.

---

## The game

The machine clears snow. There is a gate at one end of the yard and a tree at
the other, and you have sixteen strokes of the shovel to open a path between
them while the snow keeps falling.

- **Drag** across the snow to shovel. Every tile you clear costs one stroke,
  and one tile of snow falls again straight after.
- **Keyboard**: move with the arrow keys, shovel with space or enter.
- The path is won the moment the gate and the tree are joined.

---

## Publishing

- **Live site (GitHub Pages):** https://lism-555.github.io/my-site/
- **Repository:** https://github.com/lism-555/my-site
- **Mirror on the MiniMax host:** https://jqco1r5jnfl4a.space.mcode.cn

The folder is a plain static site, so there is no build step. Pages is served
straight from the root of `main`.

To push a change:

```bash
cd D:\minimaxcoding\my-site
git push
```

Pages rebuilds on its own within a minute or two. The repository lives at
https://github.com/lism-555/my-site — **Settings → Pages → Source: Deploy
from a branch → `main` / `(root)`** is already set that way.

---

## Where things came from

- **Typefaces** — Cormorant Garamond, Great Vibes and Playfair Display, served
  from `assets/fonts` as local `woff2` files so nothing is fetched from a
  third party.
- **Photographs** — from the house next door: `assets/img`.
- **Everything else** — drawn in CSS: the paper, the grain of the desk, the
  wax seal, the brass machine and the falling snow.

No trackers, no cookies, no third-party requests.
