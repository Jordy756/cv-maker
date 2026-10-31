export interface Basics {
  name: string;
  location: string;
  portfolioLabel: string;
  portfolioUrl: string;
  phone: string;
  email: string;
}

export interface Labels {
  summary: string;
  experience: string;
  education: string;
  skills: string;
  present: string;
}

export interface ExperienceEntry {
  organization: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string | null;
  highlights: string[];
}

export interface EducationEntry {
  institution: string;
  area: string;
  location: string;
  startDate: string;
  endDate: string | null;
}

export interface SkillGroup {
  category: string;
  items: string[];
}

export interface CvData {
  locale: string;
  htmlLang: string;
  pageTitle: string;
  pdfFileName: string;
  labels: Labels;
  basics: Basics;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillGroup[];
}

const MONTHS: Record<string, string[]> = {
  es: [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ],
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
};

export const formatMonth = (iso: string, locale: string): string => {
  const [year, month] = iso.split('-').map(Number);
  const names = MONTHS[locale] ?? MONTHS.en;
  return `${names[month - 1]} ${year}`;
};

export const formatRange = (
  start: string,
  end: string | null,
  locale: string,
  presentLabel: string,
): string => {
  const from = formatMonth(start, locale);
  const to = end ? formatMonth(end, locale) : presentLabel;
  return `${from} – ${to}`;
};
