<p align="center">
  <img src="res/img/seo/portfolio-preview.png" alt="Oleksandr Danchenko portfolio preview" width="100%">
</p>

<p align="center">
  <strong>English</strong> · <a href="README.uk.md">Українська</a>
</p>

# Personal Portfolio

A responsive bilingual portfolio and online résumé built without a framework or build step. The project focuses on clear presentation, lightweight assets, accessible interactions, and a custom XML-driven localization system.

## Highlights

- English and Ukrainian interfaces with automatic browser-language detection.
- XML translation files with an English fallback and in-memory caching.
- Responsive layouts for desktop, tablet, and mobile screens.
- Semantic HTML, keyboard-friendly controls, and reduced-motion support.
- Local SVG icon sets and optimized WebP images.
- Open Graph and Twitter Card metadata with a custom social preview.
- Search indexing disabled so the published portfolio is intended to be opened through a direct link.

## Technical Case Study

### XML-driven localization

Available languages and translation paths are declared in `config.json`. At startup, `localization.js` reads the browser language preferences, loads the required XML files, merges the selected language with the English fallback, and updates both visible content and localized metadata.

```text
config.json
    ↓
navigator.languages → language selection
    ↓
English XML fallback + selected XML
    ↓
Page content, title, and social metadata
```

Translation responses are cached in memory, so changing languages does not repeatedly download the same XML document.

### Interface and motion

The page uses CSS transitions and an `IntersectionObserver`-based reveal system. Motion remains decorative rather than essential, and the `prefers-reduced-motion` media query disables non-essential effects for visitors who request a calmer experience.

### Assets and performance

The project uses local SVG icons instead of an external icon font. Photos and project artwork are stored as WebP, include explicit dimensions, and use responsive or lazy-loading attributes where appropriate. The social sharing card remains PNG for broad compatibility with link-preview services.

### Sharing without search indexing

Open Graph and Twitter Card tags provide a consistent preview when the direct link is shared. At the same time, the page uses `noindex, nofollow` and does not publish a sitemap. This discourages compliant search engines from listing the portfolio, but it is not access control or password protection.

## Technology Stack

| Area | Technologies |
| --- | --- |
| Markup | HTML5, semantic elements, SVG sprites |
| Styling | CSS3, responsive media queries, custom animations |
| Logic | Vanilla JavaScript, Fetch API, DOMParser, IntersectionObserver |
| Localization | XML, browser language detection |
| Media | WebP, PNG, SVG, OGG |
| Hosting | GitHub Pages |

## Project Structure

```text
.
├── index.html                 # Page markup and static social metadata
├── style.css                 # Layout, themes, responsive rules, animations
├── config.json               # Localization configuration
└── res
    ├── audio                  # Optional ambient audio
    ├── icons                  # Site, flag, and technology SVG icons
    ├── img                    # Optimized images and social preview
    ├── scripts                # Localization, scroll reveal, and audio behavior
    └── locales
        ├── en/translations.xml # English content
        └── uk/translations.xml # Ukrainian content
```

## Run Locally

The page loads configuration and translations with `fetch`, so it should be opened through a local HTTP server rather than directly through `file://`.

Using Python on Windows:

```powershell
py -m http.server 8000
```

Then open `http://localhost:8000/`. VS Code Live Server can be used as an alternative.

## Updating the Portfolio

- Edit visible text in `res/locales/en/translations.xml` and `res/locales/uk/translations.xml`.
- Add or remove supported languages in `config.json`.
- Change layout and visual behavior in `style.css`.
- Update shared site icons in `res/icons/site-icons.svg`.
- Edit `res/img/seo/portfolio-preview.svg` and regenerate the PNG when the social card changes.

## Copyright and Third-Party Assets

Copyright © 2026 Oleksandr Danchenko. All rights reserved.

Third-party icons and assets are subject to their respective licenses included with the corresponding files.
