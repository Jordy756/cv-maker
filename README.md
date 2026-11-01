# cv-maker

A CV that lives in code. Astro renders the page, headless Chromium prints it.

```sh
pnpm build
```

Output:

```
dist/                      static site
pdf/Yordi_Castro_CV_ES.pdf
pdf/Yordi_Castro_CV_EN.pdf
```

## Stack

| Piece      | Choice                                                     |
| :--------- | :--------------------------------------------------------- |
| Framework  | Astro 7 (static output, i18n routing)                      |
| Styling    | Tailwind CSS v4 through `@tailwindcss/vite`                |
| Typography | STIX Two Text, downloaded at build time by Astro Fonts API |
| PDF        | Chromium `--print-to-pdf`, driven by an Astro integration  |
| Content    | `src/data/{es,en}.json`                                    |

## Requirements

- Node.js >= 22.23.4
- pnpm
- A Chromium binary. Any of these works, in this order of preference:
  - `CHROME_PATH` pointing at the executable
  - `google-chrome`, `google-chrome-stable`, `chromium`, `chromium-browser` or `chrome` on `PATH`
  - the Playwright browser cache (`~/.cache/ms-playwright` on Linux)

```sh
pnpm install
```

## Commands

| Command        | Action                                                    |
| :------------- | :-------------------------------------------------------- |
| `pnpm dev`     | Dev server with a live preview                            |
| `pnpm build`   | Type-check, build the static pages, then render both PDFs |
| `pnpm preview` | Serve the last build                                      |
| `pnpm format`  | Format the repository with Prettier                       |

## PDF generation

PDFs are produced by an Astro integration in `scripts/pdf/`, registered in
`astro.config.mjs`:

```js
integrations: [pdfExport()];
```

It runs on the `astro:build:done` hook, so `pnpm build` always emits the PDFs
after the static site is written.

The sequence is:

1. read `<srcDir>/data/*.json` and take every file that declares both `locale`
   and `pdfFileName`;
2. match each `locale` against the `pages` list that Astro hands to the hook, so
   only routes Astro actually generated are rendered;
3. serve the build output over an ephemeral local HTTP server;
4. run Chromium `--headless --print-to-pdf=<pdfFileName>` against
   `http://127.0.0.1:<port>/<pathname>`.

Using the hook's `pages` argument instead of probing the filesystem keeps the
integration independent of `build.format` and of where Vite writes the output.

| File                     | Responsibility                                 |
| :----------------------- | :--------------------------------------------- |
| `scripts/pdf/index.ts`   | Astro integration, orchestration, output paths |
| `scripts/pdf/browser.ts` | Locates a Chromium binary                      |
| `scripts/pdf/render.ts`  | Spawns Chromium and waits for the PDF          |
| `scripts/pdf/server.ts`  | Static file server over `dist/`                |

### Environment variables

| Variable      | Effect                                        |
| :------------ | :-------------------------------------------- |
| `CHROME_PATH` | Use this executable instead of auto-detection |
| `SKIP_PDF=1`  | Build the site without generating PDFs        |

If no Chromium is found the build fails with an actionable message instead of
silently producing no PDFs. Set `SKIP_PDF=1` where a browser is unavailable.

### Why an HTTP server instead of `file://`

The built pages reference fonts and assets with absolute URLs (`/_astro/...`),
and Astro inlines the `@font-face` rules into the HTML. With `file://` those
URLs do not resolve, Chromium falls back to a system serif, and the PDF ends up
with the wrong metrics. Serving the build keeps the real STIX Two Text font, so
the PDF embeds it.

### Why not Playwright

`page.pdf()` and the Chromium CLI drive the same print engine and produce the
same output. Playwright adds a browser-automation runtime that this project does
not need, since nothing has to be clicked, awaited or asserted. The CLI is
enough, and the browser it needs is the one already on the machine.

## Page geometry

The printed page is US Legal, set in `src/layouts/Layout.astro`:

```css
@page {
  size: 8.5in 14in;
  margin: 0;
}
```

At the CSS resolution of 96px per inch, US Legal is 816 x 1344 px. The layout
container uses `w-204`, which is 204 x 0.25rem x 16px = 816px, so the widest
element already matches the page width exactly. The content measures about
1310px tall, leaving roughly 34px of headroom before a second page appears.

That headroom is small on purpose but not large: adding new content can push the
CV onto a second page. Check `pdfinfo pdf/Yordi_Castro_CV_ES.pdf` after content
changes if you need to be sure.

`min-h-dvh` is scoped to the screen with `print:min-h-0` so the print pass does
not force a viewport height onto the page.

## Structure

```
src/
├── data/
│   ├── en.json            content, English
│   └── es.json            content, Spanish
├── i18n/
│   ├── ui.ts              UI strings per locale
│   └── utils.ts           locale helpers
├── layouts/Layout.astro   page shell, metadata, page size
├── components/
│   ├── chrome/            Header, Section
│   └── sections/          Experience, Education, Skills
├── scripts/utils/         date formatting
├── styles/global.css      Tailwind entry and theme tokens
└── pages/
    ├── index.astro        redirect to the default locale
    └── [locale]/index.astro
scripts/pdf/               render pipeline
```

Content lives only in `src/data/*.json`. To add a locale, add the JSON file,
register it in `src/i18n/ui.ts`, add it to `i18n.locales` in `astro.config.mjs`,
and add its `params` to `getStaticPaths()` in `src/pages/[locale]/index.astro`.
The PDF integration picks it up automatically once the JSON declares `locale`
and `pdfFileName`.

## Internationalization

Astro's i18n routing uses `prefixDefaultLocale: true`, so every locale keeps its
own prefix:

```
/es/    /en/
```

`src/pages/index.astro` redirects the root to the default locale. The locale list
in `getStaticPaths()` is literal on purpose: Astro hoists that function into its
own module, where module-scope bindings are not visible.

## ATS notes

- Single column, no tables, no grid columns, no floats.
- Real text, not images: every string is selectable and extractable.
- Standard section headings so parsers can classify them.
- The PDF is tagged and embeds the real font subsets.

Line wrapping can split a hyphenated word at the end of a line, so plain
`pdftotext` may join `cross-` / `platform` into `crossplatform`. The rendered
page is correct; only the flat-text extraction is affected.
