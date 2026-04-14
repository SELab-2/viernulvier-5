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
    navAriaLabel: string
    openMenuLabel: string
    closeMenuLabel: string
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
    popularTagsLabel: string
    popularTagsMore: string
    popularTags: string[]
    latestBlogHeading: string
    latestBlogSubheading: string
    latestBlogTitle: string
    latestBlogParagraphOne: string
    latestBlogParagraphTwoTitle: string
    latestBlogParagraphTwo: string
    latestBlogReadMore: string
    latestBlogViewAll: string
    recentDigitizedHeading: string
    recentDigitizedViewItem: string
    recentDigitizedViewAll: string
    recentDigitizedItems: Array<{
      dateLabel: string
      archiveLabel: string
      title: string
      description: string
    }>
  }
  auth: {
    localeToggleLabel: string
    darkModeLabel: string
    lightModeLabel: string
    adminLabel: string
    loginTitle: string
    loginSubtitle: string
    usernameLabel: string
    usernamePlaceholder: string
    passwordLabel: string
    passwordPlaceholder: string
    rememberMeLabel: string
    submit: string
    submitting: string
    loginFailed: string
    invalidCredentials: string
    rateLimitReached: string
    navigationTitle: string
    dashboardLabel: string
    productionsLabel: string
    statisticsLabel: string
    archiveLabel: string
    logoutLabel: string
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
