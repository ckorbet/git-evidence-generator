/**
 * Shared i18next resource bundle keys, used by both the renderer (via react-i18next)
 * and the main process (headless i18next instance for PDF report label resolution).
 * Keeping this in `core` means both sides import the exact same key set - a
 * TypeScript compile error surfaces any missing/renamed key immediately.
 */
export const en = {
  app: {
    name: 'Git Evidence Generator'
  },
  nav: {
    dashboard: 'Dashboard',
    profiles: 'Profiles',
    generateReport: 'Generate Evidence Report',
    settings: 'Settings'
  },
  profileSelector: {
    label: 'Active profile',
    none: 'No profile selected',
    createFirst: 'Create your first profile to get started'
  },
  profiles: {
    title: 'Profiles',
    create: 'New profile',
    rename: 'Rename',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    nameLabel: 'Profile name',
    duplicateNameError: 'A profile with this name already exists.',
    confirmDelete: 'Delete this profile? This cannot be undone.',
    emptyState: 'No profiles yet. Create one to start tracking evidence.',
    repositoriesLabel: 'Repositories (one per line: <url> [branch])',
    peopleLabel: 'Tracked people (one per line: Name: alias1, alias2)',
    blacklistLabel: 'Blacklisted words (one per line)',
    extensionWhitelistLabel: 'File extension whitelist (one per line, e.g. .ts)',
    usernameLabel: 'Git username',
    patLabel: 'Personal Access Token'
  },
  generateReport: {
    title: 'Generate Evidence Report',
    dateFrom: 'From',
    dateTo: 'To',
    generate: 'Generate PDF',
    generating: 'Generating…',
    noProfileSelected: 'Select or create a profile before generating a report.',
    progressCloning: 'Cloning…',
    progressScanning: 'Scanning commits…',
    progressDone: 'Done',
    progressFailed: 'Failed',
    summaryTitle: 'Generation complete',
    summaryFilesGenerated: '{{count}} report(s) generated',
    summarySkippedBinary: '{{count}} binary file(s) were skipped',
    summaryFailedRepositories: '{{count}} repository(ies) failed'
  },
  dashboard: {
    title: 'Dashboard',
    historyEmpty: 'No reports generated yet for this profile.',
    generatedOn: 'Generated on',
    open: 'Open',
    regenerate: 'Regenerate',
    fileMissing: 'File no longer exists at its saved location.'
  },
  settings: {
    title: 'Settings',
    appearance: 'Appearance',
    appearanceSystem: 'System',
    appearanceDark: 'Dark',
    appearanceLight: 'Light',
    language: 'Language',
    languageEnglish: 'English',
    languageSpanish: 'Spanish',
    outputDirectory: 'Output directory',
    chooseFolder: 'Choose folder'
  },
  report: {
    title: 'Evidence Report — {{person}}',
    generatedOn: 'Generated on',
    dateRange: 'Date range',
    totalCommits: 'Total commits',
    repositoriesTouched: 'Repositories touched',
    linesAdded: 'Lines added',
    linesRemoved: 'Lines removed',
    failedRepositories: 'Failed repositories',
    skippedBinaryFiles: 'Skipped binary files',
    indexSectionTitle: 'Commit Index',
    detailSectionTitle: 'Commit Detail',
    author: 'Author',
    noFailedRepositories: 'None',
    noSkippedFiles: 'None'
  },
  errors: {
    title: 'Something went wrong',
    dismiss: 'Dismiss',
    unexpected: 'An unexpected error occurred. Please try again.'
  }
} as const

export const es = {
  app: {
    name: 'Generador de Evidencias Git'
  },
  nav: {
    dashboard: 'Panel',
    profiles: 'Perfiles',
    generateReport: 'Generar Informe de Evidencia',
    settings: 'Configuración'
  },
  profileSelector: {
    label: 'Perfil activo',
    none: 'Ningún perfil seleccionado',
    createFirst: 'Crea tu primer perfil para comenzar'
  },
  profiles: {
    title: 'Perfiles',
    create: 'Nuevo perfil',
    rename: 'Renombrar',
    delete: 'Eliminar',
    save: 'Guardar',
    cancel: 'Cancelar',
    nameLabel: 'Nombre del perfil',
    duplicateNameError: 'Ya existe un perfil con este nombre.',
    confirmDelete: '¿Eliminar este perfil? Esta acción no se puede deshacer.',
    emptyState: 'Aún no hay perfiles. Crea uno para empezar a registrar evidencias.',
    repositoriesLabel: 'Repositorios (uno por línea: <url> [rama])',
    peopleLabel: 'Personas rastreadas (una por línea: Nombre: alias1, alias2)',
    blacklistLabel: 'Palabras en lista negra (una por línea)',
    extensionWhitelistLabel: 'Extensiones permitidas (una por línea, ej. .ts)',
    usernameLabel: 'Usuario de Git',
    patLabel: 'Token de Acceso Personal'
  },
  generateReport: {
    title: 'Generar Informe de Evidencia',
    dateFrom: 'Desde',
    dateTo: 'Hasta',
    generate: 'Generar PDF',
    generating: 'Generando…',
    noProfileSelected: 'Selecciona o crea un perfil antes de generar un informe.',
    progressCloning: 'Clonando…',
    progressScanning: 'Analizando commits…',
    progressDone: 'Completado',
    progressFailed: 'Fallido',
    summaryTitle: 'Generación completada',
    summaryFilesGenerated: '{{count}} informe(s) generado(s)',
    summarySkippedBinary: 'Se omitieron {{count}} archivo(s) binario(s)',
    summaryFailedRepositories: '{{count}} repositorio(s) fallaron'
  },
  dashboard: {
    title: 'Panel',
    historyEmpty: 'Aún no se han generado informes para este perfil.',
    generatedOn: 'Generado el',
    open: 'Abrir',
    regenerate: 'Regenerar',
    fileMissing: 'El archivo ya no existe en su ubicación guardada.'
  },
  settings: {
    title: 'Configuración',
    appearance: 'Apariencia',
    appearanceSystem: 'Sistema',
    appearanceDark: 'Oscuro',
    appearanceLight: 'Claro',
    language: 'Idioma',
    languageEnglish: 'Inglés',
    languageSpanish: 'Español',
    outputDirectory: 'Carpeta de salida',
    chooseFolder: 'Elegir carpeta'
  },
  report: {
    title: 'Informe de Evidencia — {{person}}',
    generatedOn: 'Generado el',
    dateRange: 'Rango de fechas',
    totalCommits: 'Total de commits',
    repositoriesTouched: 'Repositorios afectados',
    linesAdded: 'Líneas añadidas',
    linesRemoved: 'Líneas eliminadas',
    failedRepositories: 'Repositorios fallidos',
    skippedBinaryFiles: 'Archivos binarios omitidos',
    indexSectionTitle: 'Índice de Commits',
    detailSectionTitle: 'Detalle de Commits',
    author: 'Autor',
    noFailedRepositories: 'Ninguno',
    noSkippedFiles: 'Ninguno'
  },
  errors: {
    title: 'Algo salió mal',
    dismiss: 'Descartar',
    unexpected: 'Ocurrió un error inesperado. Por favor, inténtelo de nuevo.'
  }
} as const

export const i18nResources = { en: { translation: en }, es: { translation: es } }

/** Deep key paths of the English bundle - the canonical shape every language must match. */
export type TranslationSchema = typeof en
