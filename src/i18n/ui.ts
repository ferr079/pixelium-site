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
    'nav.ctf': 'CTF',
    'nav.infra': 'Infra',
    'nav.status': 'Statut',
    'nav.about': 'À propos',

    // Common
    'common.dot': '.',
  },
  en: {
    // Nav
    'nav.projets': 'Projects',
    'nav.securite': 'Security',
    'nav.ctf': 'CTF',
    'nav.infra': 'Infra',
    'nav.status': 'Status',
    'nav.about': 'About',

    // Common
    'common.dot': '.',
  },
} as const;
