import { mkdir, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { resolveChromium } from './browser.ts';
import { renderPdf } from './render.ts';
import { startServer } from './server.ts';

type PrintableDocument = {
  locale: string;
  pdfFileName: string;
};

const isPrintableDocument = (value: unknown): value is PrintableDocument => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<PrintableDocument>;
  return typeof candidate.locale === 'string' && typeof candidate.pdfFileName === 'string';
};

const readDocuments = async (directory: string): Promise<PrintableDocument[]> => {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const documents: PrintableDocument[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const raw = await readFile(join(directory, entry.name), 'utf8').catch(() => null);
    if (raw === null) continue;
    const parsed: unknown = JSON.parse(raw);
    if (isPrintableDocument(parsed)) documents.push(parsed);
  }

  return documents;
};

const normalizePathname = (pathname: string): string => pathname.replace(/\/+$/, '');

export const pdfExport = (): AstroIntegration => {
  let projectRoot = process.cwd();
  let dataDirectory = join(process.cwd(), 'src', 'data');

  return {
    name: 'cv-pdf',
    hooks: {
      'astro:config:done': ({ config }) => {
        projectRoot = fileURLToPath(config.root);
        dataDirectory = join(fileURLToPath(config.srcDir), 'data');
      },
      'astro:build:done': async ({ dir, pages, logger }) => {
        if (process.env.SKIP_PDF === '1') {
          logger.info('SKIP_PDF=1, skipping PDF generation');
          return;
        }

        const pagesByLocale = new Map(pages.map((page) => [normalizePathname(page.pathname), page]));
        const documents = await readDocuments(dataDirectory);
        const targets = documents.flatMap((document) => {
          const page = pagesByLocale.get(normalizePathname(`${document.locale}/`));
          if (page === undefined) return [];
          return [{ document, pathname: page.pathname }];
        });

        if (targets.length === 0) {
          logger.warn(`No generated page matched a locale declared in ${dataDirectory}`);
          return;
        }

        const binary = resolveChromium();
        const outputRoot = join(projectRoot, 'pdf');
        await mkdir(outputRoot, { recursive: true });

        const server = await startServer(fileURLToPath(dir));

        try {
          for (const { document, pathname } of targets) {
            const output = join(outputRoot, document.pdfFileName);
            await renderPdf({ binary, url: `${server.origin}/${pathname}`, output });
            logger.info(`pdf/${document.pdfFileName}`);
          }
        } finally {
          await server.close();
        }
      },
    },
  };
};

export default pdfExport;
