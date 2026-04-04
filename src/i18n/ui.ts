export const languages = {
  en: 'EN',
  fr: 'FR',
} as const;

export const defaultLang = 'en' as const;

export const ui = {
  fr: {
    // Nav
    'nav.projets': 'Projets',
    'nav.securite': 'Sécurité',
    'nav.infra': 'Infra',
    'nav.about': 'À propos',
    'nav.status': 'Statut',

    // Common
    'common.dot': '.',
  },
  en: {
    // Nav
    'nav.projets': 'Projects',
    'nav.securite': 'Security',
    'nav.infra': 'Infra',
    'nav.about': 'About',
    'nav.status': 'Status',

    // Common
    'common.dot': '.',
  },
} as const;
