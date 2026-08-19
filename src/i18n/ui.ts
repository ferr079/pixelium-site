export const languages = {
  en: 'EN',
  fr: 'FR',
} as const;

export const defaultLang = 'en' as const;

// Locale de formatage par langue. Sans elle, `toLocaleString()` suit la locale
// de la MACHINE QUI BUILD, pas celle de la page : le site rendait `#15,486` sur
// /fr/ctf (séparateur anglais), et n'était correct en anglais que par accident
// — parce que le runner CI tourne en en-US. Un build lancé depuis un poste
// français aurait mis l'espace fine sur la page anglaise, sans rien signaler.
// Constaté le 2026-08-20 en comparant un build local à la production (#83).
export const locales = {
  en: 'en-US',
  fr: 'fr-FR',
} as const;

export const ui = {
  fr: {
    // Nav
    'nav.projets': 'Projets',
    'nav.securite': 'Sécurité',
    'nav.ctf': 'CTF',
    'nav.infra': 'Infra',
    'nav.contributions': 'Contributions',
    'nav.status': 'Statut',

    // Common
    'common.dot': '.',
  },
  en: {
    // Nav
    'nav.projets': 'Projects',
    'nav.securite': 'Security',
    'nav.ctf': 'CTF',
    'nav.infra': 'Infra',
    'nav.contributions': 'Contributions',
    'nav.status': 'Status',

    // Common
    'common.dot': '.',
  },
} as const;
