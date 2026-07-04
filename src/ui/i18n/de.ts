// Single source of all UI copy (PRD §8) — adding a language later means
// adding a sibling dictionary with the same shape.

export const de = {
  common: {
    appName: 'Combo',
    loading: 'Wird geladen …',
    save: 'Speichern',
    cancel: 'Abbrechen',
    back: 'Zurück',
    next: 'Weiter',
    skip: 'Überspringen',
    delete: 'Löschen',
    confirm: 'Bestätigen',
    retry: 'Erneut versuchen',
    more: 'mehr',
    error: 'Etwas ist schiefgelaufen. Bitte versuche es erneut.',
    offline: 'Keine Verbindung. Prüfe dein Internet und versuche es erneut.',
  },

  validation: {
    email_invalid: 'Bitte gib eine gültige E-Mail-Adresse ein.',
    password_min: 'Das Passwort muss mindestens 8 Zeichen lang sein.',
    birth_date_invalid: 'Bitte gib dein Geburtsdatum an.',
    age_min: 'Du musst mindestens 16 Jahre alt sein, um Combo zu nutzen.',
    name_length: 'Der Name muss 2 bis 40 Zeichen lang sein.',
    city_required: 'Bitte wähle einen Ort aus der Liste.',
    bio_max: 'Die Bio darf höchstens 500 Zeichen lang sein.',
    title_length: 'Der Titel muss 3 bis 80 Zeichen lang sein.',
    description_length: 'Die Beschreibung muss 20 bis 1000 Zeichen lang sein.',
    radius_range: 'Der Radius muss zwischen 5 und 200 km liegen.',
    message_length: 'Nachrichten dürfen höchstens 2000 Zeichen lang sein.',
    reason_required: 'Bitte gib einen Grund an.',
    reason_max: 'Der Grund darf höchstens 1000 Zeichen lang sein.',
  },

  authErrors: {
    invalidCredentials: 'E-Mail oder Passwort ist falsch.',
    userExists: 'Mit dieser E-Mail existiert bereits ein Konto.',
    rateLimit: 'Zu viele Versuche. Bitte warte einen Moment.',
    emailNotConfirmed: 'Bitte bestätige zuerst deine E-Mail-Adresse.',
  },

  nav: {
    deck: 'Entdecken',
    matches: 'Matches',
    cards: 'Karten',
    settings: 'Profil',
  },

  auth: {
    loginTitle: 'Anmelden',
    signupTitle: 'Konto erstellen',
    email: 'E-Mail',
    password: 'Passwort',
    birthDate: 'Geburtsdatum',
    birthDateHint: 'Combo ist ab 16 Jahren. Dein Alter wird auf deinen Karten angezeigt.',
    login: 'Anmelden',
    signup: 'Registrieren',
    noAccount: 'Noch kein Konto?',
    haveAccount: 'Schon ein Konto?',
    forgotPassword: 'Passwort vergessen?',
    verifyTitle: 'Bestätige deine E-Mail',
    verifyText:
      'Wir haben dir einen Bestätigungslink geschickt. Öffne die E-Mail und klicke auf den Link, um weiterzumachen.',
    verifyResendHint: 'Nichts erhalten? Prüfe den Spam-Ordner oder registriere dich erneut.',
    backToLogin: 'Zurück zur Anmeldung',
    resetTitle: 'Passwort zurücksetzen',
    resetText: 'Gib deine E-Mail-Adresse ein. Wir schicken dir einen Link zum Zurücksetzen.',
    resetSend: 'Link senden',
    resetSent: 'E-Mail verschickt. Prüfe deinen Posteingang.',
    newPasswordTitle: 'Neues Passwort',
    newPassword: 'Neues Passwort',
    setPassword: 'Passwort speichern',
    resetLinkInvalid: 'Der Link ist ungültig oder abgelaufen. Fordere einen neuen an.',
    logout: 'Abmelden',
  },

  onboarding: {
    step1Title: 'Willkommen bei Combo!',
    step1Text: 'Erzähl uns kurz, wer du bist. Dein Ort wird nur als Stadtname angezeigt.',
    displayName: 'Anzeigename',
    city: 'Ort',
    bio: 'Über dich (optional)',
    bioPlaceholder: 'Was machst du gern? Woran arbeitest du?',
    radiusHint: 'Voreinstellung für deine Karten – pro Karte anpassbar.',
    step2Title: 'Dein Doodle',
    step2Text:
      'Zeichne dein Profilbild selbst – mit Finger oder Maus. Kein Foto, nur du und ein Stift.',
    step3Title: 'Fast geschafft!',
    step3Text: 'Erstelle deine erste Karte – oder schau dich zuerst um.',
    createFirstCard: 'Erste Karte erstellen',
    later: 'Später',
  },

  drawing: {
    pen: 'Stift',
    eraser: 'Radierer',
    undo: 'Rückgängig',
    clear: 'Alles löschen',
    rotate: 'Drehen',
    uploadFailed: 'Die Zeichnung konnte nicht gespeichert werden. Bitte versuche es erneut.',
  },

  cardTypes: {
    project: 'Projekt',
    collab_offer: 'Mitmachen',
    mentor_offer: 'Pate/Patin',
    projectExplainer: 'Ich habe eine Projektidee und suche Leute.',
    collabExplainer: 'Ich möchte bei einem Projekt mitmachen.',
    mentorExplainer: 'Ich begleite ein Projekt beratend als Pate oder Patin.',
  },

  cards: {
    title: 'Meine Karten',
    empty: 'Du hast noch keine Karten.',
    emptyHint: 'Erstelle eine Karte, um mit dem Swipen loszulegen.',
    newCard: 'Neue Karte',
    statusActive: 'Aktiv',
    statusPaused: 'Pausiert',
    matches: 'Matches',
    pause: 'Pausieren',
    resume: 'Aktivieren',
    edit: 'Bearbeiten',
    deleteTitle: 'Karte löschen?',
    deleteText:
      'Die Karte verschwindet aus allen Decks. Bestehende Chats bleiben lesbar, werden aber archiviert.',
  },

  cardForm: {
    createTitle: 'Neue Karte',
    editTitle: 'Karte bearbeiten',
    type: 'Kartentyp',
    typeLocked: 'Der Typ kann nach dem Erstellen nicht geändert werden.',
    cardTitle: 'Titel',
    titlePlaceholder: 'z. B. Kurzfilm über Quartierläden',
    description: 'Beschreibung',
    descriptionPlaceholder: 'Worum geht es? Wen suchst du? Was bringst du mit?',
    city: 'Ort',
    radius: 'Umkreis',
    visibility: 'Wer soll deine Karte sehen?',
    showCollaborators: 'Mitmacher:innen',
    showMentors: 'Paten und Patinnen',
    drawingTitle: 'Doodle für diese Karte',
    drawingKeep: 'Aktuelles Doodle',
    drawingRedraw: 'Neu zeichnen',
    create: 'Karte erstellen',
  },

  deck: {
    title: 'Entdecken',
    swipingAs: 'Du swipst als:',
    like: 'Gefällt mir',
    pass: 'Weiter',
    noCards: 'Keine Karte, kein Deck',
    noCardsText: 'Erstelle zuerst eine eigene Karte, um Projekte und Leute zu entdecken.',
    createCard: 'Karte erstellen',
    empty: 'Alles gesehen!',
    emptyText:
      'Gerade gibt es keine neuen Karten in deinem Umkreis. Vergrössere den Radius deiner Karte oder schau später wieder vorbei.',
    emptyProjectHint: 'Tipp: Prüfe auch, ob deine Karte Mitmacher:innen und Paten zulässt.',
    reload: 'Neu laden',
  },

  match: {
    title: 'Ein Match!',
    text: 'Ihr habt euch gegenseitig geliked.',
    sayHello: 'Hallo sagen',
    keepSwiping: 'Weiter swipen',
  },

  matches: {
    title: 'Matches',
    empty: 'Noch keine Matches',
    emptyText: 'Swipe weiter – sobald es ein gegenseitiges Like gibt, erscheint dein Match hier.',
    newMatch: 'Neues Match – sag hallo!',
    archived: 'Archiviert',
    asCard: 'als',
  },

  chat: {
    placeholder: 'Nachricht schreiben …',
    send: 'Senden',
    archivedBanner: 'Dieser Chat ist archiviert. Du kannst keine Nachrichten mehr senden.',
    notFound: 'Dieser Chat existiert nicht mehr.',
    viewCard: 'Karte ansehen',
    today: 'Heute',
  },

  safety: {
    block: 'Blockieren',
    blockTitle: 'Person blockieren?',
    blockText:
      'Ihr seht euch gegenseitig nicht mehr. Alle gemeinsamen Chats werden archiviert. Die Person wird nicht benachrichtigt.',
    blocked: 'Person blockiert.',
    report: 'Melden',
    reportTitle: 'Melden',
    reportText: 'Beschreibe kurz, was passiert ist. Wir schauen uns das an.',
    reportReason: 'Grund',
    reportSent: 'Danke für deine Meldung. Wir kümmern uns darum.',
  },

  settings: {
    title: 'Profil',
    editProfile: 'Profil bearbeiten',
    changeEmail: 'E-Mail ändern',
    newEmail: 'Neue E-Mail',
    emailChangeSent: 'Bestätigungslink an die neue Adresse geschickt.',
    changePassword: 'Passwort ändern',
    passwordChanged: 'Passwort geändert.',
    legal: 'Rechtliches',
    privacy: 'Datenschutz',
    terms: 'AGB',
    imprint: 'Impressum',
    deleteAccount: 'Konto löschen',
    deleteTitle1: 'Konto wirklich löschen?',
    deleteText1:
      'Alle deine Karten, Matches, Chats und Zeichnungen werden endgültig gelöscht. Das kann nicht rückgängig gemacht werden.',
    deleteTitle2: 'Letzte Bestätigung',
    deleteText2: 'Bist du sicher? Dein Konto und alle Daten werden sofort und dauerhaft gelöscht.',
    deleteConfirm: 'Endgültig löschen',
    profileSaved: 'Gespeichert.',
    myDoodle: 'Mein Doodle',
  },

  city: {
    placeholder: 'Ort suchen …',
    useLocation: 'Meinen Standort verwenden',
    locating: 'Standort wird ermittelt …',
    locationError: 'Standort konnte nicht ermittelt werden.',
    searchError: 'Ortssuche momentan nicht verfügbar. Bitte versuche es später.',
    noResults: 'Kein Ort gefunden.',
  },

  legal: {
    placeholderNote:
      'Platzhalter – der finale Rechtstext wird vom Betreiber eingesetzt.',
    privacyTitle: 'Datenschutzerklärung',
    termsTitle: 'Allgemeine Geschäftsbedingungen',
    imprintTitle: 'Impressum',
  },
} as const

export function validationMessage(key: string): string {
  const messages = de.validation as Record<string, string>
  return messages[key] ?? de.common.error
}
