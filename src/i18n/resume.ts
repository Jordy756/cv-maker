import type { CvData } from '../lib/cv.ts';
import { content } from './ui.ts';
import type { Locale } from './utils.ts';

export const useResume = (locale: Locale): CvData => content[locale] as unknown as CvData;
