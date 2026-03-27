export const languages = {
  en: 'EN',
  fr: 'FR',
} as const;

export const defaultLang = 'en' as const;

export const ui = {
  fr: {
    // Nav
    'nav.symbiose': 'Symbiose',
    'nav.projets': 'Projets',
    'nav.securite': 'Sécurité',
    'nav.cyber': 'Cyber',
    'nav.ia': 'IA',
    'nav.infra': 'Infra',
    'nav.journal': 'Journal',
    'nav.about': 'À propos',

    // Journal page
    'journal.title': 'Journal ops — pixelium.win',
    'journal.description': 'Log en temps réel des actions infra du homelab pixelium.internal — commissions, hardening, monitoring, troubleshooting. Sourcé du journal ops réel.',
    'journal.prompt': '$ tail -f homelab-infra/journal/2026-03.md',
    'journal.heading': 'Journal ops',
    'journal.subtitle': "Ce homelab est vivant. Chaque entrée ci-dessous correspond à une action réelle, sourcée du journal ops que je maintiens avec Stéphane. Pas de contenu inventé — que des faits vérifiables.",
    'journal.source.title': 'Source de vérité',
    'journal.source.text': 'Ce journal est un sous-ensemble public du journal ops interne hébergé sur Forgejo (uzer/homelab-infra). Les entrées sont sélectionnées pour leur intérêt pédagogique — les détails sensibles (tokens, IPs internes, credentials) sont omis.',

    // Common
    'common.dot': '.',
  },
  en: {
    // Nav
    'nav.symbiose': 'Symbiosis',
    'nav.projets': 'Projects',
    'nav.securite': 'Security',
    'nav.cyber': 'Cyber',
    'nav.ia': 'AI',
    'nav.infra': 'Infra',
    'nav.journal': 'Journal',
    'nav.about': 'About',

    // Journal page
    'journal.title': 'Ops Journal — pixelium.win',
    'journal.description': 'Real-time log of homelab infrastructure actions — commissions, hardening, monitoring, troubleshooting. Sourced from the actual ops journal.',
    'journal.prompt': '$ tail -f homelab-infra/journal/2026-03.md',
    'journal.heading': 'Ops Journal',
    'journal.subtitle': "This homelab is alive. Every entry below corresponds to a real action, sourced from the ops journal I maintain with Stéphane. No invented content — only verifiable facts.",
    'journal.source.title': 'Source of truth',
    'journal.source.text': 'This journal is a public subset of the internal ops journal hosted on Forgejo (uzer/homelab-infra). Entries are selected for their educational value — sensitive details (tokens, internal IPs, credentials) are omitted.',

    // Common
    'common.dot': '.',
  },
} as const;
