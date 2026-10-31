# cv-maker

Generates the CV as a PDF from code: Astro renders the page, Playwright prints it.
No Word, no LaTeX.

Output:

```
pdf/Yordi_Castro_CV_ES.pdf
pdf/Yordi_Castro_CV_EN.pdf
```

## Stack

| Piece             | Choice                                                    |
| :---------------- | :-------------------------------------------------------- |
| Framework         | Astro 7 (static output, i18n routing)                     |
| Styling           | Tailwind CSS v4 through `@tailwindcss/vite`                |
| Typography        | STIX Two Text, downloaded at build time by Astro Fonts API |
| PDF               | Playwright (Chromium)                                     |
| Content           | `src/data/{es,en}.json`                                   |

## Requirements

- Node.js >= 22.23.4 (the PDF script relies on native TypeScript stripping)
- pnpm
- `poppler-utils` (`pdfinfo`, `pdftotext`) for the verification step

```sh
pnpm install
pnpm exec playwright install chromium
```

## Commands

| Command           | Action                                                |
| :---------------- | :---------------------------------------------------- |
| `pnpm dev`        | Dev server with a live preview of the page            |
| `pnpm check`      | Type-check the Astro components                       |
| `pnpm build`      | Type-check, then build the static pages into `dist/`  |
| `pnpm pdf`        | Build, render both PDFs, then verify them             |
| `pnpm pdf:verify` | Verify the existing PDFs only                         |
| `pnpm format`     | Format the repository with Prettier                   |

`node scripts/pdf.ts --no-verify` renders without running the checks.

## Structure

```
src/
├── data/
│   ├── es.json          content, Spanish
│   └── en.json          content, English
├── i18n/
│   ├── ui.ts            UI strings per locale
│   ├── utils.ts         locale helpers
│   └── resume.ts        content loader
├── lib/cv.ts            types and date formatting
├── styles/global.css    Tailwind entry and theme tokens
├── layouts/Layout.astro page shell (head, fonts, metadata, page size)
├── components/
│   ├── chrome/          Header, Section
│   ├── sections/        AboutMe, Experience, Education, Skills
│   └── ui/              EntryRow, Bullets
└── pages/
    ├── index.astro      redirect to the default locale
    └── [locale]/index.astro
scripts/pdf.ts           render + verify
```

Content lives only in `src/data/*.json`. To add a locale, drop a new JSON file
in `src/data/`, register it in `src/i18n/ui.ts` and `src/i18n/resume.ts`, add it
to `i18n.locales` in `astro.config.mjs`, and add its `params` to
`getStaticPaths()` in `src/pages/[locale]/index.astro`.

## Internationalization

Astro's i18n routing is configured in `astro.config.mjs` with
`prefixDefaultLocale: true`, so every locale keeps its own prefix:

```
/es/    /en/
```

`src/pages/index.astro` redirects the root to the default locale. The locale
list in `getStaticPaths()` is literal on purpose: Astro hoists that function
into its own module, where module-scope bindings are not visible.

`src/i18n/ui.ts` holds the UI strings per locale and `src/i18n/utils.ts` exposes
the helpers:

```ts
export const useTranslations = (lang: keyof typeof ui) => {
  const localizedUI: Record<string, string> = ui[lang];
  return function t(key: keyof (typeof ui)[typeof defaultLang]) {
    return key in localizedUI ? localizedUI[key] : ui[defaultLang][key];
  };
};

export const getCurrentLocale = (locale: string | undefined): Locale =>
  (locale ?? defaultLocale) as Locale;
```

## Typography

STIX Two Text is the serif used by the source document. It is registered in
`astro.config.mjs` with Astro's Fontsource provider and pulled in through the
`<Font />` component in the layout:

```js
fonts: [
  {
    provider: fontProviders.fontsource(),
    name: 'STIX Two Text',
    cssVariable: '--font-primary',
    weights: [400, 700],
    styles: ['normal', 'italic'],
    subsets: ['latin', 'latin-ext'],
  },
],
```

The CSS variable is named `--font-primary`, not after the typeface, so
swapping the font later is a one-line change in the config.

Astro downloads the woff2 files at build time, emits them into
`dist/_astro/fonts/`, and generates the `@font-face` rules plus metric-adjusted
fallbacks for Times New Roman. Tailwind v4 registers the variable with
`@theme inline { --font-serif: var(--font-primary) }`.

## The section component and ATS

`src/components/chrome/Section.astro` is deliberately plain:

```astro
<section>
  <header>
    <h2>{title}</h2>
  </header>
  <div>
    <slot />
  </div>
</section>
```

The `<section>` and `<h2>` give parsers a real heading to classify, and the
content stays in document order inside the slot.

The rows that place a location or a date on the right use `flex` with
`justify-between` (`src/components/ui/EntryRow.astro`), **not** a table and
**not** a two-column grid. That is the part that matters for ATS: a table lets
a text extractor read column by column, which interleaves the fields, and a
grid does the same. With flex the extracted text follows the DOM order, so
`Factor K` is followed by `Remoto`, then the role, then the dates.

## Page geometry

The page is US Legal (8.5in x 14in, 612 x 1008 pt) because the content fits on
one page only at that size. A4 or Letter pushes the last skills lines onto a
second page. The `@page` rule lives in `src/layouts/Layout.astro`.

The margins and sizes are measured from the source PDFs: 26.7pt left, 15.5pt
right, 35.3pt top, 11.33pt body with 13.3pt leading, 12pt uppercase section
headings, a 24pt centered name, and bullets whose marker sits at 18pt with the
text starting at 36pt.

## ATS notes

- Single column, no tables, no grid columns, no floats.
- Real text, not images: every string is selectable and extractable.
- Standard section headings (`Professional summary`, `Professional experience`,
  `Education`, `Technical skills`) so parsers can classify them.
- `pnpm pdf` fails if the PDF is not exactly one page, if the page size drifts,
  if any expected content string is missing, or if a placeholder leaks into the
  output.

## Verification

`pnpm pdf:verify` runs these checks against each generated PDF:

1. exactly one page;
2. page size is 612 x 1008 pt;
3. every organization, institution, highlight, skill category and section heading
   is present in the extracted text;
4. no `Fabrero`, `undefined`, `NaN` or `[object Object]`;
5. sections appear in reading order.

The content check is whitespace-insensitive, because line wrapping can split a
hyphenated word (`cross-` / `platform`) in the extracted text.

The PDF is rendered from a local HTTP server rather than `file://`, because the
pages reference fonts and assets with absolute URLs (`/_astro/...`) that do not
resolve against the filesystem. Serving the build keeps those URLs working, so
the PDF embeds the real web font instead of a system fallback.
