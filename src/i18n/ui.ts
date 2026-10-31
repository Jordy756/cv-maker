import en from '../data/en.json' with { type: 'json' };
import es from '../data/es.json' with { type: 'json' };

const meta = {
  en: {
    'meta.name': '{{name}}',
    'meta.title': '{{name}} | Full Stack Developer Portfolio',
    'meta.description':
      'Full Stack Developer Portfolio by {{name}}. Explore experience, projects, certifications, and skills in a single page.',
    'meta.locale': 'en_US',
  },
  es: {
    'meta.name': '{{name}}',
    'meta.title': '{{name}} | Portafolio de Desarrollador Full Stack',
    'meta.description':
      'Portafolio de Desarrollador Full Stack de {{name}}. Explorá experiencia, proyectos, certificaciones y habilidades en una sola página.',
    'meta.locale': 'es_ES',
  },
} as const;

const sections = {
  en: {
    'summary.title': 'Professional summary',
    'experience.title': 'Professional experience',
    'education.title': 'Education',
    'skills.title': 'Technical skills',
  },
  es: {
    'summary.title': 'Perfil profesional',
    'experience.title': 'Experiencia profesional',
    'education.title': 'Educación',
    'skills.title': 'Habilidades técnicas',
  },
} as const;

const labels = {
  en: {
    'labels.present': 'Present',
  },
  es: {
    'labels.present': 'Actualidad',
  },
} as const;

export const ui = {
  en: {
    ...meta.en,
    ...sections.en,
    ...labels.en,
  },
  es: {
    ...meta.es,
    ...sections.es,
    ...labels.es,
  },
} as const;

export const content = { en, es } as const;
