# SirHumza's portfolio

Single-page personal site: hero, about, projects, contact.

## Structure

- `index.html` — markup and SEO/meta tags
- `styles.css` — all styling (dark theme, red accent)
- `script.js` — cursor glow + scroll-reveal (progressive enhancement)
- `avatar.jpg` — optimized profile photo (source: `IMG_8210.jpg`, not referenced)

## Local preview

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Deploy

Pushed to `main`, GitHub Pages builds via `.github/workflows/static.yml`.
Live at <https://sirhumza.github.io/portfolio/>.
