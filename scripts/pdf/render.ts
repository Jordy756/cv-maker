import { spawn } from 'node:child_process';

type RenderOptions = {
  binary: string;
  url: string;
  output: string;
};

export const renderPdf = ({ binary, url, output }: RenderOptions): Promise<void> =>
  new Promise((resolve, reject) => {
    const args = [
      '--headless',
      '--disable-gpu',
      '--no-pdf-header-footer',
      '--virtual-time-budget=15000',
      `--print-to-pdf=${output}`,
      url,
    ];

    const child = spawn(binary, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let diagnostics = '';

    child.stderr?.on('data', (chunk: Buffer) => {
      diagnostics += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Chromium exited with code ${code}: ${diagnostics.trim()}`));
    });
  });
