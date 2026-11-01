import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, join } from 'node:path';

const PATH_BINARIES = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'chrome'];

const KNOWN_BINARIES = [
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

const CACHE_ROOTS: Record<string, string> = {
  linux: join('.cache', 'ms-playwright'),
  darwin: join('Library', 'Caches', 'ms-playwright'),
  win32: join('AppData', 'Local', 'ms-playwright'),
};

const CACHE_LAYOUTS = [
  ['chrome-headless-shell-linux64', 'chrome-headless-shell'],
  ['chrome-linux64', 'chrome'],
  ['chrome-linux', 'chrome'],
  ['chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'],
  ['chrome-mac-arm64', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'],
  ['chrome-win64', 'chrome.exe'],
  ['chrome-win', 'chrome.exe'],
];

const CACHE_ENTRY = /^chromium(?:_headless_shell)?-(.+)$/;

type CacheEntry = {
  name: string;
  version: string;
  headless: boolean;
};

const parseCacheEntry = (name: string): CacheEntry | null => {
  const match = CACHE_ENTRY.exec(name);
  const version = match?.[1];
  if (version === undefined) return null;
  return { name, version, headless: name.startsWith('chromium_headless_shell-') };
};

const compareVersions = (left: string, right: string): number => {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);
  const length = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (rightParts[index] ?? 0) - (leftParts[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
};

const searchPath = (): string | null => {
  const directories = (process.env.PATH ?? '').split(delimiter).filter((entry) => entry.length > 0);
  for (const directory of directories) {
    for (const binary of PATH_BINARIES) {
      const candidate = join(directory, process.platform === 'win32' ? `${binary}.exe` : binary);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
};

const searchKnownLocations = (): string | null => {
  for (const candidate of KNOWN_BINARIES) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
};

const searchPlaywrightCache = (): string | null => {
  const relativeRoot = CACHE_ROOTS[process.platform];
  if (relativeRoot === undefined) return null;

  const root = join(homedir(), relativeRoot);
  if (!existsSync(root)) return null;

  const entries = readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => parseCacheEntry(entry.name))
    .filter((entry): entry is CacheEntry => entry !== null)
    .sort(
      (left, right) => compareVersions(left.version, right.version) || Number(right.headless) - Number(left.headless),
    );

  for (const entry of entries) {
    for (const layout of CACHE_LAYOUTS) {
      const candidate = join(root, entry.name, ...layout);
      if (existsSync(candidate)) return candidate;
    }
  }

  return null;
};

export const resolveChromium = (): string => {
  const override = process.env.CHROME_PATH;
  if (override !== undefined && override.length > 0) {
    if (!existsSync(override)) throw new Error(`CHROME_PATH points to a missing file: ${override}`);
    return override;
  }

  const found = searchPath() ?? searchKnownLocations() ?? searchPlaywrightCache();
  if (found === null) {
    throw new Error(
      [
        'No Chromium binary was found.',
        'Install Chrome/Chromium, set CHROME_PATH to its executable,',
        'or run `pnpm exec playwright install chromium`.',
        'Set SKIP_PDF=1 to build without generating PDFs.',
      ].join(' '),
    );
  }

  return found;
};
