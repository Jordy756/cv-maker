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

export const formatRange = (start: string, end: string | null, locale: string, presentLabel: string): string => {
  const from = formatMonth(start, locale);
  const to = end ? formatMonth(end, locale) : presentLabel;
  return `${from} – ${to}`;
};
