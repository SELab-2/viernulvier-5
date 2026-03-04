export type Locale = 'nl' | 'en'

export type Messages = {
  common: {
    loading: string
  }
  nav: {
    home: string
    archive: string
    searchAriaLabel: string
    searchPlaceholder: string
  }
  home: {
    title: string
    intro: string
    heroTagline: string
    heroTitleTop: string
    heroTitleAccent: string
    heroTitleBottom: string
    searchYear: string
    searchGenre: string
    searchLocation: string
    searchButton: string
  }
  auth: {
    loginTitle: string
    usernameLabel: string
    passwordLabel: string
    submit: string
    loginFailed: string
  }
  footer: {
    about: string
    navigationTitle: string
    navHome: string
    navAgenda: string
    navArchiveSearch: string
    navAbout: string
    contactTitle: string
    newsletterTitle: string
    newsletterText: string
    newsletterPlaceholder: string
    newsletterSubmit: string
    privacy: string
    cookies: string
    disclaimer: string
    rights: string
  }
}
