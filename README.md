# cv-maker

Generates my CV as a PDF from code: Astro renders the page, Playwright prints it.
No Word, no LaTeX.

Output:

```
pdf/Yordi_Castro_CV_ES.pdf
pdf/Yordi_Castro_CV_EN.pdf
```

## Requirements

- Node.js >= 22.23.4 (the PDF script relies on native TypeScript stripping)
- pnpm
- `poppler-utils` (`pdfinfo`, `pdftotext`) for the verification step

```sh
pnpm install
pnpm exec playwright install chromium
```

## Commands

| Command           | Action                                                 |
| :---------------- | :----------------------------------------------------- |
| `pnpm dev`        | Dev server with a live preview of the page             |
| `pnpm build`      | Build the static pages into `dist/`                    |
| `pnpm pdf`        | Build, render both PDFs, then verify them              |
| `pnpm pdf:verify` | Verify the existing PDFs only (page count, size, text) |
| `pnpm format`     | Format the repository with Prettier                    |

`node scripts/pdf.ts --no-verify` renders without running the checks.

## Structure

```
src/
├── data/
│   ├── es.json          content, Spanish
│   └── en.json          content, English
├── lib/cv.ts            types and date formatting
├── styles/cv.css        all layout and typography
├── layouts/CvLayout.astro
├── components/          header, section, experience, education, skills
└── pages/[locale].astro one route per locale: /es/ and /en/
scripts/pdf.ts           render + verify
```

Content lives only in `src/data/*.json`. Add a locale by dropping a new JSON file
in `src/data/` and adding its key to `datasets` and `getStaticPaths` in
`src/pages/[locale].astro`.

## How the style was derived

The geometry is measured from the previous PDFs, not approximated. Both were
612 x 1008 pt (8.5in x 14in, US Legal) with a single page, so the CSS reproduces
that page size, the 26.7pt / 15.5pt horizontal margins, the 11.33pt body with
13.3pt leading, 12pt uppercase section headings, a 24pt centred name, and
bullets whose marker sits at 18pt and whose text starts at 36pt.

The previous PDFs mixed five embedded fonts (`Calibri`, `STIXTwoText` in three
styles, `ArialMT`). The body was set in STIX Two Text, a Times-like serif, with
Arial only for the bullet glyph. STIX Two Text is not installed on this machine,
so the stylesheet uses `Liberation Serif`, which is metric-compatible with Times
New Roman: the summary paragraph wraps on the same words as the original.

## Why the page is US Legal

The content fits in one page only at 8.5in x 14in. Switching to A4 or Letter
pushes the last skills lines onto a second page.

## ATS notes

- Single column, no tables, no floats. Text order in the PDF matches reading order.
- Real text, not images: every string is selectable and extractable.
- `pnpm pdf` fails if the PDF is not exactly one page, if the page size drifts, if
  any expected content string is missing, or if a placeholder leaks into the output.
- Section headings are standard (`Professional summary`, `Professional experience`,
  `Education`, `Technical skills`) so parsers can classify them.

## Verification

`pnpm pdf:verify` runs these checks against each generated PDF:

1. exactly one page;
2. page size is 612 x 1008 pt;
3. every organization, institution, highlight, skill category and section heading
   is present in the extracted text;
4. no `Fabrero`, `undefined`, `NaN` or `[object Object]`;
5. sections appear in reading order.

The check is whitespace-insensitive, because line wrapping can split a hyphenated
word (`cross-` / `platform`) in the extracted text.
