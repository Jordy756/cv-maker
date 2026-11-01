import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { extname, isAbsolute, join, normalize, relative } from 'node:path';

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

export type StaticServer = {
  origin: string;
  close: () => Promise<void>;
};

const resolveTarget = (root: string, pathname: string): string | null => {
  const requested = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
  const target = join(root, normalize(requested));
  const parent = relative(root, target);
  if (parent.startsWith('..') || isAbsolute(parent)) return null;
  return target;
};

export const startServer = async (root: string): Promise<StaticServer> => {
  const server = createServer(async (request, response) => {
    if (request.url === undefined) {
      response.writeHead(400);
      response.end('bad request');
      return;
    }

    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const target = resolveTarget(root, pathname);

    if (target === null) {
      response.writeHead(403);
      response.end('forbidden');
      return;
    }

    try {
      const body = await readFile(target);
      response.writeHead(200, { 'Content-Type': CONTENT_TYPES[extname(target)] ?? 'application/octet-stream' });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end('not found');
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address() as AddressInfo;

  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      }),
  };
};
